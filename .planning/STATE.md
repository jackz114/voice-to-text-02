# Project State: 笔记助手 (bijiassistant)

**Last updated:** 2026-03-22
**Updated by:** roadmapper (initial creation)

---

## Project Reference

**Core Value:** 学习时零负担记录，AI 替你管理遗忘曲线——让你知道自己学过什么，并在遗忘前精准唤醒它

**Current Focus:** Phase 1 — Capture Pipeline

**Milestone:** v1 (AI Learning Assistant)

---

## Current Position

**Phase:** 1 — Capture Pipeline
**Plan:** None yet (awaiting `/gsd:plan-phase 1`)
**Status:** Not started

```
Progress: [          ] 0%

Phase 1: Capture Pipeline     [ ] Not started
Phase 2: Review Loop          [ ] Not started
Phase 3: Retention Engine     [ ] Not started
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 3 |
| Phases complete | 0 |
| Plans total | TBD |
| Plans complete | 0 |
| Requirements mapped | 31/31 |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| FSRS over SM-2 | 20-30% fewer reviews for same retention; `ts-fsrs` is zero-dep reference impl; retrofitting FSRS state onto SM-2 schema requires painful migration | Pre-Phase 1 |
| Audio bytes never through Workers | Cloudflare Workers 128 MB memory limit; audio must be uploaded directly from browser to Supabase Storage via signed URL | Pre-Phase 1 |
| Synchronous transcription for MVP | Whisper calls are synchronous in Phase 1-2; Cloudflare Queue async pipeline deferred to post-v1 (safe for files under ~60 seconds) | Pre-Phase 1 |
| Text input before audio | Text paste exercises the same LLM extraction pipeline without MediaRecorder/codec/async complexity; validate extraction quality first | Pre-Phase 1 |
| User confirmation before DB write | LLM hallucination risk; user reviews extracted items before they are committed | Pre-Phase 1 |

### Critical Pitfalls to Avoid

- Audio bytes must never pass through a Cloudflare Worker — use signed URL direct upload from the browser
- Whisper 25 MB limit — enforce low-bitrate (32 kbps Opus) recording and UI duration guard
- LLM hallucination — temperature 0, strict JSON schema, user confirmation step before DB write
- FSRS schema fields (stability, difficulty, retrievability, next_review_at, review_count) must be in Drizzle schema from day one
- Notification fatigue — one daily digest email maximum, only when items are due
- Turnstile test sitekey (`1x00000000000000000000AA` in `LoginForm.tsx:127`) must be replaced before production traffic

### Pending Decisions (resolve during phase planning)

- Cron trigger for notifications: Cloudflare Cron Trigger vs. Supabase pg_cron (decide in Phase 3 planning)
- VAD library Workers compatibility: verify `@ricky0123/vad-web` browser-side WASM works before committing in Phase 1 planning
- Chunk overlap deduplication: concrete algorithm needed if audio approaches 25 MB in Phase 1 planning

### Architecture Notes

- Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4, deployed to Cloudflare Workers via `@opennextjs/cloudflare`
- DB: Supabase Postgres + Drizzle ORM (no schema files yet — must be created in Phase 1)
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

- 2026-03-22: Project initialized. PROJECT.md, REQUIREMENTS.md, research/SUMMARY.md, ROADMAP.md, STATE.md created. 31 v1 requirements mapped across 3 phases.

---

*State initialized: 2026-03-22*
