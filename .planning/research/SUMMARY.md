# Project Research Summary

**Project:** 笔记助手 (bijiassistant) — AI Learning Assistant with Voice Transcription
**Domain:** AI learning assistant / personal knowledge management with voice capture and spaced repetition
**Researched:** 2026-03-22
**Confidence:** HIGH

## Executive Summary

bijiassistant is a pipeline product, not a CRUD app. Raw audio or text enters, passes through transcription and LLM extraction, and exits as scheduled review items with FSRS-computed review dates. The existing codebase has a strong foundation — Next.js 16 / React 19 / Cloudflare Workers / Supabase is the right stack, Auth and PayPal payment UI are complete, and the minutes-balance pricing model is already designed into the DB schema. The remaining work is the actual product: the voice-to-knowledge pipeline, spaced repetition scheduling, and review loop. These are the features that deliver the core value promise: "learn something, capture it, don't forget it."

The recommended build order is strict: database schema first (all tables, all indexes, all RLS), then text-paste input (simpler than audio, validates the LLM extraction pipeline without async complexity), then audio recording (adds MediaRecorder + async processing), then FSRS scheduling and the review loop, then notifications. Every stage has a hard dependency on the previous one — there is no shortcut. The two biggest risks are Cloudflare Workers constraints on audio processing (audio bytes must never pass through a Worker; use direct Supabase Storage upload with signed URLs) and LLM hallucination in knowledge extraction (always ground extraction in verbatim source text with a user review/confirmation step before committing items).

The one significant disagreement across research files is the spaced repetition algorithm. ARCHITECTURE.md recommends starting with SM-2 for simplicity. STACK.md, FEATURES.md, and PITFALLS.md all recommend FSRS from day one. The evidence supports FSRS: it requires 20-30% fewer reviews for the same retention rate (benchmarked across 349 million reviews), the `ts-fsrs` npm package is a maintained reference implementation with zero dependencies, and retrofitting FSRS state (stability, difficulty, retrievability) onto an SM-2 schema later requires a migration. Use FSRS from the start.

## Key Findings

### Recommended Stack

The existing stack is fully correct for this product and should not be changed. The only new runtime dependencies are: `openai` (transcription + LLM extraction), `ts-fsrs` (FSRS algorithm), `postgres` (Drizzle direct DB connection), `drizzle-zod` (auto-generate Zod schemas from Drizzle tables), and `resend` (email notifications). All are Cloudflare Workers compatible via `nodejs_compat_v2`.

**Core technologies:**
- `openai` ^6.32.0: Whisper transcription via `gpt-4o-mini-transcribe` model + LLM extraction via `gpt-4o-mini` — single SDK for both AI tasks, Cloudflare Workers compatible
- `ts-fsrs` ^5.2.3: FSRS spaced repetition — pure TypeScript, zero dependencies, the reference implementation; FSRS outperforms SM-2 on retention benchmarks
- `drizzle-orm` + `postgres` + `drizzle-zod`: Type-safe DB access — already installed (ORM and kit), needs `postgres` driver and `drizzle-zod` added; must set `prepare: false` for Supabase Transaction pool mode
- `supabase-js` (already installed): Direct client upload to Storage via signed URLs — the only safe audio upload pattern under Cloudflare Workers memory limits
- `resend`: Email reminders — simple HTTP API, free tier 3,000/month, Cloudflare Workers compatible
- MediaRecorder API (browser native): Audio capture — no library needed; use `isTypeSupported()` codec probe with fallback chain: `audio/webm;codecs=opus` → `audio/ogg;codecs=opus` → `audio/mp4` → `audio/webm`

**Stack conflict resolved:** ARCHITECTURE.md suggests Cloudflare Queue for async transcription. PITFALLS.md notes this is a Phase 3+ concern — synchronous processing is safe for files under ~2 minutes and acceptable for MVP validation. Build synchronous first, migrate to async Queue when real user load warrants it.

### Expected Features

**Must have (table stakes):**
- Voice/audio capture and upload — core input; without it no other feature matters
- Auto transcription (Whisper) — converts recorded audio to text; baseline requirement
- AI knowledge extraction — LLM structures raw transcript into reviewable items; this IS the product
- FSRS spaced repetition scheduling — schedules review dates at item creation; table stakes in 2026 for any retention app
- Daily review queue — shows what's due today; closing the retention loop
- Confidence-rated review completion (1-4 scale) — feeds FSRS reschedule; critical for algorithm accuracy
- Proactive review reminders (email) — without nudges the forgetting curve loop breaks
- Knowledge library browse by domain — users need to see what they've captured
- Text/article paste as input — same LLM pipeline as audio, much simpler to implement

