---
phase: 02-review-loop
plan: "01"
subsystem: library-api
tags: [api, drizzle, supabase-auth, knowledge-library]
dependency_graph:
  requires: [src/db/schema.ts, src/db/index.ts, src/app/api/capture/confirm/route.ts]
  provides: [GET /api/library/list, DELETE /api/library/delete]
  affects: [src/app/library/page.tsx (plan 02-02)]
tech_stack:
  added: []
  patterns: [drizzle-innerJoin, sql-template-literal, bearer-token-auth]
key_files:
  created:
    - src/app/api/library/list/route.ts
    - src/app/api/library/delete/route.ts
  modified: []
decisions:
  - "Delete review_state before knowledge_item: Drizzle schema has no references().onDelete('cascade'), so manual ordering is required to avoid FK constraint violation"
metrics:
  duration: "8 minutes"
  completed_date: "2026-03-23"
  tasks_completed: 2
  files_changed: 2
requirements: [LIB-01, LIB-02, LIB-03]
---

# Phase 02 Plan 01: Library API Routes Summary

## One-liner

Knowledge library REST API — GET /api/library/list with domain filter + contentPreview, DELETE /api/library/delete with ownership-checked sequential delete (review_state first).

## What Was Built

Two API route handlers backing the knowledge library UI (plan 02-02):

**GET /api/library/list**
- Authenticates via Supabase service role + Bearer token (same pattern as confirm route)
- Accepts optional `?domain=X` query param to filter by domain
- Drizzle `innerJoin` on `reviewState` returns FSRS scheduling fields (`nextReviewAt`, `reviewCount`) alongside item metadata
- Returns `contentPreview` via `LEFT(content, 50)` SQL expression — avoids returning full content in list views
- Returns 200 with empty array when user has no items (no crash path)
- Returns 401 for unauthenticated requests

**DELETE /api/library/delete**
- Same auth pattern as list route
- Validates `id` body field is a non-empty string, returns 400 otherwise
- Deletes `review_state` row first (no CASCADE defined in Drizzle schema)
- Deletes `knowledge_items` row with `and(id match, userId match)` double-check — prevents cross-user deletion
- Returns 404 if the item does not exist or belongs to another user
- Returns 200 with `{ deleted: id }` on success

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 — GET /api/library/list | 874a495 | feat(02-01): create GET /api/library/list route |
| Task 2 — DELETE /api/library/delete | 079a6df | feat(02-01): create DELETE /api/library/delete route |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both routes are fully functional. No hardcoded data or placeholder returns.

## Self-Check: PASSED

- [x] src/app/api/library/list/route.ts exists
- [x] src/app/api/library/delete/route.ts exists
- [x] Commits 874a495 and 079a6df confirmed in git log
- [x] Both files contain `export async function GET(` / `DELETE(`
- [x] `innerJoin(reviewState` present in list route
- [x] `contentPreview` field present with `LEFT(` SQL expression
- [x] `eq(knowledgeItems.userId, user.id)` in both routes
- [x] `UNAUTHORIZED` string in both routes
- [x] `delete(reviewState)` before `delete(knowledgeItems)` in delete route
- [x] `.returning({ id: knowledgeItems.id })` present in delete route
- [x] `NOT_FOUND` string present in delete route
- [x] npm run lint -- library routes: 0 errors, 0 warnings
