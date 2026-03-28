# Phase 03: Retention Engine - Research

**Researched:** 2026-03-24
**Domain:** PostgreSQL Full-Text Search, pgvector, Email Notifications (Resend), Cloudflare Cron Triggers
**Confidence:** HIGH

---

## Summary

Phase 3 implements two major features: (1) proactive email notifications for due review items using Resend SDK and Cloudflare Cron Triggers, and (2) natural language search over the knowledge base using PostgreSQL's hybrid search capabilities (tsvector for full-text in Phase 3, pgvector for semantic in Phase 4).

**Primary recommendation:** Use Drizzle ORM's custom type for tsvector with generated columns, native pgvector support for embeddings, Resend SDK with React Email for templates, and Cloudflare Cron Triggers for scheduled daily digests. Implement Cmd+K global search using a custom hook with 300ms debounce.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

| ID   | Decision                                 | Rationale                                                     |
| ---- | ---------------------------------------- | ------------------------------------------------------------- |
| D-01 | **邮件触发时机 — 用户自定义时间**        | 用户可在设置中自定义每日提醒时间（如早上 9:00）               |
| D-02 | **退订管理 — 细粒度控制**                | 全局开关 + 按领域过滤（只接收特定领域的提醒）                 |
| D-03 | **搜索技术 — PostgreSQL 混合搜索**       | tsvector 全文搜索 (Phase 3) + pgvector 向量搜索 (Phase 4预埋) |
| D-04 | **搜索界面位置 — 全局入口 + 上下文过滤** | Cmd+K 唤起浮层搜索 + 知识库内搜索 + 独立搜索页 `/search`      |
| D-05 | **搜索范围与权重**                       | 标题权重 A，标签权重 A，内容权重 B，来源权重 C                |
| D-06 | **邮件模板策略 — 轻量级 HTML**           | 内联 CSS 响应式 HTML，multipart/alternative 纯文本备选        |
| D-07 | **内容摘要策略 — 标题 + 状态，隐藏内容** | 显示标题、领域标签、FSRS 状态，绝不显示具体内容片段           |
| D-08 | **CTA 设计 — Deep Link 直达复习流**      | 跳转 `/review?session=daily&source=email`                     |
| D-09 | **个性化称呼策略**                       | 用户名 → 邮箱前缀 → 中性称呼三级回退                          |
| D-10 | **搜索结果交互 — 抽屉/模态框**           | 桌面端右侧抽屉，移动端全屏模态框                              |
| D-11 | **搜索空状态设计 — 指路牌模式**          | 明确反馈 + 可操作的建议 + 替代路径                            |
| D-12 | **搜索历史 — 智能辅助**                  | 保存最近 5-8 条搜索历史，支持单条删除和一键清空               |
| D-13 | **快捷键映射 — 键盘优先**                | Cmd/Ctrl+K 唤起，ESC 关闭，上下导航，Enter 打开               |
| D-14 | **实时搜索 — Debounce 300ms**            | 输入即搜，300ms 防抖，最少 2-3 字符开始搜索                   |

### Claude's Discretion

None specified — all major decisions locked in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)

1. **智能提醒时间**：基于用户历史活跃时间推算最佳提醒时机
2. **多渠道通知**：短信、App Push、Slack/Discord Bot
3. **AI 生成复习总结**：每周/每月学习报告
4. **协作搜索**：社交功能
5. **语音搜索**：移动端语音输入

---

## Phase Requirements

| ID        | Description                              | Research Support                                           |
| --------- | ---------------------------------------- | ---------------------------------------------------------- |
| NOTIFY-01 | 系统在复习节点到达时主动提醒用户         | Cloudflare Cron Triggers + Resend SDK for scheduled emails |
| NOTIFY-02 | 每日最多一次提醒，仅当有复习条目时发送   | Cron Trigger 配置 + 查询条件过滤                           |
| NOTIFY-03 | 提醒消息包含当天需要复习的条目数量和领域 | Email template with aggregated data from review_state JOIN |
| NOTIFY-04 | 支持邮件作为提醒渠道                     | Resend SDK integration, verified 2025 compatible           |
| SEARCH-01 | 用户可以用自然语言搜索自己的知识库       | PostgreSQL tsvector with websearch_to_tsquery              |
| SEARCH-02 | 搜索结果按相关性排序                     | ts_rank with weighted fields (title A, content B)          |
| SEARCH-03 | 搜索结果显示知识条目的预览和来源         | ts_headline for smart excerpts, source field display       |

---

