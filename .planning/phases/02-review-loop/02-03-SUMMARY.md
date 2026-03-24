---
phase: "02-review-loop"
plan: "03"
subsystem: "review-api"
tags: [fsrs, review, api, ts-fsrs]
dependency_graph:
  requires: [02-01]
  provides: [GET /api/review/today, POST /api/review/rate, src/lib/fsrs.ts]
  affects: [02-04]
tech_stack:
  added: [ts-fsrs]
  patterns: [FSRS algorithm, server-side scheduling, ownership-checked DB updates]
key_files:
  created:
    - src/lib/fsrs.ts
    - src/app/api/review/today/route.ts
    - src/app/api/review/rate/route.ts
  modified:
    - package.json (ts-fsrs added)
    - package-lock.json
decisions:
  - "Used RecordLogItem (not RecordLog) as return type of f.next() — ts-fsrs v5 f.next() returns RecordLogItem, not RecordLog"
  - "createEmptyCard(row.nextReviewAt) for first review — avoids broken stability=0 initial state; passes nextReviewAt as seed date"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-03-23"
  tasks_completed: 3
  files_created: 3
---

# Phase 02 Plan 03: FSRS API Routes Summary

**One-liner:** ts-fsrs installed with FSRS helper utilities and two review API routes (GET today + POST rate) using RecordLogItem return type and createEmptyCard for first-review correctness.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install ts-fsrs and create FSRS helper utilities | 809a0d8 | src/lib/fsrs.ts, package.json |
| 2 | Create GET /api/review/today route | 96641bc | src/app/api/review/today/route.ts |
| 3 | Create POST /api/review/rate route | fcfb847 | src/app/api/review/rate/route.ts |

## What Was Built

### src/lib/fsrs.ts

FSRS helper utilities with two exported functions:

- `dbRowToFsrsCard(row: ReviewStateRow): Card` — converts a DB row's FSRS fields into a ts-fsrs `Card` object. Sets `state: reviewCount === 0 ? 0 : 2` to distinguish New from Review cards.
- `fsrsResultToDbUpdate(result: RecordLogItem, previousReviewCount: number)` — maps the ts-fsrs result back to DB update fields (stability, difficulty, retrievability=0, reviewCount+1, lastReviewedAt=now, nextReviewAt=result.card.due).

### GET /api/review/today

Returns all knowledge items where `nextReviewAt <= NOW()` for the authenticated user.

- Auth: Bearer token via Supabase service role client, 401 on failure
- Query: Drizzle `innerJoin` on `reviewState + knowledgeItems`, filtered by `userId` and `lte(nextReviewAt, new Date())`
- Response: `{ items: [...], count: N }` with all FSRS state fields per item

### POST /api/review/rate

Accepts `{ knowledgeItemId, rating }` (rating 1-4), runs FSRS algorithm, persists updated state.

- Auth: Bearer token, 401 on failure
- Validation: knowledgeItemId must be non-empty string; rating must be integer 1-4
- Ownership: `innerJoin` with `knowledgeItems` filtered by `userId`; 404 if not found
- First review: `createEmptyCard(row.nextReviewAt)` to avoid broken stability=0 state
- Subsequent reviews: `dbRowToFsrsCard(row)` restores FSRS card from DB
- Result: `f.next(fsrsCard, new Date(), rating as Rating)` → `fsrsResultToDbUpdate()` → DB update
- Response: `{ nextReviewAt, stability, difficulty, reviewCount }`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect RecordLog import in fsrs.ts**
- **Found during:** Task 1 — verifying ts-fsrs type definitions
- **Issue:** Plan specified `import { RecordLog } from "ts-fsrs"` but `f.next()` in ts-fsrs v5 returns `RecordLogItem`, not `RecordLog`. `RecordLog` is a map of `Grade -> RecordLogItem` (used for preview mode), not the single-call return type.
- **Fix:** Used `RecordLogItem` as the parameter type for `fsrsResultToDbUpdate()`.
- **Files modified:** src/lib/fsrs.ts
- **Commit:** 809a0d8

**2. [Rule 2 - Missing] Removed unused createEmptyCard import from fsrs.ts**
- **Found during:** Task 3 lint check
- **Issue:** Initial fsrs.ts imported `createEmptyCard` but didn't use it there (it's used in rate/route.ts directly)
- **Fix:** Removed unused import; confirmed 0 lint warnings
- **Files modified:** src/lib/fsrs.ts
- **Commit:** fcfb847

## Known Stubs

None. All three files are fully wired — no placeholder data or TODO stubs.

## Self-Check: PASSED

Files verified:
- src/lib/fsrs.ts — FOUND
- src/app/api/review/today/route.ts — FOUND
- src/app/api/review/rate/route.ts — FOUND

Commits verified:
- 809a0d8 — FOUND (ts-fsrs install + helpers)
- 96641bc — FOUND (GET /api/review/today)
- fcfb847 — FOUND (POST /api/review/rate)