**Should have (differentiators):**
- FSRS over SM-2 — measurably better outcomes, fewer reviews for same retention
- Zero-friction capture (one tap/click from any page, no topic required at capture time)
- AI domain auto-classification with user-correctable suggestions (not auto-committed)
- Daily review cap (default 20/day) with configurable limit — prevents review debt overwhelm
- AI-generated quiz questions for active recall (30-40% better retention than passive re-reading)
- Semantic search via pgvector ("what do I know about X?")
- User review/confirmation step before knowledge items are committed to DB

**Defer (v2+):**
- Knowledge graph visualization
- Browser push notifications (web app must be stable first; email is sufficient for MVP)
- Audio file upload from disk (vs live recording)
- Real-time transcription (streaming complexity not worth it for this use case)
- Mobile native app

**Anti-features (explicitly do not build):**
- Gamification (points, streaks, badges) — drives engagement metrics not learning outcomes
- Social/sharing — changes privacy model, adds moderation complexity
- Video file upload — transcoding complexity, storage cost
- Bidirectional note linking (Obsidian-style) — wrong persona; semantic search covers retrieval

### Architecture Approach

bijiassistant is organized as a linear transformation pipeline: audio/text → transcription → LLM extraction → FSRS scheduling → review queue → re-scheduling. The key architectural constraint is Cloudflare Workers: audio bytes must never pass through a Worker (128 MB memory limit, I/O object scoping). The upload pattern is: client records audio, uploads directly to Supabase Storage via signed URL, then sends only the storage path to `/api/transcribe`. All AI processing (Whisper, GPT-4o-mini) is called from Next.js API routes (server-side, workers-compatible). FSRS scheduling computations live server-side only — never trust client-computed intervals.

**Major components:**
1. `RecorderWidget` — browser MediaRecorder capture + direct Supabase Storage upload + post storage path to API
2. `TextInputWidget` — paste raw text, same extraction pipeline as transcription output
3. `/api/transcribe` — receives storage path, calls Whisper, stores transcript; async queue deferred to Phase 7
4. `/api/extract` — chunks transcript, calls GPT-4o-mini with structured output, stores `knowledge_items`; includes embedding generation for pgvector
5. FSRS scheduler (server-side in `/api/review`) — computes next review date from confidence rating; uses `ts-fsrs`
6. `ReviewQueue` UI — queries `review_state` where `next_review_at <= NOW()` for the authenticated user
7. `NotificationWorker` — Supabase pg_cron or Cloudflare Cron Trigger fires daily, queries due items, sends Resend email digest

### Critical Pitfalls

1. **Audio bytes through Cloudflare Workers** — Upload audio directly from the browser to Supabase Storage using signed URLs; the API route receives only the storage path. Implement this correctly from day one — it cannot be retrofitted easily.

2. **Whisper 25 MB file size limit** — Audio at low bitrate (32 kbps Opus) stays under 25 MB for ~60-90 minutes. Enforce low-bitrate recording settings in MediaRecorder and set a UI-level duration guard. For longer sessions, implement server-side chunking with overlap deduplication.

3. **LLM hallucination in knowledge extraction** — Prompt must instruct the model to only extract facts explicitly stated in the transcript. Return source sentence alongside each item. Build a user review/confirmation step before items are committed to the database. Use temperature 0 and strict JSON schema with `additionalProperties: false`.

4. **Database schema not designed for FSRS from the start** — Design all tables before the first Drizzle migration. The `review_state` table needs `stability`, `difficulty`, `retrievability`, `next_review_at`, and `review_count` columns from day one. Missing these requires a migration at the worst possible time (during active development).

5. **Notification fatigue killing the retention loop** — Batch all due items into one daily digest email. Never send more than once per day. Let users set their preferred reminder time. This is a UX design decision that must precede the technical implementation.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation — Database, Schema, and Infrastructure
**Rationale:** Everything else depends on the database schema being correct from the start. Writing Drizzle schemas after spaced repetition is understood avoids the common trap of bolting on FSRS state fields later as a migration.
**Delivers:** All 5 tables (users, transcriptions, knowledge_items, review_state, user_balances) with FSRS fields, RLS policies, DB indexes on `review_state.next_review_at + user_id`, auth wired to user row creation, Drizzle db client configured correctly with `prepare: false`.
**Addresses:** Auth (already complete), database integration (currently all TODO), user balance tracking wired to actual DB
**Avoids:** Pitfall 9 (schema not designed for spaced repetition state), ensures FSRS fields exist before scheduling code is written