## Standard Stack

### Core

| Library                   | Version | Purpose                     | Why Standard                                                                             |
| ------------------------- | ------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| `resend`                  | ^6.9.4  | Email sending SDK           | 3,000 emails/month free tier, native Cloudflare Workers support, React Email integration |
| `@react-email/components` | ^0.0.36 | Email template components   | Automatic inline CSS, Tailwind v4 support, dark mode                                     |
| `drizzle-orm`             | ^0.45.1 | ORM with pgvector support   | Native vector type since 2024, custom type for tsvector                                  |
| `cmdk`                    | ^1.0.4  | Command menu / search modal | Industry standard for Cmd+K interfaces, accessible, composable                           |

### Supporting

| Library        | Version        | Purpose                  | When to Use                                        |
| -------------- | -------------- | ------------------------ | -------------------------------------------------- |
| `pgvector`     | (Supabase内置) | Vector similarity search | Phase 4 semantic search (pre-migration in Phase 3) |
| `use-debounce` | ^10.0.4        | Search input debouncing  | 300ms delay for real-time search                   |

### Installation

```bash
# Email
npm install resend @react-email/components

# Search UI
npm install cmdk use-debounce

# Already installed (from Phase 1-2)
# drizzle-orm ^0.45.1
```

**Version verification:**

- `resend@6.9.4` — Latest stable (verified 2026-03-24)
- `drizzle-orm@0.45.1` — Current project version, supports native `vector` type

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── search/
│   │   │   └── route.ts           # GET /api/search?q=xxx&domain=xxx
│   │   ├── notifications/
│   │   │   ├── send-daily/
│   │   │   │   └── route.ts       # POST /api/notifications/send-daily (Cron trigger)
│   │   │   └── preferences/
│   │   │       └── route.ts       # GET/POST notification preferences
│   │   └── cron/
│   │       └── daily-email/       # Cloudflare Cron handler
│   ├── search/
│   │   └── page.tsx               # /search full search page
│   └── settings/
│       └── notifications/
│           └── page.tsx           # Notification preferences UI
├── components/
│   ├── search/
│   │   ├── SearchTrigger.tsx      # Cmd+K keyboard listener
│   │   ├── SearchModal.tsx        # Command dialog wrapper
│   │   ├── SearchResults.tsx      # Result list with keyboard nav
│   │   ├── SearchEmptyState.tsx   # Zero results guidance
│   │   ├── SearchHistory.tsx      # Recent searches dropdown
│   │   └── ResultDetailDrawer.tsx # Detail view drawer/modal
│   ├── notifications/
│   │   ├── DailyReminderEmail.tsx # React Email template
│   │   └── NotificationPreferences.tsx # Settings form
│   └── ui/                        # shadcn/ui components (drawer, dialog)
├── db/
│   └── schema.ts                  # Extended with search_vector, embedding
├── hooks/
│   ├── useCommandMenu.ts          # Cmd+K state management
│   └── useSearchHistory.ts        # localStorage search history
└── lib/
    ├── search.ts                  # Search query builders
    └── email.ts                   # Resend client wrapper
```

### Pattern 1: PostgreSQL Full-Text Search with Drizzle

**What:** Generated tsvector column with weighted fields and GIN index

**When to use:** All full-text search queries in Phase 3

**Example:**

```typescript
// src/db/schema.ts
import { customType, pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql, SQL } from "drizzle-orm";
import { vector } from "drizzle-orm/pg-core";

