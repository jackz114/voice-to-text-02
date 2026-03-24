# Phase 2: Review Loop - Research

**Researched:** 2026-03-23
**Domain:** FSRS scheduling, knowledge library UI, audio recording/upload, Whisper transcription
**Confidence:** HIGH (core stack verified), MEDIUM (swipe animation patterns)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**知识库浏览**
- LIB-01: 布局采用混合模式——默认列表视图，支持一键切换为网格卡片
- LIB-02: 导航采用左侧边栏领域导航——类似邮箱文件夹列表，点击领域筛选
- LIB-03: 信息显示：标题 + 领域 + 下次复习时间 + 内容前50字预览
- LIB-04: 双模式设计：浏览模式（移动端左滑删除，Web端悬停操作按钮）+ 选择模式（长按进入，Shift+Click范围选择，显示批量操作栏）

**复习界面**
- REVIEW-01: 布局采用横向滑动卡片堆（Tinder 风格）——滑动或点击评分按钮切换卡片
- REVIEW-02: 揭示模式采用点击揭示——初始只显示标题，点击后揭示完整内容（主动回忆）
- REVIEW-03: 返回路径：复习完成后回到知识库列表

**音频录制**
- AUDIO-01: 录音按钮位置：仅在 /capture 页面
- AUDIO-02: 切换方式：并列显示——文字粘贴区域和音频录制同时显示
- AUDIO-03: 录制状态显示：页面内嵌——非全屏，显示倒计时和波形动画
- AUDIO-04: 支持暂停/继续（后台录制继续，用户可切换 Tab）

**FSRS 评分**
- FSRS-01: 评分按钮排列：横向四按钮（标准 Anki 风格）
- FSRS-02: 4 级评分（带表情符号）：😵 Again / 😐 Hard / 🙂 Good / 🚀 Easy
- FSRS-03: 防作弊机制：连续5次 Easy 弹出轻提示
- FSRS-04: 事后修正：复习完成后限时1分钟可修改评分

### Claude's Discretion

- 滑动卡片的动画细节和过渡效果
- 波形动画的视觉样式和颜色
- 领域边栏的折叠/展开交互
- 轻提示弹出的具体文案和样式
- 评分按钮上是否显示"下次复习时间"预览
- 录音文件上传的进度指示方式

### Deferred Ideas (OUT OF SCOPE)

- 复习统计仪表板 — Phase 3
- 音频文件上传（非实时录制）— v2
- 客户端音频预处理（降噪）— v2
- 实时转写（流式处理）— v2+
- 移动端原生录音控件
- 离线复习模式
- 复习提醒推送（Phase 3 的通知邮件不同）
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LIB-01 | 用户可以按领域分类浏览所有知识条目 | Drizzle query with `domain` filter; sidebar nav pattern |
| LIB-02 | 用户可以查看单个知识条目的完整内容 | Detail route `/library/[id]` from `knowledge_items` |
| LIB-03 | 用户可以删除不需要的知识条目 | Drizzle `delete` + cascade delete `review_state` row |
| FSRS-01 | 每个知识条目创建时自动计算首次复习日期 | Phase 1 already inserts `nextReviewAt = tomorrow`; Phase 2 applies real `createEmptyCard()` on first review event |
| FSRS-02 | 系统记录每个条目的稳定性(S)和难度(D)参数 | `review_state` schema already has `stability`, `difficulty`, `retrievability` columns |
| FSRS-03 | 支持 FSRS 算法的记忆程度评分输入| `ts-fsrs` `Rating` enum: Again=1, Hard=2, Good=3, Easy=4 |
| FSRS-04 | 根据评分自动计算并更新下次复习日期 | `f.next(card, now, Rating.Good)` returns new `card.due`; persist to `review_state` |
| REVIEW-01 | 用户可以看到「今天要复习」的知识条目列表 | Query `review_state` where `next_review_at <= NOW()` joined with `knowledge_items` |
| REVIEW-02 | 复习界面显示知识条目内容和复习来源 | Card component shows `title` (hidden), then `content` + `source` on reveal |
| REVIEW-03 | 用户可以选择记忆程度（Again/Hard/Good/Easy） | 4-button row with emoji labels; maps to `Rating` enum |
| REVIEW-04 | 系统根据评分更新 FSRS 参数和下次复习日期 | `POST /api/review/rate` — runs `f.next()`, writes back stability/difficulty/due to `review_state` |
| AUDIO-01 | 用户可以录制音频并直接上传到 Supabase Storage | MediaRecorder → Blob → `uploadToSignedUrl()` (browser-to-Supabase direct) |
| AUDIO-02 | 音频文件绕过 Cloudflare Workers，避免内存限制 | Signed upload URL issued by API route; browser uploads directly to Supabase Storage |
| AUDIO-03 | 支持多种音频编码格式的自动检测 | `MediaRecorder.isTypeSupported()` probe list: webm/opus → webm → mp4 → wav |
| TRANS-01 | 系统自动将录音转写为文字（OpenAI Whisper API） | `openai.audio.transcriptions.create()` with `model: "gpt-4o-mini-transcribe"` |
| TRANS-02 | 处理 Whisper API 25MB 文件大小限制 | Record at 32 kbps Opus; ~9 MB/hour → enforce ~45-min duration guard in UI; no chunking needed for typical learning sessions |
| TRANS-03 | 转写结果关联到原始音频文件和用户 | Insert into `transcriptions` table with `userId`, `audioUrl`, `text`, `status` |
</phase_requirements>