### Phase 2: Text Capture and AI Extraction Pipeline
**Rationale:** Text paste is simpler than audio (no MediaRecorder, no async upload, no codec concerns) but exercises the same LLM extraction pipeline. Validate the hardest AI logic (extraction prompt quality, hallucination prevention, structured output parsing) before adding audio complexity on top.
**Delivers:** Text/article paste input, GPT-4o-mini structured extraction with user confirmation step, knowledge_items stored in DB, domain auto-classification as correctable suggestions, pgvector embeddings generated at item creation
**Uses:** `openai` SDK, `zodResponseFormat`, Zod structured output, `drizzle-zod` for insert validation
**Avoids:** Pitfall 4 (hallucination — user review step before commit), Pitfall 8 (auto-classification trust — suggestions not auto-commits)

### Phase 3: Audio Capture and Transcription
**Rationale:** Audio adds MediaRecorder cross-browser complexity plus the Cloudflare Workers upload constraint. Only tackle it after the extraction pipeline is proven with simpler text input.
**Delivers:** RecorderWidget with codec detection (`isTypeSupported()` fallback chain), direct Supabase Storage upload via signed URL, Whisper transcription, end-to-end audio-to-knowledge-item flow
**Implements:** Store-then-reference pattern (Pitfall 1 prevention), low-bitrate Opus recording settings, UI duration guard for 25 MB limit
**Avoids:** Pitfall 1 (audio through Workers), Pitfall 2 (25 MB limit), Pitfall 10 (MediaRecorder cross-browser), Pitfall 3 (cost overrun — mono 16 kHz low bitrate from recording start)

### Phase 4: FSRS Scheduling and Review Loop
**Rationale:** Knowledge items must exist (Phase 2/3) before scheduling can be built. This is the core retention mechanism — without it the product is just a note-taking app.
**Delivers:** FSRS scheduling at item creation (first review due next day), daily review queue UI, confidence-rated review completion (1-4 scale), server-side FSRS reschedule on submission, daily review cap (default 20/day), review progress tracking
**Uses:** `ts-fsrs` ^5.2.3 — server-side only; client submits grade, server computes new state
**Avoids:** Pitfall 6 (SM-2 vs FSRS — use FSRS from day one), Pitfall 13 (review debt — daily cap in scheduling logic from the start)

### Phase 5: Reminders and Notifications
**Rationale:** The review queue exists but users won't return without nudges. Notifications are the re-engagement mechanism for the forgetting curve loop.
**Delivers:** Daily email digest via Resend (batched per user, all due items in one email), user-configurable reminder time, Supabase pg_cron or Cloudflare Cron Trigger for daily sweep, opt-out mechanism
**Avoids:** Pitfall 5 (notification fatigue — digest not per-item, user-controlled timing, 1/day cap)

### Phase 6: Knowledge Discovery
**Rationale:** Users need to browse and search their accumulated knowledge. pgvector embeddings were generated in Phase 2/3, so semantic search infrastructure already exists.
**Delivers:** Knowledge library browse with domain filter, semantic search via pgvector cosine similarity + GPT-4o-mini synthesis, "what do I know about X?" query interface
**Implements:** `/api/query` semantic search route, `KnowledgeBrowser` UI component

### Phase 7: Production Hardening (Async Pipeline)
**Rationale:** Synchronous Whisper calls exceed Cloudflare Workers' 30s wall-clock limit for audio over ~60 seconds. This phase converts the synchronous transcription flow to async with Cloudflare Queue + Supabase Realtime status subscriptions.
**Delivers:** Cloudflare Queue consumer for transcription, Supabase Realtime status updates in the browser, error recovery and retry logic, explicit status state machine (`pending → processing → completed → knowledge_extracted | failed`)
**Avoids:** Pitfall 12 (blocking API routes), Anti-Pattern 1 from ARCHITECTURE.md (synchronous transcription in production)

### Phase Ordering Rationale