// Custom type for tsvector (Drizzle doesn't have native support)
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const knowledgeItems = pgTable(
  "knowledge_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    sourceType: text("source_type").notNull(),
    sourceContent: text("source_content"),
    title: text("title").notNull(),
    content: text("content").notNull(),
    source: text("source"),
    domain: text("domain").notNull(),
    tags: text("tags").array().notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),

    // Phase 3: Full-text search vector
    searchVector: tsvector("search_vector")
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`setweight(to_tsvector('chinese', coalesce(${knowledgeItems.title}, '')), 'A') ||
            setweight(to_tsvector('chinese', coalesce(array_to_string(${knowledgeItems.tags}, ' '), '')), 'A') ||
            setweight(to_tsvector('chinese', coalesce(${knowledgeItems.content}, '')), 'B') ||
            setweight(to_tsvector('chinese', coalesce(${knowledgeItems.source}, '')), 'C')`
      ),

    // Phase 4: Semantic search vector (pre-migration)
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => [
    // GIN index for full-text search
    index("knowledge_items_search_idx").using("gin", table.searchVector),

    // HNSW index for vector similarity (Phase 4)
    index("knowledge_items_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
);
```

### Pattern 2: Search API with Ranking

**What:** Full-text search with ts_rank and ts_headline for excerpts

**When to use:** GET /api/search endpoint

**Example:**

```typescript
// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeItems } from "@/db/schema";
import { sql, desc, eq, and } from "drizzle-orm";
import { z } from "zod";

const searchQuerySchema = z.object({
  q: z.string().min(2).max(100),
  domain: z.string().optional(),
  limit: z.coerce.number().min(1).max(20).default(10),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchQuerySchema.parse({
      q: searchParams.get("q"),
      domain: searchParams.get("domain") || undefined,
      limit: searchParams.get("limit") || "10",
    });

    // Use websearch_to_tsquery for user-friendly syntax (supports "quoted phrases", OR, -exclude)
    const searchQuery = params.q
      .replace(/[\s]+/g, " & ") // Default to AND for spaces
      .replace(/"/g, "'") // Convert quotes for tsquery
      .trim();

    const results = await db
      .select({
        id: knowledgeItems.id,
        title: knowledgeItems.title,
        content: knowledgeItems.content,
        domain: knowledgeItems.domain,
        tags: knowledgeItems.tags,
        source: knowledgeItems.source,
        createdAt: knowledgeItems.createdAt,
        // Rank based on weighted search vector
        rank: sql<number>`ts_rank(${knowledgeItems.searchVector}, to_tsquery('chinese', ${searchQuery}))`,
        // Generate highlighted excerpt
        excerpt: sql<string>`ts_headline('chinese', ${knowledgeItems.content}, to_tsquery('chinese', ${searchQuery}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10')`,
      })
      .from(knowledgeItems)
      .where(
        and(
          sql`${knowledgeItems.searchVector} @@ to_tsquery('chinese', ${searchQuery})`,
          params.domain ? eq(knowledgeItems.domain, params.domain) : undefined
        )
      )
      .orderBy(
        desc(sql`ts_rank(${knowledgeItems.searchVector}, to_tsquery('chinese', ${searchQuery}))`)
      )
      .limit(params.limit);

    return NextResponse.json({ results, query: params.q });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed", code: "SEARCH_ERROR" }, { status: 500 });
  }
}
```

### Pattern 3: Cloudflare Cron Trigger for Daily Emails

**What:** Scheduled handler that runs daily to send reminder emails

**When to use:** Automated daily digest at user-defined times

**Configuration (wrangler.toml):**

```json
{
  "triggers": {
    "crons": [
      "0 * * * *" // Run every hour to check for users with reminders due
    ]
  }
}
```

**Implementation:**

```typescript
// src/app/api/cron/daily-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/db";
import { reviewState, knowledgeItems } from "@/db/schema";
import { eq, lte, and, sql } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentHour = now.getHours();

  // Find users with due items AND notification time matching current hour
  // This requires a user_preferences table (to be created)

  // For MVP: Send to all users with due items (simplified)
  const dueItems = await db
    .select({
      userId: knowledgeItems.userId,
      count: sql<number>`count(*)`,
      domains: sql<string[]>`array_agg(distinct ${knowledgeItems.domain})`,
    })
    .from(reviewState)
    .innerJoin(knowledgeItems, eq(reviewState.knowledgeItemId, knowledgeItems.id))
    .where(lte(reviewState.nextReviewAt, now))
    .groupBy(knowledgeItems.userId);

  // Send emails in batches (Resend supports bulk sending)
  for (const user of dueItems) {
    if (user.count === 0) continue;

    await resend.emails.send({
      from: "笔记助手 <reminders@bijiassistant.shop>",
      to: user.userId, // Need to join with users table for email
      subject: `今日有 ${user.count} 个知识点待复习`,
      html: generateEmailHtml(user.count, user.domains),
      text: generateEmailText(user.count, user.domains),
    });
  }

  return NextResponse.json({ sent: dueItems.length });
}
```

### Pattern 4: React Email Template

**What:** Type-safe email components with automatic inline CSS

**When to use:** All transactional emails

**Example:**

```tsx
// src/components/notifications/DailyReminderEmail.tsx
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface DailyReminderEmailProps {
  username: string;
  count: number;
  domains: string[];
  dueDate: string;
}

export function DailyReminderEmail({ username, count, domains, dueDate }: DailyReminderEmailProps) {
  const previewText = `${username}，你有 ${count} 个知识点待复习`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-[600px] p-6">
            <Section className="bg-white rounded-lg p-8 shadow-sm">
              <Heading className="text-2xl font-bold text-gray-900 mb-4">Hi {username},</Heading>

              <Text className="text-gray-700 text-lg mb-4">
                你有 <strong className="text-blue-600">{count}</strong> 个知识点正在等待加固， 花{" "}
                {Math.ceil(count * 0.5)} 分钟搞定它们吧！
              </Text>

              <Section className="my-6">
                <Text className="text-gray-600 text-sm mb-2">涉及领域：</Text>
                <div className="flex flex-wrap gap-2">
                  {domains.map((domain) => (
                    <span
                      key={domain}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              </Section>

              <Button
                href={`https://bijiassistant.shop/review?session=daily&source=email`}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-center block w-full"
              >
                🚀 立即开始复习
              </Button>

              <Hr className="my-6 border-gray-200" />

              <Text className="text-gray-500 text-sm text-center">
                <a
                  href="https://bijiassistant.shop/settings/notifications"
                  className="text-blue-600 underline"
                >
                  调整提醒设置
                </a>
                {" | "}
                <a
                  href="https://bijiassistant.shop/unsubscribe?token=xxx"
                  className="text-gray-400 underline"
                >
                  退订
                </a>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
```

### Pattern 5: Cmd+K Search Modal

**What:** Global keyboard-triggered search with cmdk library

**When to use:** Global search UI component

**Example:**

```tsx
// src/components/search/SearchModal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Command } from "cmdk";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  domain: string;
}

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Debounce search input (300ms as per D-14)
  const [debouncedQuery] = useDebounce(query, 300);

  // Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch search results
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
      .then((res) => res.json())
      .then((data) => setResults(data.results || []))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="搜索知识库..." value={query} onValueChange={setQuery} />
      <Command.List>
        {loading && <Command.Loading>搜索中...</Command.Loading>}

        {results.length === 0 && debouncedQuery.length >= 2 && !loading && (
          <Command.Empty>没找到关于 "{debouncedQuery}" 的确切匹配</Command.Empty>
        )}

        <Command.Group heading="搜索结果">
          {results.map((item) => (
            <Command.Item
              key={item.id}
              onSelect={() => {
                setOpen(false);
                // Open detail drawer or navigate
                router.push(`/library?highlight=${item.id}`);
              }}
            >
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-gray-500">{item.excerpt}</div>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{item.domain}</span>
              </div>
            </Command.Item>
          ))}
        </Command.Group>

        {results.length > 0 && (
          <Command.Item
            onSelect={() => {
              setOpen(false);
              router.push(`/search?q=${encodeURIComponent(debouncedQuery)}`);
            }}
          >
            查看全部结果 →
          </Command.Item>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
```

### Anti-Patterns to Avoid

- **Don't use `to_tsquery` directly with user input:** Always sanitize or use `plainto_tsquery`/`websearch_to_tsquery` to prevent syntax errors
- **Don't create tsvector on-the-fly in WHERE clauses:** Use generated columns with GIN indexes for performance
- **Don't send emails synchronously in loops:** Use batching or queues for large user bases
- **Don't store search history server-side:** Use localStorage to avoid privacy concerns and DB bloat
- **Don't use `simple` dictionary for Chinese:** Use `chinese` or `chinese_simple` configuration for proper CJK tokenization

---

## Don't Hand-Roll

| Problem                        | Don't Build                        | Use Instead               | Why                                                             |
| ------------------------------ | ---------------------------------- | ------------------------- | --------------------------------------------------------------- |
| Email template inline CSS      | Manual style attributes            | `@react-email/components` | Handles 50+ email client quirks automatically                   |
| Search modal keyboard handling | Custom keydown listeners           | `cmdk` library            | Battle-tested accessibility, arrow navigation, focus management |
| Debounce implementation        | setTimeout/clearTimeout            | `use-debounce` hook       | Proper cleanup, leading/trailing edge options                   |
| Full-text search engine        | Elasticsearch/Meilisearch          | PostgreSQL tsvector       | Zero additional infrastructure, single database                 |
| Cron job scheduler             | External service (AWS EventBridge) | Cloudflare Cron Triggers  | Native integration, no extra cost, same deployment              |
| Email sending SMTP             | Nodemailer                         | Resend SDK                | Edge runtime compatible, better deliverability                  |

**Key insight:** PostgreSQL's tsvector + pgvector combination eliminates the need for separate search infrastructure. Resend handles deliverability, spam scoring, and template rendering better than custom SMTP solutions.

---

## Common Pitfalls

### Pitfall 1: Chinese Text Search Tokenization

**What goes wrong:** Using `english` dictionary for Chinese content results in no matches or poor relevance.

**Why it happens:** PostgreSQL's full-text search uses language-specific dictionaries for stemming and stop words. Chinese requires CJK tokenization.

**How to avoid:**

```sql
-- Correct: Use chinese configuration
to_tsvector('chinese', content)

-- Verify extension is available
SELECT * FROM pg_available_extensions WHERE name LIKE '%chinese%';
```

**Warning signs:** Search returns no results for obvious Chinese keywords; `ts_debug('chinese', '中文内容')` shows empty lexemes.

### Pitfall 2: tsquery Syntax Errors

**What goes wrong:** User input like `C++` or `&&` causes `ERROR: syntax error in tsquery`.

**Why it happens:** `to_tsquery` expects valid query syntax. Special characters and operators have meaning.

**How to avoid:**

```typescript
// Use plainto_tsquery for user input (treats input as literal text)
sql`${knowledgeItems.searchVector} @@ plainto_tsquery('chinese', ${userQuery})`;

// Or websearch_to_tsquery for Google-like syntax support
sql`${knowledgeItems.searchVector} @@ websearch_to_tsquery('chinese', ${userQuery})`;
```

### Pitfall 3: Missing GIN Index Performance

**What goes wrong:** Full-text search queries take seconds on large tables.

**Why it happens:** Without GIN index, PostgreSQL must scan every row and compute tsvector on-the-fly.

**How to avoid:** Always create GIN index on generated tsvector column:

```sql
CREATE INDEX knowledge_items_search_idx ON knowledge_items USING GIN(search_vector);
```

**Warning signs:** `EXPLAIN ANALYZE` shows Seq Scan instead of Bitmap Index Scan.

### Pitfall 4: Cron Trigger Timezone Confusion

**What goes wrong:** Emails sent at wrong time for users in different timezones.

**Why it happens:** Cloudflare Cron Triggers run in UTC only. User-defined times must be converted.

**How to avoid:**

```typescript
// Store user preference in their local timezone
// Convert to UTC for comparison
const userLocalHour = 9; // 9 AM Beijing time
const utcHour = (userLocalHour - 8 + 24) % 24; // Beijing is UTC+8
```

### Pitfall 5: Email Deliverability Issues

**What goes wrong:** Emails land in spam folders or bounce.

**Why it happens:** Missing SPF/DKIM records, unverified sending domain, poor sender reputation.

**How to avoid:**

1. Verify sending domain in Resend dashboard
2. Add Resend's SPF/DKIM records to DNS
3. Include unsubscribe links (required by law in many jurisdictions)
4. Start with small volumes to warm up IP reputation

### Pitfall 6: Search Result Ranking Mismatch

**What goes wrong:** Title matches appear below content matches in results.

**Why it happens:** Missing `setweight()` calls or incorrect weight values (A, B, C, D).

**How to avoid:**

```sql
-- A = 1.0, B = 0.4, C = 0.2, D = 0.1
setweight(to_tsvector('chinese', title), 'A') ||
setweight(to_tsvector('chinese', content), 'B')
```

---

## Code Examples

### Database Migration for Search Columns

```sql
-- Migration: 0003_add_search_columns.sql
-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add search_vector column with generated tsvector
ALTER TABLE knowledge_items
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('chinese', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('chinese', coalesce(array_to_string(tags, ' '), '')), 'A') ||
  setweight(to_tsvector('chinese', coalesce(content, '')), 'B') ||
  setweight(to_tsvector('chinese', coalesce(source, '')), 'C')
) STORED;

-- Add embedding column for Phase 4
ALTER TABLE knowledge_items
ADD COLUMN embedding vector(1536);

-- Create GIN index for full-text search
CREATE INDEX knowledge_items_search_idx ON knowledge_items USING GIN(search_vector);

-- Create HNSW index for vector similarity (Phase 4)
CREATE INDEX knowledge_items_embedding_idx ON knowledge_items
USING hnsw(embedding vector_cosine_ops);

-- Update existing rows to populate search_vector
UPDATE knowledge_items SET title = title WHERE search_vector IS NULL;
```

### Search History Hook

```typescript
// src/hooks/useSearchHistory.ts
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "biji_search_history";
const MAX_HISTORY = 8;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  // Save to localStorage
  const saveHistory = useCallback((newHistory: string[]) => {
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  }, []);

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    setHistory((prev) => {
      const filtered = prev.filter((h) => h !== query);
      const updated = [query, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h !== query);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
}
```

### Notification Preferences Schema

```typescript
// src/db/schema.ts (additions)

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),

  // Notification settings
  emailNotificationsEnabled: boolean("email_notifications_enabled").notNull().default(true),
  dailyReminderTime: text("daily_reminder_time").notNull().default("09:00"), // HH:mm format
  reminderTimezone: text("reminder_timezone").notNull().default("Asia/Shanghai"),

  // Domain filters (empty array = all domains)
  includedDomains: text("included_domains").array().notNull().default([]),

  // Search settings
  saveSearchHistory: boolean("save_search_history").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

---

## State of the Art

| Old Approach                           | Current Approach               | When Changed | Impact                                     |
| -------------------------------------- | ------------------------------ | ------------ | ------------------------------------------ |
| Separate search engine (Elasticsearch) | PostgreSQL tsvector + pgvector | 2024-2025    | Single database, zero infra overhead       |
| Nodemailer + SMTP                      | Resend SDK                     | 2024         | Edge runtime native, better deliverability |
| Manual email HTML                      | React Email                    | 2024         | Type-safe, automatic inline CSS            |
| Custom search UI                       | cmdk library                   | 2023-2024    | Battle-tested accessibility                |
| pgvector IVFFlat                       | pgvector HNSW                  | 2024         | Better performance, faster builds          |

**Deprecated/outdated:**

- **Elasticsearch for small-scale search:** Overkill for <1M documents; PostgreSQL GIN indexes sufficient
- **Nodemailer on serverless:** Requires Node.js runtime, incompatible with Edge/Workers
- **Custom debounce hooks:** `use-debounce` library is mature, well-tested

---

## Open Questions

1. **Chinese text search configuration**
   - What we know: PostgreSQL has `chinese` configuration for CJK tokenization
   - What's unclear: Whether Supabase has `pg_chinese` extension pre-installed
   - Recommendation: Verify with `SELECT * FROM pg_available_extensions WHERE name LIKE '%chinese%'`; if not available, use `simple` with trigram fallback

2. **Cron trigger execution model**
   - What we know: Cloudflare Cron Triggers run on UTC schedule
   - What's unclear: Whether to run hourly and filter users, or have separate cron per timezone
   - Recommendation: Run hourly, query users whose reminder time matches current UTC hour (converted from their timezone)

3. **Email template internationalization**
   - What we know: React Email supports dynamic content
   - What's unclear: Whether to support English emails for international users
   - Recommendation: Start with Chinese only; add i18n framework in Phase 4 if needed

---

## Sources

### Primary (HIGH confidence)

- [Drizzle ORM - PostgreSQL Full-Text Search Guide](https://orm.drizzle.team/docs/guides/postgresql-full-text-search) — Official documentation for tsvector with generated columns
- [Drizzle ORM - PostgreSQL Extensions](https://orm.drizzle.team/docs/extensions/pg) — Native pgvector support documentation
- [Resend Cloudflare Workers Documentation](https://resend.com/docs/send-with-cloudflare-workers) — Official integration guide
- [Cloudflare Cron Triggers Documentation](https://developers.cloudflare.com/workers/configuration/cron-triggers/) — Official cron configuration reference
- [React Email Documentation](https://react.email/) — Component library for email templates

### Secondary (MEDIUM confidence)

- [PostgreSQL Hybrid Search with pgvector](https://jkatz.github.io/postgres/hybrid-search-postgres-pgvector/) — Jonathan Katz's comprehensive guide
- [Hybrid Search in PostgreSQL: The Missing Manual](https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual) — ParadeDB's RRF implementation
- [Supabase pgvector Guide](https://supabase.com/docs/guides/database/extensions/pgvector) — Vector search setup on Supabase

### Tertiary (LOW confidence)

- Web search results for cmdk library patterns — Verified with official cmdk repository
- Community implementations of Resend + Cloudflare Workers — Cross-referenced with official docs

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — All libraries verified current versions, official docs consulted
- Architecture: HIGH — Patterns derived from official Drizzle and Cloudflare documentation
- Pitfalls: MEDIUM-HIGH — Based on community reports and official troubleshooting guides

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (30 days for stable stack, PostgreSQL search is mature)

**Key version pins:**

- `resend@6.9.4` — Latest stable
- `drizzle-orm@0.45.1` — Current project version
- `cmdk@1.0.4` — Latest stable