---

## Summary

Phase 2 adds four capabilities on top of the Phase 1 capture pipeline: knowledge library browsing (LIB), FSRS-scheduled daily review (FSRS + REVIEW), audio recording with direct-to-Supabase upload (AUDIO), and Whisper transcription (TRANS).

The FSRS implementation is well-covered by the `ts-fsrs` library (already in STATE.md decisions). The key API surface is `f.next(card, now, rating)` on the server side, which takes the existing `review_state` row values, produces a new scheduled `card.due` date and updated stability/difficulty, and persists them. The `ts-fsrs` `Card` type uses `due` (not `next_review_at`) as the next-review field — the schema's `next_review_at` column maps to `card.due`.

Audio recording uses the browser `MediaRecorder` API with codec detection, uploads via Supabase signed URL (bypassing the 128 MB Cloudflare Workers memory limit entirely), then triggers a server-side Whisper transcription. The `gpt-4o-mini-transcribe` model is 50% cheaper than `whisper-1` and produces better results; it only supports JSON output format. A 32 kbps Opus recording at 45 minutes is ~10.8 MB, comfortably under the 25 MB Whisper limit.

The swipe card UI uses `framer-motion` (not yet in `package.json`, needs installation). The library's `useMotionValue` / `useTransform` / `useDragControls` pattern is the standard approach for Tinder-style cards in React.

**Primary recommendation:** Use `ts-fsrs` `f.next()` server-side; store `card.due` as `next_review_at`, `card.stability` as `stability`, `card.difficulty` as `difficulty`. Install `framer-motion` for swipe cards. Audio bytes go directly to Supabase Storage via signed URL — the Workers process only issues the signed URL token and triggers transcription after upload completes.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ts-fsrs | 5.3.1 (latest) | FSRS algorithm scheduling | Official reference impl; stateless scheduler; ESM/CJS/UMD; no deps |
| framer-motion | 12.38.0 (latest) | Swipe card animations | Standard React animation library; `useMotionValue` + drag gestures = Tinder cards |
| @supabase/supabase-js | 2.99.3 (already installed) | Storage signed URL creation and client-side upload | Already in project; `createSignedUploadUrl` / `uploadToSignedUrl` methods |
| openai | 6.32.0 (already installed) | Whisper transcription API | Already in project; `audio.transcriptions.create()` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-orm | 0.45.1 (already installed) | DB queries for knowledge_items, review_state | All data access |
| react | 19.2.4 (already installed) | MediaRecorder state machine, card stack UI | All client components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| framer-motion | react-spring or CSS transitions | framer-motion has better drag/gesture support; react-spring has steeper API for this use case |
| gpt-4o-mini-transcribe | whisper-1 | gpt-4o-mini-transcribe is 2x cheaper and more accurate; only limitation is JSON-only output (fine for this use case) |
| ts-fsrs (server-side) | @squeakyrobot/fsrs (edge-ready) | @squeakyrobot/fsrs is edge-runtime compatible but ts-fsrs is the canonical reference impl and works in Node.js (Cloudflare Workers uses nodejs_compat_v2) |

