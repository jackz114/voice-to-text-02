---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: active
last_updated: "2026-03-24T06:09:00Z"
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 22
  completed_plans: 16
---

# Project State: 笔记助手 (bijiassistant)

**Last updated:** 2026-03-24
**Updated by:** user

---

## Project Reference

**Core Value:** 学习时零负担记录，AI 替你管理遗忘曲线——让你知道自己学过什么，并在遗忘前精准唤醒它

**Current Focus:** Phase 03 — retention-engine

**Milestone:** v1 (AI Learning Assistant)

---

## Current Position

Phase: 03 (retention-engine) — EXECUTING
Plan: 6 of 7 (03-06 completed, 03-07 next)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 3 |
| Phases complete | 2 |
| Plans total | 22 |
| Plans complete | 16 |
| Requirements mapped | 31/31 |

---
| Phase 03-retention-engine 03-06 | 15m | 3 tasks | 3 files |
| Phase 03-retention-engine 03-01 | 5m | 5 steps | 2 files |
| Phase 01-capture-pipeline P01 | 12 | 2 tasks | 6 files |
| Phase 01-capture-pipeline P03 | 2 | 2 tasks | 2 files |
| Phase 01 P02 | 3m | 2 tasks | 2 files |
| Phase 01-capture-pipeline P04 | 5 | 3 tasks | 3 files |

## Accumulated Context

### Key Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| websearch_to_tsquery for search syntax | Google-like syntax support (quoted phrases, OR, -excluded) without custom parser complexity | 03-02 |
| Types defined in search.ts not route.ts | Avoids circular dependency between search utilities and API route | 03-02 |
| Hourly cron with timezone conversion | Cloudflare Cron Triggers run on UTC schedule; convert user local time to UTC hour for accurate delivery | 03-06 |
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
| customType for tsvector | Drizzle ORM lacks native tsvector support; customType wrapper enables full-text search with proper typing | 03-01 |
| Weighted search vector (A/B/C) | Title/tags weight A, content weight B, source weight C per D-05 requirements for relevance ranking | 03-01 |
| Pre-migration for Phase 4 vector search | Added embedding column (1536d) with HNSW index in Phase 3 to avoid separate migration later | 03-01 |

### Critical Pitfalls to Avoid

- Audio bytes must never pass through a Cloudflare Worker — use signed URL direct upload from the browser
- Whisper 25 MB limit — enforce low-bitrate (32 kbps Opus) recording and UI duration guard
- LLM hallucination — temperature 0, strict JSON schema, user confirmation step before DB write
- FSRS schema fields (stability, difficulty, retrievability, next_review_at, review_count) must be in Drizzle schema from day one
- Notification fatigue — one daily digest email maximum, only when items are due
- Turnstile test sitekey (`1x00000000000000000000AA` in `LoginForm.tsx:127`) must be replaced before production traffic

### Pending Decisions (resolve during phase planning)

- ~~Cron trigger for notifications: Cloudflare Cron Trigger vs. Supabase pg_cron (decide in Phase 3 planning)~~ **RESOLVED: Cloudflare Cron Trigger selected (03-06)**
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
4. Run `/gsd:plan-phase 1` to begin planning Phase 1

### What Was Done Last

- 2026-03-24: Plan 03-06 completed. Cloudflare Cron Trigger configured for hourly execution. Daily email handler with timezone-aware scheduling, user preference filtering, and Resend email delivery.
- 2026-03-24: Plan 03-01 completed. Database schema extended with full-text search (tsvector + GIN), vector search pre-migration (pgvector + HNSW), and user_preferences table for notification settings.
- 2026-03-24: Phase 2 completed. All 11 plans executed including gap fixes. UAT verified with 10 passed, 0 issues.
- 2026-03-24: User manually fixed remaining 6 gaps from 02-PLAN.md. All fixes verified.
- 2026-03-22: Project initialized. PROJECT.md, REQUIREMENTS.md, research/SUMMARY.md, ROADMAP.md, STATE.md created. 31 v1 requirements mapped across 3 phases.

---

*State initialized: 2026-03-22*
