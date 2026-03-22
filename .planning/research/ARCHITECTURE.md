# Architecture Patterns

**Domain:** AI learning assistant — voice-to-knowledge with spaced repetition
**Researched:** 2026-03-22
**Confidence:** MEDIUM-HIGH (architecture patterns verified via multiple sources; Cloudflare-specific constraints HIGH from official docs)

---

## System Overview

bijiassistant is a pipeline system, not a CRUD app. Data enters as unstructured audio or text, passes through multiple transformation stages, and exits as scheduled review items. Each stage has a clear input/output contract and can fail independently — the architecture must account for async processing, partial failures, and background scheduling.

```
INPUT LAYER          PROCESSING LAYER          STORAGE LAYER          OUTPUT LAYER
─────────────        ──────────────────        ──────────────         ──────────────
Browser               API Routes               Supabase Postgres       Web UI
  MediaRecorder   ──>   /api/transcribe    ──>   transcriptions    ──>   Knowledge browser
  Text paste      ──>   /api/extract       ──>   knowledge_items   ──>   Review queue
  Article URL     ──>   /api/classify      ──>   review_schedules  ──>   Notifications
                        /api/review        ──>   user_balances     ──>   Chat query
                        /api/query         ──>
                        /api/notify        ──>   Supabase Storage
                                                   audio files
                                           ──>   pgvector
                                                   embeddings
```

---

## Recommended Architecture

### Layer 1: Capture (Client)

The browser owns audio capture. `MediaRecorder` with `audio/webm;codecs=opus` is the standard pattern. The client:
1. Records audio chunks into an array via `ondataavailable`
2. Assembles a `Blob` on `stop()`
3. Uploads the Blob directly to Supabase Storage (private bucket, presigned URL or client SDK)
4. Posts the Supabase storage path to `/api/transcribe` — never the raw bytes

**Why upload-then-reference:** Cloudflare Workers has a 128 MB memory limit per isolate. Passing large audio blobs through API routes will crash the Worker. Storing first and passing a reference is the correct pattern.

### Layer 2: Transcription Pipeline (Async)

This is where the Cloudflare constraint matters most. Transcription is a long I/O operation and cannot be a synchronous API route response.

Recommended pattern:
```
POST /api/transcribe  (receives storage path)
  └─> Inserts transcription record (status: "pending") into DB
  └─> Enqueues job to Cloudflare Queue
  └─> Returns { transcription_id, status: "pending" } immediately

Cloudflare Queue Consumer Worker:
  └─> Fetches audio from Supabase Storage
  └─> Streams audio to OpenAI Whisper API (whisper-1)
  └─> Stores transcript text in DB (status: "completed")
  └─> Triggers /api/extract job (or enqueues next stage)
```

**Why Cloudflare Queue not synchronous:** The default CPU time limit is 30s (configurable to 5 min on Paid), but waiting on external APIs does not count toward CPU time. The real risk is the 30s wall-clock limit on synchronous requests. Whisper API calls on audio >1 min will exceed this. Queues decouple the request from the processing and have no wall-clock limit for consumers.

**Alternative (simpler, Phase 1 viable):** Use Supabase Edge Functions (Deno runtime, no Cloudflare constraints) as the Whisper proxy. More operational overhead but avoids Cloudflare limits entirely for the transcription step.

### Layer 3: Knowledge Extraction (Async, LLM)

After transcription, an LLM call extracts structured knowledge items. This is a structured output extraction problem, not RAG — the source text is already available.

```
Transcript text
  └─> Chunk into ~500-800 token semantic segments
  └─> For each chunk: call LLM with structured extraction prompt
  └─> LLM returns: [{ title, summary, domain, tags, importance_score }]
  └─> Store as knowledge_items rows
  └─> Generate embeddings for each item (text-embedding-3-small)
  └─> Store embeddings in pgvector column
```

The extraction prompt is the critical piece. Structured output (JSON mode) from OpenAI is reliable and eliminates parsing failures.

### Layer 4: Classification (Automated + User-Adjustable)

Domain classification happens in the extraction step. The LLM assigns a `domain` field (e.g., "React", "Marketing", "Business"). The system maintains a loose taxonomy seeded by the user's historical domains. Users can rename or merge domains via UI — this is a label operation on existing knowledge_items rows.

**No hard taxonomy up-front.** Let domains emerge from content. This is the correct approach for a personal knowledge tool: every user's domain structure is different.

### Layer 5: Spaced Repetition Scheduler