**Installation (new packages only):**
```bash
npm install ts-fsrs framer-motion
```

**Version verification (run before implementing):**
```bash
npm view ts-fsrs version      # verified: 5.3.1
npm view framer-motion version  # verified: 12.38.0
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── library/
│   │   ├── page.tsx              # LIB-01: knowledge library with sidebar
│   │   └── [id]/page.tsx         # LIB-02: item detail view
│   ├── review/
│   │   └── page.tsx              # REVIEW-01~04: daily review session
│   └── api/
│       ├── library/
│       │   ├── list/route.ts     # GET items with domain filter
│       │   └── delete/route.ts   # DELETE knowledge item
│       ├── review/
│       │   ├── today/route.ts    # GET items due today
│       │   └── rate/route.ts     # POST rating → update FSRS state
│       └── audio/
│           ├── signed-url/route.ts  # POST → returns signed upload URL
│           └── transcribe/route.ts  # POST audioUrl → Whisper → returns text
├── components/
│   ├── library/
│   │   ├── KnowledgeLibrary.tsx  # shell: sidebar + item list/grid
│   │   ├── DomainSidebar.tsx     # left sidebar domain navigation
│   │   ├── KnowledgeItemList.tsx # list/grid toggle, item cards
│   │   └── KnowledgeItemCard.tsx # single item card (title+domain+due+preview)
│   ├── review/
│   │   ├── ReviewSession.tsx     # card stack orchestrator
│   │   ├── ReviewCard.tsx        # single swipeable card (framer-motion)
│   │   └── RatingButtons.tsx     # 4-button Again/Hard/Good/Easy row
│   └── capture/
│       └── AudioRecorder.tsx     # NEW: MediaRecorder + waveform + upload
```

### Pattern 1: FSRS State Mapping

**What:** ts-fsrs `Card` type uses different field names than the Drizzle schema. Map between them explicitly.
**When to use:** Any time you read from or write to `review_state`.

```typescript
// Source: ts-fsrs npm docs + schema.ts inspection
import { FSRS, Rating, createEmptyCard, Card } from "ts-fsrs";

// 从数据库行重建 FSRS Card 对象
function dbRowToFsrsCard(row: ReviewStateRow): Card {
  return {
    due: row.nextReviewAt,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: 0,            // 由 f.next() 内部计算
    scheduled_days: 0,
    learning_steps: 0,
    reps: row.reviewCount,
    lapses: 0,
    state: row.reviewCount === 0 ? 0 : 2, // New=0, Review=2
    last_review: row.lastReviewedAt ?? undefined,
  };
}

// 调度评分，返回新状态
const f = new FSRS();
const card = dbRowToFsrsCard(reviewStateRow);
const result = f.next(card, new Date(), Rating.Good);
// result.card.due          → 写入 next_review_at
// result.card.stability    → 写入 stability
// result.card.difficulty   → 写入 difficulty
```

### Pattern 2: Signed Upload URL Flow

**What:** Browser creates audio Blob → requests signed URL from API route → uploads directly to Supabase Storage → API route triggers transcription.
**When to use:** All audio uploads. Bytes NEVER pass through the Cloudflare Worker.