- Schema before features: FSRS state fields cannot be added after the fact without painful migrations. All 5 tables must be designed holistically before the first `drizzle-kit generate`.
- Text before audio: Audio adds MediaRecorder + upload + async processing as simultaneous unknowns. Text input isolates the extraction pipeline for faster validation.
- Extraction before scheduling: FSRS scheduling requires knowledge items to exist and schedule. No shortcut.
- Notifications after scheduling: No point in sending reminders if nothing is scheduled.
- Async pipeline last: Synchronous works correctly for files under ~60 seconds. Cloudflare Queue adds operational complexity that is not justified until real user load demands it.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Audio):** Cloudflare Workers signed URL upload implementation details may need API verification. VAD (voice activity detection) client-side library (`@ricky0123/vad-web`) needs evaluation for Cloudflare Workers bundle compatibility.
- **Phase 5 (Notifications):** Supabase pg_cron vs Cloudflare Workers Cron Trigger tradeoffs — research files disagree (ARCHITECTURE.md prefers Cloudflare Cron; STACK.md prefers pg_cron). Needs a concrete decision based on operational preferences before implementation.
- **Phase 7 (Async Pipeline):** Cloudflare Queue setup and consumer Worker configuration is not standard Next.js territory. Needs dedicated research before planning.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Schema):** Drizzle + Supabase is well-documented with official guides. The schema design is fully specified in research.
- **Phase 2 (Text extraction):** OpenAI structured outputs with Zod is well-documented in official OpenAI guides. Pattern is straightforward.
- **Phase 4 (FSRS):** `ts-fsrs` package has clear TypeScript API. FSRS algorithm is well-specified. Standard server-side implementation.
- **Phase 6 (Discovery):** pgvector in Supabase is well-documented. Standard RAG pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified against npm registry and official docs. Cloudflare Workers compatibility confirmed. The SM-2 vs FSRS disagreement between research files is resolved in favor of FSRS based on stronger evidence weight (3 files vs 1). |
| Features | HIGH | Core feature set is clear and consistent across research files. Anti-features are well-reasoned. Pricing model (minutes balance) already designed into existing schema. |
| Architecture | MEDIUM-HIGH | Cloudflare Workers constraints are HIGH (official docs). The sync-vs-async transcription tradeoff is pragmatically resolved: sync for MVP, async for Phase 7. The pg_cron vs Cloudflare Cron Trigger choice for notifications remains open. |
| Pitfalls | HIGH | All critical pitfalls have official source backing. LLM hallucination and notification fatigue risks are supported by peer-reviewed research and primary benchmark data. |

**Overall confidence:** HIGH

### Gaps to Address

- **Cron trigger choice for notifications:** ARCHITECTURE.md recommends Cloudflare Cron Triggers; STACK.md recommends Supabase pg_cron. Both work technically. Decision should be made in Phase 5 planning based on: (a) whether Edge Functions are already being used for other purposes, and (b) operational preference for keeping scheduling logic near the data vs. near the application.

- **VAD library Workers compatibility:** `@ricky0123/vad-web` (Silero VAD) uses WebAssembly in the browser — this should work fine as a client-side library, but needs verification before committing to it in Phase 3.

- **Chunk overlap deduplication strategy:** For audio files approaching the 25 MB Whisper limit, overlapping-chunk transcription is recommended but the deduplication algorithm for joining chunks is not specified. This needs a concrete implementation decision in Phase 3 planning.

- **Turnstile sitekey replacement:** The test key `1x00000000000000000000AA` in `LoginForm.tsx:127` must be replaced before any production traffic. Already tracked in CLAUDE.md pre-launch checklist but must not be forgotten in Phase 1.

## Sources

### Primary (HIGH confidence)
- OpenAI API reference (speech-to-text, structured outputs) — transcription model, extraction pattern
- Drizzle ORM + Supabase official integration guide — `prepare: false` requirement, schema patterns
- Cloudflare Workers Limits official docs — 128 MB memory limit, 30s wall-clock, I/O scoping
- Supabase Storage official docs — signed URL upload pattern, TUS resumable uploads, 50 MB free tier limit
- `ts-fsrs` GitHub (open-spaced-repetition org) — v5.2.3 verified, FSRS algorithm parameters
- FSRS Algorithm Benchmark (expertium.github.io) — 349M review benchmark, 20-30% fewer reviews vs SM-2
- Anki FSRS FAQ (official Anki documentation) — FSRS algorithm adoption and rationale
- MDN MediaRecorder API — codec support matrix, `isTypeSupported()` usage

### Secondary (MEDIUM confidence)
- Supabase pg_cron documentation — scheduling pattern for notifications
- Pinecone chunking strategies guide — 500-800 token semantic chunks for extraction
- AssemblyAI Voice AI Stack 2026 — audio pipeline architecture patterns
- PKM user abandonment research (Forte Labs, 68% stat) — friction at capture is primary churn driver
- Push notification fatigue data (multiple corroborating industry sources) — 10% opt-out rate at high frequency

### Tertiary (LOW confidence)
- Raccoongang microlearning apps 2026 — general feature landscape context only

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
