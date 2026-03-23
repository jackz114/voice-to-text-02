# Phase 1: Capture Pipeline - Research

**Researched:** 2026-03-22
**Domain:** Text-paste input → AI knowledge extraction → Drizzle/Postgres schema → user confirmation flow
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-06:** Phase 1 only implements text paste input. Audio recording is deferred to Phase 2.
- **D-07:** Paste input only requires content. AI auto-extracts title and source (zero burden).
- **D-08:** Supports long content paste (entire articles). Backend must chunk for processing.
- **D-09:** Knowledge confirmation shown as card-style preview (visually clean).
- **D-10:** Edit support: user can modify title, content, and tags before confirming.
- **D-11:** Preview first, then edit, then confirm — DB write only after confirmation.
- **D-12:** Each card independently confirmable/rejectable (partial saves allowed).
- **D-13:** Knowledge item fields: title, content, source, domain tag (four required fields).
- **D-14:** Content length: short-form (100-200 character summary), optimal for FSRS review.
- **D-15:** Organization: hierarchical classification (tree) + flat tags (cross-cutting).
- **D-16:** Tags: multiple allowed, no limit; AI auto-generates, user can modify.

### Claude's Discretion

- Recording UI color scheme and animation details (Phase 2 concern)
- Card preview exact layout (grid vs. list toggle)
- Edit form specific field arrangement
- Tag input interaction style (tag cloud vs. input box)
- Error state copy/messaging

### Deferred Ideas (OUT OF SCOPE)

- Audio recording (MediaRecorder + Supabase Storage direct upload) — Phase 2
- Whisper transcription API integration — Phase 2
- Post-transcription knowledge extraction flow — Phase 2
- Audio file upload (non-realtime) — future consideration
- Client-side audio preprocessing (noise reduction, silence removal) — future consideration
- Realtime transcription (streaming) — out of scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIO-01 | User can record audio and upload to Supabase Storage | Deferred to Phase 2 per D-06 |
| AUDIO-02 | Audio bypasses Cloudflare Workers (memory limit) | Deferred to Phase 2 per D-06 |
| AUDIO-03 | Auto-detect supported audio codec | Deferred to Phase 2 per D-06 |
| TRANS-01 | Auto-transcribe audio via OpenAI Whisper | Deferred to Phase 2 per D-06 |
| TRANS-02 | Handle Whisper 25 MB limit with chunking | Deferred to Phase 2 per D-06 |
| TRANS-03 | Link transcription to audio file and user | Deferred to Phase 2 per D-06 |
| TEXT-01 | User can paste article content into the system | Text paste UI component + `/api/capture/extract` route |
| TEXT-02 | System allows user to input/edit title and source | Pre-populated by AI, user can edit in confirmation card (D-10, D-11) |
| EXTRACT-01 | AI extracts structured knowledge items from pasted content | GPT-4o-mini structured output with `zod/v3` schema (see Zod v4 pitfall) |
| EXTRACT-02 | Each item: title, content, source, created_at | Zod schema defines four required fields; FSRS fields also required from day one |
| EXTRACT-03 | Show items for user confirmation before saving | Confirmation card flow (D-09 through D-12) |
| EXTRACT-04 | AI auto-assigns domain/topic tags | Included in extraction prompt; `domain` + `tags[]` fields in Zod schema |
| EXTRACT-05 | User can manually adjust domain tags | Editable in confirmation card before DB write |
</phase_requirements>

---

## Summary

Phase 1 has been scoped down from the original plan: **audio recording and transcription are deferred to Phase 2**. Phase 1 delivers only text paste → AI extraction → user confirmation → database write. This removes MediaRecorder, Whisper, Supabase Storage, and async job queue complexity from this phase entirely.

The three concrete deliverables are: (1) the Drizzle schema and database migration covering all tables needed for the full product (design everything upfront to avoid schema migration debt in Phase 2+), (2) the text paste + AI extraction API route, and (3) the confirmation card UI where users review, edit, and accept or reject individual extracted knowledge items before anything is committed to the database.

The most significant technical discovery in this research is a **breaking compatibility issue**: the project uses Zod v4.3.6, but `zodResponseFormat` from `openai/helpers/zod` does not support Zod v4. The OpenAI SDK's vendored `zod-to-json-schema` still expects `ZodFirstPartyTypeKind` which was removed in Zod v4. The documented workaround is to import `z` from `'zod/v3'` (Zod v4 ships a backward-compat shim at that path) only for OpenAI schemas, while using normal `'zod'` v4 elsewhere.