```typescript
// Step 1: API route issues signed URL (server-side, service role key)
// src/app/api/audio/signed-url/route.ts
const { data, error } = await supabase.storage
  .from("audio")
  .createSignedUploadUrl(`${userId}/${Date.now()}.webm`);
// Returns: { signedUrl, token, path }

// Step 2: Client uploads directly to Supabase
// AudioRecorder.tsx (client component)
const { error } = await supabase.storage
  .from("audio")
  .uploadToSignedUrl(path, token, audioBlob, {
    contentType: mimeType,
  });

// Step 3: Client calls transcribe API with the storage path
// POST /api/audio/transcribe { audioPath: "userId/timestamp.webm" }
```

### Pattern 3: MediaRecorder Codec Detection

**What:** Probe codec support in priority order; return first supported MIME type.
**When to use:** Before instantiating MediaRecorder in AudioRecorder component.

```typescript
// Source: MDN MediaRecorder.isTypeSupported() + media-codings.com cross-browser article
function getSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "audio/webm"; // 兜底
}
```

### Pattern 4: Swipe Card Stack (framer-motion)

**What:** Stack of `motion.div` cards; top card is draggable; drag-end beyond threshold triggers rating.
**When to use:** ReviewSession component.

```typescript
// Source: GeeksforGeeks Tinder framer-motion tutorial + framer-tinder-cards demo
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";

// 每张卡片：
const x = useMotionValue(0);
const rotate = useTransform(x, [-200, 200], [-30, 30]);
const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

<motion.div
  drag="x"
  style={{ x, rotate, opacity }}
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(_, info) => {
    if (info.offset.x > 100) onRate(Rating.Easy);
    else if (info.offset.x < -100) onRate(Rating.Again);
    else controls.start({ x: 0 }); // 弹回中心
  }}
>
```

### Anti-Patterns to Avoid

- **Passing audio Blob to an API route body:** Cloudflare Workers has 128 MB memory limit. Even a short recording at 128 kbps can approach 10+ MB; passing it through the Worker is fragile and unnecessary when Supabase signed URLs exist.
- **Running FSRS calculation client-side:** The scheduling state is server-owned. Client-side FSRS prevents anti-cheat mechanisms (FSRS-03) and makes the "undo rating" feature (FSRS-04) harder to implement securely.
- **Calling `f.repeat()` instead of `f.next()`:** `f.repeat()` returns all 4 grade options at once (used for previewing "next review in X days" on buttons). `f.next(card, now, rating)` is the single-rating API for when the user has chosen. Use the right one for the right purpose.
- **Storing `card.due` without mapping to `next_review_at`:** The schema column is `next_review_at`; ts-fsrs uses `due`. Make the mapping explicit in a helper function to avoid confusion.
- **Using `whisper-1` model:** The `gpt-4o-mini-transcribe` model is now cheaper and more accurate. Only limitation: JSON-only output format (not a concern here).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FSRS scheduling math | Custom stability/difficulty formulas | `ts-fsrs` `f.next()` | FSRS algorithm is 19 parameters tuned on millions of reviews; hand-rolling introduces calibration errors |
| Swipe drag + rotation animation | CSS `transform` + pointer event math | `framer-motion` `useMotionValue` + `useTransform` | Physics-based spring snap-back, gesture velocity, threshold detection — 100+ lines of custom code vs. 10 lines |
| Audio codec detection | Browser sniffing or hardcoded codec string | `MediaRecorder.isTypeSupported()` probe list | Safari uses mp4/AAC, Chrome/Firefox use webm/Opus; a static codec string fails on one platform |
| Transcription API call | Direct `fetch` to OpenAI audio endpoint | `openai.audio.transcriptions.create()` (already installed) | SDK handles multipart form encoding, retries, and typed responses |
| Supabase Storage upload | Raw `fetch PUT` to storage URL | `supabase.storage.uploadToSignedUrl()` | SDK handles CORS headers, retry logic, and returns typed error/data |

**Key insight:** The FSRS algorithm exists as a precise mathematical specification; any deviation produces incorrectly calibrated review schedules that degrade retention. Always use the reference implementation.

---

## Common Pitfalls

