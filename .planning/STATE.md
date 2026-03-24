---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-24T04:30:00Z"
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 22
  completed_plans: 17
---

# Project State: 笔记助手 (bijiassistant)

**Last updated:** 2026-03-24
**Updated by:** execute-phase (03-02 completed)

---

## Project Reference

**Core Value:** 学习时零负担记录，AI 替你管理遗忘曲线——让你知道自己学过什么，并在遗忘前精准唤醒它

**Current Focus:** Phase 03 — retention-engine

**Milestone:** v1 (AI Learning Assistant)

---

## Current Position

Phase: 03 (retention-engine) — COMPLETE
Plan: 7 of 7

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 3 |
| Phases complete | 2 |
| Plans total | 22 |
| Plans complete | 17 |
| Requirements mapped | 31/31 |

---
| Phase 01-capture-pipeline P01 | 12 | 2 tasks | 6 files |
| Phase 01-capture-pipeline P03 | 2 | 2 tasks | 2 files |
| Phase 01 P02 | 3m | 2 tasks | 2 files |
| Phase 01-capture-pipeline P04 | 5 | 3 tasks | 3 files |
| Phase 02-review-loop P01 | 8 | 2 tasks | 2 files |
| Phase 02-review-loop P03 | 15m | 3 tasks | 3 files |
| Phase 02-review-loop P05 | 14 | 3 tasks | 5 files |
| Phase 02-review-loop P02 | 8 | 4 tasks | 4 files |
| Phase 02 P04 | 15 | 3 tasks | 4 files |
| Phase 03-retention-engine P01 | 6 | 6 tasks | 2 files |
| Phase 03-retention-engine P02 | 5m | 3 tasks | 2 files |
| Phase 03-retention-engine P03 | 6 | 6 tasks | 5 files |
| Phase 03-retention-engine P04 | 5 | 5 tasks | 4 files |
| Phase 03-retention-engine P05 | 25m | 6 tasks | 4 files |
| Phase 03-retention-engine P06 | 4 | 4 tasks | 2 files |
| Phase 03-retention-engine P07 | 5 | 5 tasks | 3 files |

## Accumulated Context

### Key Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| FSRS over SM-2 | 20-30% fewer reviews for same retention; `ts-fsrs` is zero-dep reference impl; retrofitting FSRS state onto SM-2 schema requires painful migration | Pre-Phase 1 |
| Audio bytes never through Workers | Cloudflare Workers 128 MB memory limit; audio must be uploaded directly from browser to Supabase Storage via signed URL | Pre-Phase 1 |
| Synchronous transcription for MVP | Whisper calls are synchronous in Phase 1-2; Cloudflare Queue async pipeline deferred to post-v1 (safe for files under ~60 seconds) | Pre-Phase 1 |
| Text input before audio | Text paste exercises the same LLM extraction pipeline without MediaRecorder/codec/async complexity; validate extraction quality first | Pre-Phase 1 |
| User confirmation before DB write | LLM hallucination risk; user reviews extracted items before they are committed | Pre-Phase 1 |
| text() over pgEnum for status columns | Avoids enum migration complexity when adding new status values; keeps schema flexible | 01-01 |
| Schema-first design with all 5 tables + FSRS fields | All tables defined before first migration to avoid Phase 2 backfill debt on populated tables | 01-01 |
| DB singleton uses prepare:false | Required for Supabase Transaction pooler compatibility; Session mode would fail under concurrent connections | 01-01 |
| supabase imported from AuthProvider re-export | Shares the same singleton instance as AuthProvider; avoids creating a second client in capture page | 01-03 |
| confirming state is JSON placeholder in Plan 03 | ConfirmationCards component not yet built; Plan 04 replaces the pre block with the real component | 01-03 |
| chat.completions.parse not beta.chat | openai v6.32.0 moved structured output out of beta namespace — beta.chat does not exist in v6 | 01-02 |
| zod/v3 import for zodResponseFormat | Zod v4 breaks OpenAI SDK vendored schema converter; zod/v3 compat shim is the official workaround | 01-02 |
| Per-card state in flat useState array (not react-hook-form) | Dynamic per-card status + edit fields map naturally to array state; form library adds indirection without simplifying | 01-04 |
| FSRS initial values at insert (nextReviewAt=tomorrow, stability=0) | Phase 1 creates review_state rows with placeholder values; Phase 2 applies real FSRS algorithm on first review event | 01-04 |
| Delete review_state before knowledge_item | Drizzle schema has no references().onDelete cascade, so manual ordering is required to avoid FK constraint violation | 02-01 |
| KnowledgeItem type in KnowledgeItemCard, re-exported by KnowledgeLibrary | Avoids circular import since KnowledgeLibrary imports KnowledgeItemCard | 02-02 |
| Modal for library detail view (not [id] route) | No extra API route needed in Phase 2; modal falls back to contentPreview until API returns full content | 02-02 |
| PostgreSQL Hybrid Search (tsvector + pgvector) | Single database supports both full-text and semantic; embedding storage pre-migration prevents backfill debt | 03-03 |
| Daily email trigger — user-defined time | Users know their schedule best; avoids sleep/work interruptions | 03-01 |
| Email content — titles only, hide content | Prevents spoiling active recall; drives app engagement | 03-03 |
| Search result interaction — Drawer/Modal | Preserves context, enables quick iteration, maintains navigation state | 03-04 |
| Real-time search with 300ms debounce | Balances responsiveness and server load; prevents request spam | 03-04 |