**Primary recommendation:** Install `openai`, `postgres`, and `drizzle-zod`. Design the full five-table schema before the first migration. Use `import { z } from 'zod/v3'` exclusively in files that call `zodResponseFormat`.

---

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.1 | Type-safe Postgres queries + schema definition | Already installed; zero-dep; Cloudflare Workers compatible |
| drizzle-kit | ^0.31.10 | Migration generation and push | Paired with drizzle-orm |
| zod | ^4.3.6 | Schema validation everywhere except OpenAI helper | Already installed; 14x faster than Zod 3 |
| zustand | ^5.0.12 | Client-side state (capture flow state machine) | Already installed; avoids Context re-render during extraction |
| react-hook-form | ^7.71.2 | Confirmation card edit forms | Already installed |
| @supabase/supabase-js | ^2.99.3 | Auth + Postgres client | Already installed |

### New Dependencies to Install

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| openai | ^6.32.0 | GPT-4o-mini extraction + zodResponseFormat | Official SDK; Cloudflare Workers compatible via `nodejs_compat_v2` |
| postgres | ^3.4.8 | Node.js Postgres driver for Drizzle | Required for Drizzle + Supabase direct DB connection |
| drizzle-zod | ^0.8.3 | Generate Zod insert/select schemas from Drizzle tables | Eliminates manual duplication of field definitions |

**Installation:**
```bash
npm install openai postgres drizzle-zod
```