### Pitfall 1: ts-fsrs `Card.due` vs schema `next_review_at`
**What goes wrong:** Developer tries to write `card.next_review_at` to the DB or reads `row.due` — both are undefined.
**Why it happens:** `ts-fsrs` uses `due` as the field name; the Drizzle schema uses `nextReviewAt` (camelCase of `next_review_at`).
**How to avoid:** Use the `dbRowToFsrsCard()` helper (see Pattern 1 above) and a symmetric `fsrsCardToDbUpdate()` helper for writing back.
**Warning signs:** TypeScript errors on `card.next_review_at` or `row.due`.

### Pitfall 2: First-review FSRS state (stability=0, difficulty=0)
**What goes wrong:** `f.next()` receives a card with `stability=0, difficulty=0` (Phase 1 placeholder values) and produces unexpected scheduling.
**Why it happens:** Phase 1 inserts placeholder FSRS state. The first real review should call `createEmptyCard()` to get proper initial state, then immediately run `f.next()` with the user's rating.
**How to avoid:** In the rate API route, check `reviewCount === 0` — if so, construct the card using `createEmptyCard()` rather than the DB placeholder values before passing to `f.next()`.
**Warning signs:** "Again" rating on first review produces a 10-day interval instead of 1 day.

### Pitfall 3: Audio upload RLS error on private bucket
**What goes wrong:** `uploadToSignedUrl()` returns a 403 RLS error despite using a signed URL.
**Why it happens:** Supabase Storage RLS policies on `storage.objects` must explicitly allow `INSERT` for authenticated users on the `audio` bucket. Even with a signed URL, RLS is enforced if the bucket is private and no INSERT policy exists.
**How to avoid:** Create the `audio` bucket as private and add an RLS INSERT policy: `(bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1])`. The path format `userId/timestamp.webm` enables this check.
**Warning signs:** Upload fails with `new row violates row-level security policy`.

### Pitfall 4: MediaRecorder `ondataavailable` fires with empty chunks
**What goes wrong:** The final assembled Blob is empty or has 0 bytes.
**Why it happens:** `mediaRecorder.stop()` triggers one final `ondataavailable` event; if the handler collects chunks into a closure but `stop()` resolves before the last event fires, the Blob is assembled too early.
**How to avoid:** Assemble the Blob inside the `onstop` event handler (not after calling `stop()`). Keep `chunks` array in component state, build `new Blob(chunks, { type: mimeType })` only in `onstop`.
**Warning signs:** Blob size is 0 bytes; Whisper API returns an error about empty audio.

### Pitfall 5: `gpt-4o-mini-transcribe` only supports JSON response format
**What goes wrong:** Setting `response_format: "text"` throws a 400 API error.
**Why it happens:** Unlike `whisper-1`, the new gpt-4o transcription models only accept `response_format: "json"`.
**How to avoid:** Always use `response_format: "json"` (or omit it, as JSON is the default). Extract the transcript from `response.text`.
**Warning signs:** `400 Bad Request` from OpenAI audio endpoint when using non-JSON format.

### Pitfall 6: `f.repeat()` vs `f.next()` — wrong API for the use case
**What goes wrong:** Developer calls `f.repeat()` to get all 4 outcomes for the "preview next review date" feature on rating buttons, but then tries to reuse the call for the actual rating — this double-invokes the schedule computation.
**Why it happens:** `f.repeat()` is for UI previews (show all 4 outcomes simultaneously). `f.next()` is for committing a single rating.
**How to avoid:** Call `f.repeat()` client-side (or in a separate preview endpoint) to render "next review in X days" on buttons. Call `f.next(card, now, rating)` server-side when the user submits their rating.

---

## Code Examples

Verified patterns from official sources and codebase:

### FSRS Rate API Route (POST /api/review/rate)
```typescript
// Source: ts-fsrs npm docs + existing confirm/route.ts pattern
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { knowledgeItems, reviewState } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FSRS, Rating, createEmptyCard } from "ts-fsrs";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  // 步骤 1: 验证用户身份 (同 confirm/route.ts 模式)
  // ... auth check ...

  // 步骤 2: 获取 review_state 行
  const { knowledgeItemId, rating } = await request.json();
  const [row] = await db
    .select()
    .from(reviewState)
    .where(eq(reviewState.knowledgeItemId, knowledgeItemId));

  // 步骤 3: 构建 FSRS Card — 首次复习用 createEmptyCard()
  const f = new FSRS();
  const fsrsCard = row.reviewCount === 0
    ? createEmptyCard(row.nextReviewAt)
    : dbRowToFsrsCard(row);  // 自定义映射函数

  // 步骤 4: 计算新状态
  const result = f.next(fsrsCard, new Date(), rating as Rating);

  // 步骤 5: 写回数据库
  await db
    .update(reviewState)
    .set({
      stability: result.card.stability,
      difficulty: result.card.difficulty,
      retrievability: 0,  // 可选：计算或留空
      reviewCount: row.reviewCount + 1,
      lastReviewedAt: new Date(),
      nextReviewAt: result.card.due,
    })
    .where(eq(reviewState.knowledgeItemId, knowledgeItemId));

  return NextResponse.json({ nextReviewAt: result.card.due });
}
```

### Signed URL API Route (POST /api/audio/signed-url)
```typescript
// Source: Supabase JS SDK docs + existing confirm/route.ts auth pattern
export async function POST(request: NextRequest) {
  // ... auth check with service role client ...
  const fileName = `${user.id}/${Date.now()}.webm`;
  const { data, error } = await supabase.storage
    .from("audio")
    .createSignedUploadUrl(fileName);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path: data.path });
}
```

### AudioRecorder Component (key recording logic)
```typescript
// Source: MDN MediaRecorder + Supabase uploadToSignedUrl docs
"use client";
import { useState, useRef } from "react";

export function AudioRecorder({ onTranscriptReady }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeType = getSupportedMimeType(); // codec detection (see Pattern 3)

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      await uploadAndTranscribe(blob, mimeType);
    };
    recorder.start(1000); // 每秒收集一个 chunk
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const togglePause = () => {
    if (isPaused) {
      mediaRecorderRef.current?.resume();
    } else {
      mediaRecorderRef.current?.pause();
    }
    setIsPaused(!isPaused);
  };
}
```

