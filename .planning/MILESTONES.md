# Milestones

## v1.0 AI Learning Assistant MVP (Shipped: 2026-03-24)

**Phases completed:** 3 phases, 22 plans executed (1 test plan deferred)
**Code:** ~8,146 lines TypeScript
**Timeline:** 2026-03-22 → 2026-03-24 (3 days)

**What was built:**

### Phase 1: Capture Pipeline
- Full Drizzle schema (5 tables) with FSRS fields and forward-compatible columns
- AI knowledge extraction from text paste (OpenAI GPT-4o-mini with Zod schema)
- User confirmation workflow with per-card accept/reject/edit
- Database persistence with user-scoped RLS policies

### Phase 2: Review Loop
- Browser audio recording with MediaRecorder API
- Whisper API transcription (OpenAI gpt-4o-mini-transcribe)
- Knowledge library with domain filtering and grid/list views
- FSRS scheduling algorithm (ts-fsrs) for optimal retention
- Daily review workflow with Again/Hard/Good/Easy ratings

### Phase 3: Retention Engine
- PostgreSQL full-text search with tsvector + ts_rank
- Global Cmd+K search modal with history persistence
- Full search page with filters, pagination, URL sync
- Email notification service (Resend + React Email)
- Cloudflare Cron Trigger for timezone-aware daily digests
- Notification preferences UI (time, timezone, domain filters)

**Key decisions:**
- FSRS over SM-2 for 20-30% fewer reviews at same retention
- Direct browser-to-Supabase Storage upload (bypass Workers memory limit)
- tsvector full-text search in Phase 3, semantic search deferred to v2
- User confirmation before DB write (mitigate LLM hallucination)

**Known gaps / deferred:**
- 03-08: End-to-end integration testing (requires production deployment)
- Turnstile test sitekey to replace before production traffic
- PayPal webhook signature verification implementation incomplete

---

*For current status, see `.planning/PROJECT.md`*