**Version verification (confirmed 2026-03-22):**
```
openai       6.32.0  (npm view openai version)
postgres     3.4.8   (npm view postgres version)
drizzle-zod  0.8.3   (npm view drizzle-zod version)
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GPT-4o-mini | GPT-4o | 10x cost increase for marginal quality gain on structured extraction |
| `postgres` driver | `@supabase/supabase-js` for DB queries | supabase-js does not support Drizzle ORM; need the raw postgres driver |
| drizzle-zod | Manual Zod schemas per table | Duplication risk; drizzle-zod auto-syncs schema changes |

---

## Architecture Patterns

### Recommended Project Structure (new directories only)

```
src/
├── db/
│   ├── schema.ts          # All 5 Drizzle table definitions
│   └── index.ts           # DB singleton (postgres client + drizzle instance)
├── app/
│   ├── capture/
│   │   └── page.tsx       # Text paste + capture UI
│   └── api/
│       └── capture/
│           ├── extract/
│           │   └── route.ts   # POST /api/capture/extract
│           └── confirm/
│               └── route.ts   # POST /api/capture/confirm
├── components/
│   └── capture/
│       ├── TextPasteInput.tsx       # Textarea + submit form
│       └── ConfirmationCards.tsx    # Card review UI
```

### Pattern 1: Database Singleton

Create a single DB instance shared across all API routes. Must disable `prepare` for Supabase Transaction pool mode.

```typescript
// src/db/index.ts
// Source: https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle({ client });
```

Add to `.env.local`:
```
DATABASE_URL=<connection pooler URI from Supabase Dashboard → Project Settings → Database>
```

Add `DATABASE_URL` to Wrangler secrets for deployment:
```bash
npm run cf:secret:put DATABASE_URL
```

### Pattern 2: Full Schema — Design All Tables Before First Migration

The schema must include FSRS scheduling fields from day one (Pitfall 9 from PITFALLS.md). Do not design only what Phase 1 needs.

```typescript
// src/db/schema.ts
import { pgTable, uuid, text, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";

// knowledge_items — core entity
export const knowledgeItems = pgTable("knowledge_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  sourceType: text("source_type").notNull(), // "text_paste" | "audio_transcription"
  sourceContent: text("source_content"),     // original pasted text
  title: text("title").notNull(),
  content: text("content").notNull(),        // 100-200 char summary
  source: text("source"),                    // URL or title of original article
  domain: text("domain").notNull(),          // e.g. "React", "Marketing"
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// review_state — FSRS state per item (1:1 with knowledge_items)
export const reviewState = pgTable("review_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  knowledgeItemId: uuid("knowledge_item_id").notNull().unique(),
  stability: real("stability").notNull().default(0),
  difficulty: real("difficulty").notNull().default(0),
  retrievability: real("retrievability").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  lastReviewedAt: timestamp("last_reviewed_at"),
  nextReviewAt: timestamp("next_review_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

The `transcriptions`, `payments`, `subscriptions`, and `user_balances` tables from `business_logic.md` must also be defined in the same migration. See CLAUDE.md for those interface definitions.

### Pattern 3: OpenAI Structured Extraction with `zod/v3` Import

**Critical:** Use `import { z } from 'zod/v3'` (not `'zod'`) in all files that call `zodResponseFormat`. Zod v4 breaks the OpenAI SDK helper (see Pitfall section).

```typescript
// src/app/api/capture/extract/route.ts
// Source: OpenAI helpers.md official documentation workaround
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod/v3";  // NOT "zod" — see Zod v4 compatibility pitfall
import OpenAI from "openai";

const KnowledgeItemSchema = z.object({
  title: z.string(),
  content: z.string().max(200),  // 100-200 chars per D-14
  source: z.string().optional(),
  domain: z.string(),
  tags: z.array(z.string()),
});

const ExtractionResultSchema = z.object({
  items: z.array(KnowledgeItemSchema),
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const { text } = await request.json();

  const result = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    temperature: 0,  // required — prevents hallucination per PITFALLS.md
    messages: [
      {
        role: "system",
        content: `Extract distinct knowledge items from the provided text.
                  Only extract facts explicitly stated in the text.
                  Do not infer, expand, or add context not present in the source.
                  Each content summary should be 100-200 characters suitable for spaced repetition review.`,
      },
      { role: "user", content: text },
    ],
    response_format: zodResponseFormat(ExtractionResultSchema, "extraction_result"),
  });

  if (result.choices[0].message.refusal) {
    return NextResponse.json({ error: "Model refused extraction" }, { status: 422 });
  }

  return NextResponse.json({ items: result.choices[0].message.parsed?.items ?? [] });
}
```

### Pattern 4: Text Chunking for Long Articles (D-08)

Articles longer than ~3000 tokens need chunking before extraction. Use a simple paragraph-boundary splitter. Each chunk produces independent extraction; deduplicate by title similarity before presenting to user.

```typescript
// 500-800 token chunks at paragraph boundaries
function chunkText(text: string, maxChars = 3000): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";
  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += "\n\n" + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
```

### Pattern 5: Confirmation → DB Write Flow

The extraction API returns candidate items. The confirmation API receives only the items the user accepted (after possible edits). No DB write happens until POST `/api/capture/confirm`.

```
TextPasteInput  →  POST /api/capture/extract  →  ConfirmationCards
                                                        ↓ (user edits + accepts subset)
                                               POST /api/capture/confirm
                                                        ↓
                                               INSERT knowledge_items + review_state
```

### Pattern 6: Drizzle Config File

```typescript
// drizzle.config.ts (root)
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Run migrations:
```bash
npx drizzle-kit generate   # creates SQL migration files
npx drizzle-kit migrate    # applies to Supabase
```

### Anti-Patterns to Avoid

- **Using `import { z } from 'zod'` with `zodResponseFormat`:** Will produce schema errors at runtime (`type: "None"` invalid schema). Must use `'zod/v3'` import path.
- **Writing to DB before user confirmation:** The confirmation card is mandatory per D-11. Never auto-insert extracted items.
- **Designing only Phase 1 tables:** The schema must include FSRS fields (`stability`, `difficulty`, `retrievability`, `next_review_at`) from day one.
- **Hardcoding `DATABASE_URL` or `OPENAI_API_KEY`:** Both are secrets. Use `.env.local` for dev, Wrangler secrets for deployment.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured LLM output parsing | Custom JSON parser + retry logic | `openai.beta.chat.completions.parse` + `zodResponseFormat` | OpenAI Structured Outputs guarantee schema compliance; no parsing failures |
| Form state for confirmation cards | Custom useState chains | `react-hook-form` (already installed) | Already in codebase; handles arrays of items cleanly |
| Drizzle schema → Zod validation | Manual Zod schemas matching DB columns | `drizzle-zod` | Auto-syncs when schema changes; eliminates duplication |
| Postgres connection management | Raw pg connections | `postgres` npm package via Drizzle | Handles pooling, `prepare: false` config for Supabase |
| Client-side extraction state | Complex Context | `zustand` (already installed) | Cleaner subscription model for multi-step flow |

**Key insight:** The extraction pipeline has well-established library support. The only custom logic needed is the system prompt design and the chunking function.

---

## Common Pitfalls

### Pitfall 1: `zodResponseFormat` Breaks with Zod v4 (CRITICAL — project-specific)

**What goes wrong:** The project has `zod@^4.3.6` installed. Calling `zodResponseFormat(myZodV4Schema, "name")` produces an API error: `Invalid schema for response_format: schema must be a JSON Schema of 'type: "object"', got 'type: "None"'`. The `openai/helpers/zod` module's bundled `zod-to-json-schema` uses `ZodFirstPartyTypeKind` which was removed in Zod v4.

**Why it happens:** OpenAI SDK v6.x has not yet updated its vendored schema converter for Zod v4. Open issues: [#1540](https://github.com/openai/openai-node/issues/1540), [#1576](https://github.com/openai/openai-node/issues/1576).

**How to avoid:** In any file that imports `zodResponseFormat`, use `import { z } from 'zod/v3'` instead of `import { z } from 'zod'`. Zod v4 ships a backward-compat shim at the `zod/v3` export path for exactly this case. The OpenAI SDK's official `helpers.md` documents this as the workaround.

**Warning signs:** `400` errors from OpenAI with message about `type: "None"` schema, or extraction returning no items.

### Pitfall 2: Missing FSRS Fields in Schema Causes Phase 2 Migration Debt

**What goes wrong:** Phase 1 only needs `knowledge_items`. If only those columns are defined, Phase 2 needs an `ALTER TABLE ADD COLUMN` migration for `stability`, `difficulty`, `retrievability`, `next_review_at`, `review_count` on an already-populated table. This requires a default value strategy and potential data backfill.

**Why it happens:** Developers scope schema to current phase only.

**How to avoid:** Include the full `review_state` table in the Phase 1 migration with all FSRS columns. The table will simply have no rows until Phase 2.

**Warning signs:** Any Drizzle schema file that omits `stability`, `difficulty`, or `next_review_at` columns.

### Pitfall 3: `DATABASE_URL` Not Added to Wrangler Secrets

**What goes wrong:** The `postgres` driver needs `DATABASE_URL` at runtime. In `npm run dev`, `.env.local` provides it. In `npm run cf:dev` or production, the variable is absent and the DB connection throws at startup.

**Why it happens:** Developers test only in dev mode and forget Cloudflare Workers secrets are separate from `.env.local`.

**How to avoid:** After creating `.env.local`, immediately also run `npm run cf:secret:put DATABASE_URL` for the Workers environment. Same for `OPENAI_API_KEY`.

**Warning signs:** Works locally, throws `Cannot read properties of undefined (reading 'DATABASE_URL')` in `cf:dev` output.

### Pitfall 4: LLM Hallucination in Extraction

**What goes wrong:** GPT-4o-mini fills schema fields with plausible-but-invented information not present in the source text. The user's knowledge base accumulates false facts.

**Why it happens:** Structured output schemas with required fields create pressure for the model to fill every field even when source content is ambiguous. Schema-driven prompting increases this tendency.

**How to avoid:** (1) Always set `temperature: 0`. (2) System prompt must include the instruction: "Only extract facts explicitly stated in the text. Do not infer, expand, or add context." (3) Make `source` field optional in the Zod schema — do not force the model to invent a source URL. (4) The user confirmation step (D-11) is a mandatory final guard.

**Warning signs:** Extracted items contain entities or URLs not mentioned in the pasted text.

### Pitfall 5: Next.js 1 MB Body Limit on Text Paste

**What goes wrong:** A user pastes a 50,000-character article. The default Next.js body parser limit is 1 MB. A 50k-character UTF-8 string is ~50 KB, well under the limit. However, if text with many CJK characters is included, byte count per character is higher. Real long articles with embedded metadata or HTML can exceed 1 MB.

**Why it happens:** The limit is not commonly encountered in development but triggers in production with real user content.

**How to avoid:** Validate text length on the client before submission (e.g., limit to 100,000 characters with a clear error message). This is ~100 KB max, safely under both Next.js and Cloudflare Workers limits. Add server-side validation returning a 413 error for inputs above the limit.

**Warning signs:** 413 errors from POST `/api/capture/extract` on large pastes.

---

## Code Examples

### drizzle-zod integration for insert validation

```typescript
// Source: https://orm.drizzle.team/docs/zod (drizzle-zod official docs)
// Note: use 'zod/v3' only in files that call zodResponseFormat; drizzle-zod uses its own peer dep
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { knowledgeItems } from "@/db/schema";

export const insertKnowledgeItemSchema = createInsertSchema(knowledgeItems);
export const selectKnowledgeItemSchema = createSelectSchema(knowledgeItems);
```

### Supabase RLS policies (run after migration)

```sql
-- Enable RLS on all tables
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_state ENABLE ROW LEVEL SECURITY;

-- Users access only their own rows
CREATE POLICY "users_own_knowledge_items"
  ON knowledge_items FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "users_own_review_state"
  ON review_state FOR ALL
  USING (
    knowledge_item_id IN (
      SELECT id FROM knowledge_items WHERE user_id = auth.uid()
    )
  );
```

### Server-side auth check in API routes

```typescript
// Pattern from existing paypal routes — adapt for capture routes
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  // 步骤 1: 验证用户身份
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }
  // ... rest of handler
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `whisper-1` model | `gpt-4o-mini-transcribe` (Phase 2) | March 2025 | Better accuracy at same price point |
| `response_format: { type: "json_object" }` | `zodResponseFormat` + `client.beta.chat.completions.parse` | Mid-2024 | 100% schema compliance; no manual JSON parsing |
| SM-2 spaced repetition | FSRS via `ts-fsrs` | 2022 (Anki default 2023) | 20-30% fewer reviews for same retention |
| `zod` import for OpenAI helpers | `import { z } from 'zod/v3'` | Active issue as of March 2026 | Required workaround until OpenAI SDK updates |

**Deprecated/outdated:**
- `response_format: { type: "json_object" }`: No schema guarantees; always replaced by Structured Outputs.
- `whisper-1`: Superseded by `gpt-4o-mini-transcribe` for transcription (Phase 2 concern).

---

## Open Questions

1. **`SUPABASE_SERVICE_ROLE_KEY` for server-side DB writes**
   - What we know: The existing `paypal-client.ts` uses `process.env` directly. The Drizzle + postgres driver approach needs `DATABASE_URL` (Supabase connection pooler URI).
   - What's unclear: Whether `DATABASE_URL` should use the Supabase connection pooler (Transaction mode, `prepare: false`) or Session mode.
   - Recommendation: Use the **Transaction pooler** URI from Supabase Dashboard → Project Settings → Database → Connection Pooling (port 6543). Always set `prepare: false`. This is the pattern documented in official Drizzle + Supabase guides.

2. **Exact token limit for chunking threshold**
   - What we know: GPT-4o-mini context window is 128K tokens; reliable extraction quality degrades on very long inputs.
   - What's unclear: The exact character count threshold where chunking improves extraction quality vs. adds latency.
   - Recommendation: Chunk at 3,000 characters (approx. 750 tokens) per chunk, targeting 1-3 knowledge items per chunk. Adjust based on observed extraction quality during testing.

3. **Zustand store shape for the confirmation flow**
   - What we know: Zustand is installed; the flow has three states (idle → extracting → confirming).
   - What's unclear: Whether a single global store or a local component state is more appropriate for this transient flow.
   - Recommendation: Use local React state (`useState`) for the confirmation flow since it is transient and page-scoped. Zustand is better suited for persistent cross-page state (Phase 2 recording state machine).

---

## Sources

### Primary (HIGH confidence)
- Drizzle + Supabase official tutorial: https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
- OpenAI Structured Outputs guide: https://platform.openai.com/docs/guides/structured-outputs
- openai npm package v6.32.0: https://www.npmjs.com/package/openai
- drizzle-zod npm v0.8.3: https://www.npmjs.com/package/drizzle-zod
- postgres npm v3.4.8: https://www.npmjs.com/package/postgres

### Secondary (MEDIUM confidence)
- OpenAI Node SDK `zod/v3` workaround (multiple GitHub issues confirming): https://github.com/openai/openai-node/issues/1540 and https://github.com/openai/openai-node/issues/1576
- Zod v4 release notes (confirms `zod/v3` compat shim): https://zod.dev/v4

### Prior Research (HIGH confidence — project-specific)
- `.planning/research/STACK.md` — full stack recommendations with verified versions
- `.planning/research/ARCHITECTURE.md` — pipeline patterns and anti-patterns
- `.planning/research/PITFALLS.md` — detailed pitfall analysis for this domain

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified on npm registry; versions confirmed 2026-03-22
- Architecture: HIGH — patterns from official Drizzle + Supabase docs; extraction pattern from OpenAI official docs
- Zod v4 pitfall: HIGH — multiple open GitHub issues with reproduction steps; official workaround documented in OpenAI helpers.md
- Schema design: HIGH — verified against Drizzle docs and prior project research
- Chunking threshold: LOW — 3000-char recommendation is heuristic, not benchmarked for this specific use case

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable stack; Zod v4 compatibility may be resolved by OpenAI SDK update before then — check issues #1540 and #1576 before planning)
