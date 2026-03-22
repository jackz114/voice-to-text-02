# Roadmap: 笔记助手 (bijiassistant)

**Milestone:** v1 — AI Learning Assistant
**Granularity:** Coarse
**Requirements:** 31 v1 requirements across 3 phases
**Coverage:** 31/31 ✓

---

## Phases

- [ ] **Phase 1: Capture Pipeline** - Database schema + text input + AI knowledge extraction
- [ ] **Phase 2: Review Loop** - Knowledge library + FSRS scheduling + daily review workflow + audio recording
- [ ] **Phase 3: Retention Engine** - Proactive notifications + knowledge search

---

## Phase Details

### Phase 1: Capture Pipeline

**Goal**: Users can capture knowledge from text pastes, and the system produces confirmed, structured knowledge items stored in the database. (Audio recording deferred to Phase 2 per D-06.)

**Depends on**: Nothing (first phase — builds on existing Auth + PayPal foundation)

**Requirements**: TEXT-01, TEXT-02, EXTRACT-01, EXTRACT-02, EXTRACT-03, EXTRACT-04, EXTRACT-05

**Success Criteria** (what must be TRUE):
  1. A user can paste article text into the app and submit it for AI extraction
  2. After submitting text, the user sees a confirmation screen with AI-extracted knowledge items (title, content, source, domain tag, created_at) that they can review and accept or discard before anything is saved
  3. Confirmed knowledge items appear in the database, linked to the user and original source
  4. Each card can be edited (title, content, domain, tags) before confirmation
  5. The database schema is forward-compatible with Phase 2 audio and FSRS features

**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Database schema + Drizzle setup (all 5 tables, FSRS fields, migration)
- [ ] 01-02-PLAN.md — Extract API route + OpenAI client (POST /api/capture/extract)
- [ ] 01-03-PLAN.md — Capture page + TextPasteInput component (UI shell, auth guard)
- [ ] 01-04-PLAN.md — ConfirmationCards + Confirm API + end-to-end wiring (checkpoint for human verification)

---

### Phase 2: Review Loop

**Goal**: Users can browse their accumulated knowledge and complete daily FSRS-scheduled review sessions that accurately update each item's retention state. Phase 2 also adds audio recording and Whisper transcription (deferred from Phase 1).

**Depends on**: Phase 1 (knowledge items must exist before scheduling or review is meaningful)

**Requirements**: LIB-01, LIB-02, LIB-03, FSRS-01, FSRS-02, FSRS-03, FSRS-04, REVIEW-01, REVIEW-02, REVIEW-03, REVIEW-04, AUDIO-01, AUDIO-02, AUDIO-03, TRANS-01, TRANS-02, TRANS-03

**Success Criteria** (what must be TRUE):
  1. A user can browse all their knowledge items, filtered by domain, and open any individual item to see its full content
  2. A user can delete a knowledge item they no longer want
  3. Every newly confirmed knowledge item has a next-review date automatically assigned (first review due the following day)
  4. A user visiting the app sees a "Review Today" list containing only items due today (using FSRS scheduling with stability and difficulty parameters)
  5. After rating a reviewed item Again / Hard / Good / Easy, the item disappears from today's queue and its next review date and FSRS state are updated on the server
  6. A logged-in user can record audio in the browser and have it uploaded to Supabase Storage without the bytes passing through a Cloudflare Worker
  7. The system handles audio files up to the Whisper 25 MB limit and detects the browser's supported audio codec automatically

**Plans**: TBD

---

### Phase 3: Retention Engine

**Goal**: Users are proactively reminded to review on schedule and can search their knowledge base with natural language to retrieve what they have learned.

**Depends on**: Phase 2 (review schedule must exist before reminders are meaningful; knowledge items must exist for search to return results)

**Requirements**: NOTIFY-01, NOTIFY-02, NOTIFY-03, NOTIFY-04, SEARCH-01, SEARCH-02, SEARCH-03

**Success Criteria** (what must be TRUE):
  1. A user with due review items receives at most one email per day summarizing how many items are due and which domains they cover
  2. No email is sent on days when the user has no items due
  3. A user can type a natural language query ("what do I know about Cloudflare Workers?") and receive a list of matching knowledge items ordered by relevance with a preview and source
  4. A user can opt out of email reminders

**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Capture Pipeline | 1/4 | In Progress|  |
| 2. Review Loop | 0/? | Not started | - |
| 3. Retention Engine | 0/? | Not started | - |

---

## Coverage Map

| Requirement | Phase |
|-------------|-------|
| AUDIO-01 | Phase 2 |
| AUDIO-02 | Phase 2 |
| AUDIO-03 | Phase 2 |
| TRANS-01 | Phase 2 |
| TRANS-02 | Phase 2 |
| TRANS-03 | Phase 2 |
| TEXT-01 | Phase 1 |
| TEXT-02 | Phase 1 |
| EXTRACT-01 | Phase 1 |
| EXTRACT-02 | Phase 1 |
| EXTRACT-03 | Phase 1 |
| EXTRACT-04 | Phase 1 |
| EXTRACT-05 | Phase 1 |
| LIB-01 | Phase 2 |
| LIB-02 | Phase 2 |
| LIB-03 | Phase 2 |
| FSRS-01 | Phase 2 |
| FSRS-02 | Phase 2 |
| FSRS-03 | Phase 2 |
| FSRS-04 | Phase 2 |
| REVIEW-01 | Phase 2 |
| REVIEW-02 | Phase 2 |
| REVIEW-03 | Phase 2 |
| REVIEW-04 | Phase 2 |
| NOTIFY-01 | Phase 3 |
| NOTIFY-02 | Phase 3 |
| NOTIFY-03 | Phase 3 |
| NOTIFY-04 | Phase 3 |
| SEARCH-01 | Phase 3 |
| SEARCH-02 | Phase 3 |
| SEARCH-03 | Phase 3 |

**Mapped: 31/31 ✓**

---

*Roadmap created: 2026-03-22*
*Last updated: 2026-03-22 — Phase 1 revised to reflect D-06 (audio deferred to Phase 2); Phase 2 updated to include AUDIO-* and TRANS-* requirements*