### Today's Review Query (Drizzle)
```typescript
// Source: Drizzle ORM docs + review_state schema
import { lte, eq } from "drizzle-orm";
const dueItems = await db
  .select({
    itemId: knowledgeItems.id,
    title: knowledgeItems.title,
    content: knowledgeItems.content,
    domain: knowledgeItems.domain,
    nextReviewAt: reviewState.nextReviewAt,
    stability: reviewState.stability,
    difficulty: reviewState.difficulty,
    reviewCount: reviewState.reviewCount,
  })
  .from(reviewState)
  .innerJoin(knowledgeItems, eq(reviewState.knowledgeItemId, knowledgeItems.id))
  .where(
    and(
      eq(knowledgeItems.userId, userId),
      lte(reviewState.nextReviewAt, new Date())
    )
  );
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `whisper-1` for transcription | `gpt-4o-mini-transcribe` | March 2025 | 50% cheaper, better accuracy; JSON-only output |
| SM-2 spaced repetition | FSRS algorithm | 2023 (Anki 23.10) | 20-30% fewer reviews for same retention |
| `f.repeat()` for all scheduling | `f.next()` for single-rating scheduling | ts-fsrs 4.0.0 | Cleaner API for server-side use cases |

**Deprecated/outdated:**
- `whisper-1` model: Still works but more expensive and less accurate than `gpt-4o-mini-transcribe` for this use case.
- `f.repeat()` for committing a rating: Use `f.next()` instead; `f.repeat()` is for showing UI previews of all 4 outcomes.

---

## Open Questions

1. **Supabase `audio` bucket creation**
   - What we know: Bucket must exist before uploads; RLS INSERT policy needed on `storage.objects`.
   - What's unclear: Whether bucket was created in Phase 1 setup or needs to be created now.
   - Recommendation: Wave 0 task — create private `audio` bucket via Supabase Dashboard, add INSERT RLS policy.

2. **FSRS preview next-review-date on rating buttons (Claude's Discretion)**
   - What we know: `f.repeat(card, now)` returns all 4 scheduled outcomes; useful for showing "⏱️ +3 days" on each button.
   - What's unclear: Whether to show this in the Phase 2 UI — context.md lists it as Claude's discretion.
   - Recommendation: Include it. Call `f.repeat()` when the card is revealed (client-side, no server call) to display the projected interval on each rating button. Adds ~2 lines of code and significantly reduces rating anxiety.

3. **Transcription polling vs. synchronous flow**
   - What we know: STATE.md decision: synchronous transcription for MVP (safe for files under ~60 seconds). Whisper API call typically takes 5-15 seconds.
   - What's unclear: UX during the wait — does the capture page block while transcribing?
   - Recommendation: Show an inline loading state on the capture page ("正在转写..."). Do not implement async polling for Phase 2; STATE.md explicitly defers Cloudflare Queue to post-v1.

---

## Sources

### Primary (HIGH confidence)
- [ts-fsrs npm package](https://www.npmjs.com/package/ts-fsrs) — Card type, Rating enum, `f.next()` API; version 5.3.1 verified via `npm view`
- [Supabase JS Storage Docs: createSignedUploadUrl](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) — Signed upload URL pattern
- [Supabase JS Storage Docs: uploadToSignedUrl](https://supabase.com/docs/reference/javascript/storage-from-uploadtosignedurl) — Client-side upload to signed URL
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) — RLS INSERT policy requirement
- [MDN MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) — Browser recording API
- [MDN MediaRecorder.isTypeSupported()](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static) — Codec detection
- `E:/projects_all/voice-to-text/voice-to-txt-02/src/db/schema.ts` — Existing DB schema verified
- `E:/projects_all/voice-to-text/voice-to-txt-02/src/app/api/capture/confirm/route.ts` — Auth pattern and DB insert pattern

### Secondary (MEDIUM confidence)
- [framer-motion Tinder cards (GeeksforGeeks)](https://www.geeksforgeeks.org/reactjs/how-to-create-tinder-card-swipe-gesture-using-react-and-framer-motion/) — Swipe card implementation pattern; version 12.38.0 verified via `npm view`
- [OpenAI gpt-4o-mini-transcribe](https://community.openai.com/t/gpt-4o-transcribe-audio-length-limits/1148374) — JSON-only output format confirmed; 25 min max duration
- [media-codings.com cross-browser MediaRecorder](https://media-codings.com/articles/recording-cross-browser-compatible-media) — `audio/webm;codecs=opus` universal support confirmed
- [Medium: Signed URL uploads with Next.js + Supabase](https://medium.com/@olliedoesdev/signed-url-file-uploads-with-nextjs-and-supabase-74ba91b65fe0) — RLS + Next.js pattern walkthrough

### Tertiary (LOW confidence)
- ts-fsrs v5 `learning_steps` field in `Card` type — field name observed from DeepWiki source but not directly verified against v5.3.1 type definitions; use TypeScript compiler errors as ground truth during implementation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via `npm view`; libraries confirmed in use or documented
- Architecture: HIGH — patterns derived directly from existing codebase conventions and official SDK docs
- FSRS integration: HIGH — ts-fsrs API is stable and well-documented; schema alignment verified against `schema.ts`
- Audio/upload flow: HIGH — Supabase signed URL pattern from official docs; Workers memory constraint from STATE.md
- Swipe animation: MEDIUM — framer-motion pattern from tutorials, not official framer-motion docs directly

**Research date:** 2026-03-23
**Valid until:** 2026-06-23 (90 days — stable libs; Supabase Storage API is stable; ts-fsrs 5.x is current)