### Critical Pitfalls to Avoid

- Audio bytes must never pass through a Cloudflare Worker — use signed URL direct upload from the browser
- Whisper 25 MB limit — enforce low-bitrate (32 kbps Opus) recording and UI duration guard
- LLM hallucination — temperature 0, strict JSON schema, user confirmation step before DB write
- FSRS schema fields (stability, difficulty, retrievability, next_review_at, review_count) must be in Drizzle schema from day one
- Notification fatigue — one daily digest email maximum, only when items are due
- Turnstile test sitekey (`1x00000000000000000000AA` in `LoginForm.tsx:127`) must be replaced before production traffic

### Pending Decisions (resolve during phase planning)

- Cron trigger for notifications: Cloudflare Cron Trigger vs. Supabase pg_cron (decide in Phase 3 planning)
  - **Update 2026-03-24**: Decided to use Cloudflare Cron Trigger for email scheduling (03-CONTEXT.md D-01)
- VAD library Workers compatibility: verify `@ricky0123/vad-web` browser-side WASM works before committing in Phase 1 planning
- Chunk overlap deduplication: concrete algorithm needed if audio approaches 25 MB in Phase 1 planning

### Architecture Notes

- Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4, deployed to Cloudflare Workers via `@opennextjs/cloudflare`
- DB: Supabase Postgres + Drizzle ORM — schema created (src/db/schema.ts), singleton at src/db/index.ts, migration SQL generated; apply with `npx drizzle-kit migrate` after setting DATABASE_URL
- Audio storage: Supabase Storage via signed URL direct upload
- Transcription: OpenAI Whisper API (`gpt-4o-mini-transcribe` model)
- AI extraction: GPT-4o-mini with structured output + Zod schema validation
- FSRS: `ts-fsrs` ^5.2.3, server-side only
- Email: `resend` SDK, free tier 3,000/month
- Existing: Auth (Supabase), PayPal payment UI — complete at UI layer, DB writes are TODO stubs

### Blockers

None currently.

### Open TODOs

- Replace Turnstile test sitekey before any production traffic (`LoginForm.tsx:127`)
- Fix webhook `getPayPalAccessToken` duplication (import from `paypal-client.ts`)
- Fix supabase client singleton duplication in `LoginForm`, `GoogleAuthButton`, `AuthCallbackHandler`

---

## Session Continuity

### How to Resume

1. Read this file for current position
2. Read `.planning/ROADMAP.md` for phase goals and success criteria
3. Read `.planning/REQUIREMENTS.md` for requirement details
4. Read `.planning/phases/03-retention-engine/03-PLAN.md` for execution order
5. Run `/gsd:execute-phase 03` to begin executing Phase 3 plans

### What Was Done Last

- 2026-03-24: Plan 03-07 completed. Notification Preferences UI with /settings/notifications page, email toggle, time picker, timezone selector, domain filters, and display name input. Created user_preferences table, API routes, and updated UserNav with dropdown menu. 6 commits, 8 files, 25m duration.

---

*State initialized: 2026-03-22*