SM-2 is the correct algorithm for this use case. FSRS (Free Spaced Repetition Scheduler, Anki's newer algorithm) is more accurate but significantly more complex to implement. Start with SM-2.

SM-2 state per knowledge item:
```typescript
interface ReviewSchedule {
  knowledge_item_id: string;
  interval_days: number;        // current interval (1 → 6 → growing)
  ease_factor: number;          // default 2.5, range 1.3–3.0
  repetitions: number;          // consecutive correct recalls
  due_date: Date;               // when to review next
  last_reviewed_at: Date | null;
}
```

On review completion:
- Grade 0-2 (forgot): reset `interval` to 1, `repetitions` to 0
- Grade 3-5 (remembered): interval = prev_interval * ease_factor, ease adjusted by grade
- All computation happens in a server-side API route — never trust client-computed scheduling

### Layer 6: Knowledge Query (RAG)

Users can ask "what do I know about React hooks?" This is a semantic search + LLM synthesis problem:

```
User query string
  └─> Embed query (text-embedding-3-small)
  └─> pgvector cosine similarity search → top-k knowledge_items
  └─> Assemble context window from retrieved items
  └─> LLM synthesizes answer citing sources
  └─> Return answer + source knowledge_item IDs
```

This is standard RAG. Supabase pgvector makes this straightforward to add on top of the existing Postgres setup.

### Layer 7: Notification (Scheduled)

Review reminders are the product's core value delivery mechanism. The architecture needs a cron-like trigger.

```
Cloudflare Workers Cron Trigger (daily, configurable time)
  └─> Query: SELECT * FROM review_schedules WHERE due_date <= NOW()
  └─> For each due item's user: send notification
  └─> Notification channels: in-app (Supabase Realtime) + email (Resend/Loops)
```

**Do not use a database cron job (pg_cron) for this.** Cloudflare Cron Triggers are the right tool within the existing deployment model.

---

## Component Boundaries

| Component | Responsibility | Input | Output | Communicates With |
|-----------|---------------|-------|--------|-------------------|
| `RecorderWidget` | Capture audio, display recording state | User gesture | `Blob`, Supabase path | Supabase Storage, `/api/transcribe` |
| `TextInputWidget` | Accept pasted text/articles | User text | Raw string | `/api/extract` |
| `/api/transcribe` | Accept upload reference, enqueue job | storage path | `{ transcription_id, status }` | DB, Cloudflare Queue |
| `TranscriptionWorker` | Call Whisper, store result | Queue message | DB row update | Supabase DB, OpenAI |
| `/api/extract` | Trigger LLM extraction on transcript | `transcription_id` | `knowledge_item[]` | OpenAI, DB |
| `/api/review` | Submit review grade, compute next interval | `item_id`, grade | Updated `review_schedule` | DB (SM-2 logic here) |
| `/api/query` | Semantic search over knowledge base | Query string | Answer + sources | pgvector, OpenAI |
| `NotificationWorker` | Find due items, send reminders | Cron trigger | Notifications sent | DB, email service |
| `KnowledgeBrowser` | Display items by domain | — | UI | `/api/query`, DB |
| `ReviewQueue` | Show today's due items | — | UI | DB |

---

## Data Flow

### Path A: Audio Recording

```
Browser
  1. getUserMedia() → MediaRecorder starts
  2. ondataavailable → collect chunks[]
  3. stop() → Blob assembled
  4. supabase.storage.upload(blob) → storage_path
  5. POST /api/transcribe { storage_path }
  6. Response: { transcription_id, status: "pending" }
  7. UI polls / subscribes via Supabase Realtime

Cloudflare Queue Consumer
  8. Fetch audio from Supabase Storage
  9. POST to OpenAI Whisper API → transcript_text
  10. UPDATE transcriptions SET text = ..., status = "completed"
  11. Enqueue extraction job

Extraction Worker
  12. Chunk transcript into segments
  13. Call OpenAI structured extraction for each chunk
  14. INSERT knowledge_items[]
  15. Generate embeddings → store in pgvector
  16. INSERT review_schedules[] (due_date = now + 1 day, SM-2 initial state)
  17. UPDATE transcriptions SET status = "knowledge_extracted"

Browser (Realtime subscription)
  18. Receives status update → shows extracted knowledge items
```

### Path B: Text/Article Input

Same as Path A, steps 8-17 only (no audio, no Whisper). The extraction step is called directly with the pasted text.

### Path C: Review Session

```
Browser
  1. GET /api/review/due → list of due knowledge_items
  2. User reviews item, grades recall (0-5)
  3. POST /api/review { item_id, grade }

API Route
  4. Fetch current SM-2 state from review_schedules
  5. Compute new interval, ease_factor, due_date
  6. UPDATE review_schedules SET ...
  7. Return { next_due_date }
```

### Path D: Query

```
Browser
  1. User types "what do I know about X?"
  2. POST /api/query { text }

API Route
  3. Embed query text
  4. SELECT knowledge_items ORDER BY embedding <=> query_embedding LIMIT 10
  5. Build LLM prompt with retrieved items
  6. Stream LLM response back to browser
```

---

## Build Order (Phase Dependencies)

This is the strict dependency chain. Each layer is a prerequisite for the next.

```
Phase 1: Foundation
  ├─ Drizzle schema (5 tables: users, transcriptions, knowledge_items, review_schedules, user_balances)
  ├─ Database migrations + RLS policies
  └─ Auth wired to DB (user row creation on signup)

Phase 2: Capture + Transcription
  ├─ REQUIRES: Phase 1 (DB + auth)
  ├─ RecorderWidget (MediaRecorder, Supabase Storage upload)
  ├─ /api/transcribe route (synchronous in Phase 2 for simplicity, async in Phase 3)
  └─ TextInputWidget (text paste path, simpler to validate extraction before audio)
        NOTE: Build text input BEFORE audio — it removes the async complexity for
        validating the extraction pipeline. Audio + async adds two unknowns at once.

Phase 3: AI Extraction + Classification
  ├─ REQUIRES: Phase 2 (transcriptions in DB)
  ├─ LLM extraction prompt + structured output parsing
  ├─ knowledge_items storage + domain assignment
  └─ Embedding generation + pgvector storage

Phase 4: Spaced Repetition
  ├─ REQUIRES: Phase 3 (knowledge_items exist)
  ├─ SM-2 algorithm implementation
  ├─ review_schedules table population on item creation
  ├─ /api/review routes (get due items, submit grade)
  └─ ReviewQueue UI

Phase 5: Notification + Polish
  ├─ REQUIRES: Phase 4 (review_schedules)
  ├─ Cloudflare Cron Trigger for daily reminder sweep
  ├─ Email delivery (Resend recommended — simple HTTP API, Cloudflare-compatible)
  └─ In-app notification badge

Phase 6: Query (RAG)
  ├─ REQUIRES: Phase 3 (embeddings in pgvector)
  ├─ /api/query semantic search
  ├─ LLM synthesis layer
  └─ Query UI widget

Phase 7: Async Pipeline (Production hardening)
  ├─ REQUIRES: Phase 2-3 working synchronously
  ├─ Cloudflare Queue setup for transcription
  ├─ Supabase Realtime status subscriptions
  └─ Error recovery + retry logic
```

**Rationale for this order:**
- Phases 1-2 establish the data plumbing before any AI work
- Text input before audio: audio adds MediaRecorder + async complexity simultaneously; text input validates the extraction pipeline with a simpler integration surface
- SM-2 scheduling in Phase 4 is a pure logic layer; it only needs knowledge_items to exist
- Notifications in Phase 5 are not blocking to core value — the review queue UI is sufficient for MVP
- Async pipeline last because synchronous works fine for files under ~2 min and avoids Cloudflare Queue setup overhead during early validation

---

## Patterns to Follow

### Pattern 1: Status Machine for Long-Running Jobs

Every transcription has an explicit status: `pending → processing → completed → knowledge_extracted | failed`. Never infer state from nulls.

```typescript
type TranscriptionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "knowledge_extracted"
  | "failed";
```

The UI subscribes to status changes via Supabase Realtime channels. This avoids polling and provides immediate feedback.

### Pattern 2: Store-Then-Reference for Audio

Never pass audio bytes through API routes. Always:
1. Upload to Supabase Storage → get path
2. Pass path to processing functions
3. Processing fetches from Storage directly

### Pattern 3: Idempotent Extraction

LLM extraction can be re-run. If extraction fails midway, the system should be able to re-extract from the same transcript without creating duplicates. Use `transcription_id` as a deduplication key for knowledge_items.

### Pattern 4: SM-2 State Lives in DB Only

Never trust client-side SM-2 computations. The grade comes from the client; the interval calculation happens server-side. This prevents grade manipulation and keeps the scheduling consistent.

### Pattern 5: Domain Labels are User Data

Do not hardcode a taxonomy. Let the LLM assign domains as free-form strings. Store the set of a user's unique domains as a derived query (`SELECT DISTINCT domain FROM knowledge_items WHERE user_id = ?`). Users can rename labels via a simple UPDATE — no taxonomy table needed.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Synchronous Transcription in Production

**What goes wrong:** For audio files over ~60 seconds, the Cloudflare Worker wall-clock limit (30s default) will be exceeded. The request returns 1102 or a timeout, but the audio was already stored — leading to orphaned uploads and confused UX.

**Instead:** Accept the upload path, return `{ status: "pending" }` immediately, process via Cloudflare Queue.

### Anti-Pattern 2: Buffering Full Audio in Worker Memory

**What goes wrong:** A 10-minute audio file is ~15-30 MB. Reading it with `arrayBuffer()` in a Worker hits the 128 MB memory limit when multiple requests are concurrent.

**Instead:** Stream the audio from Supabase Storage to the Whisper API using `TransformStream`. Never load the whole file into memory.

### Anti-Pattern 3: Building the Knowledge Graph First

**What goes wrong:** Graph databases (Neo4j, etc.) or heavy GraphRAG architectures add significant infrastructure complexity. For a personal tool with one user's data, full-text search + pgvector cosine similarity returns excellent results without a graph layer.

**Instead:** Use pgvector for semantic search. Add graph relationships only if users start requesting "show me how topic X connects to Y" — this is a future differentiator, not MVP.

### Anti-Pattern 4: FSRS Before SM-2

**What goes wrong:** FSRS (the modern Anki algorithm) requires maintaining a 4-component memory state per item and fitting stability parameters per user. It is meaningfully more complex than SM-2 and requires more review history to outperform SM-2.

**Instead:** Implement SM-2 first. The improvement from FSRS is marginal in early stages (users have little review history). Migrate to FSRS later if retention metrics warrant it.

### Anti-Pattern 5: One Extraction LLM Call per Full Transcript

**What goes wrong:** A 30-minute lecture transcript is ~15,000 words. This exceeds practical context windows for reliable structured extraction and produces poor granularity (one giant extraction instead of focused knowledge items).

**Instead:** Chunk transcripts semantically before extraction. Target 500-800 token chunks. Each chunk produces 1-3 focused knowledge items. More calls, better quality.

---

## Scalability Considerations

| Concern | Phase 1-2 (single user) | Phase 3-5 (dozens of users) | Phase 6+ (hundreds+) |
|---------|------------------------|------------------------------|----------------------|
| Transcription | Synchronous API route fine | Cloudflare Queue required | Queue + concurrency limits |
| Embedding generation | Per-item on extraction | Batch during extraction | Background batch job |
| Review scheduling | Query on page load | Add DB index on `due_date` | Partitioned by user_id |
| Knowledge query | pgvector on full table | pgvector with HNSW index | Partition vectors per user |
| Notifications | Cron queries all users | Cron with pagination | Segment by timezone |
| Storage costs | Supabase free tier | Monitor Supabase Storage GB | CDN or R2 for audio |

The current architecture supports the single-developer target user without changes. The transition from synchronous to async transcription (Phase 7) is the only mandatory scaling step before opening to other users.

---

## Key Infrastructure Decisions

| Decision | Recommendation | Reason |
|----------|---------------|--------|
| Transcription API | OpenAI Whisper (whisper-1) | Mature, accurate, simple HTTP API, Cloudflare-compatible |
| Async processing | Cloudflare Queue (not Supabase Edge Functions) | Already in Cloudflare ecosystem; Edge Functions add Deno/Supabase dependency |
| Vector store | Supabase pgvector | Already in existing DB; no new infrastructure |
| Embedding model | text-embedding-3-small | Cheap, fast, 1536 dims, adequate for personal knowledge scale |
| Email notifications | Resend | Simple REST API, generous free tier, Cloudflare Workers compatible |
| SR algorithm | SM-2 | Well-understood, proven, simple to implement correctly |
| Domain taxonomy | Emergent (LLM-assigned strings) | No upfront design needed; user-specific by nature |

---

## Sources

- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) — CPU time, memory limits (HIGH confidence, official)
- [Cloudflare Queues Overview](https://developers.cloudflare.com/queues/) — Background job patterns (HIGH confidence, official)
- [Cloudflare Workers AI: Whisper with Chunking](https://developers.cloudflare.com/workers-ai/guides/tutorials/build-a-workers-ai-whisper-with-chunking/) — Audio chunking guidance (HIGH confidence, official)
- [Supabase pgvector Docs](https://supabase.com/docs/guides/database/extensions/pgvector) — Vector search integration (HIGH confidence, official)
- [Supabase AI & Vectors Guide](https://supabase.com/docs/guides/ai) — Embedding pipeline patterns (HIGH confidence, official)
- [MDN MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) — Browser audio recording (HIGH confidence, official)
- [SM-2 Algorithm — tegaru.app](https://tegaru.app/en/blog/sm2-algorithm-explained) — SM-2 implementation details (MEDIUM confidence, secondary source)
- [FSRS vs SM-2 — open-spaced-repetition](https://github.com/open-spaced-repetition/fsrs4anki/wiki/spaced-repetition-algorithm:-a-three%E2%80%90day-journey-from-novice-to-expert) — Algorithm comparison (MEDIUM confidence, community)
- [Pinecone: Chunking Strategies for LLM Applications](https://www.pinecone.io/learn/chunking-strategies/) — Chunking guidance (MEDIUM confidence, vendor docs)
- [AssemblyAI: The Voice AI Stack 2026](https://www.assemblyai.com/blog/the-voice-ai-stack-for-building-agents) — Current voice AI architecture patterns (MEDIUM confidence, vendor)
