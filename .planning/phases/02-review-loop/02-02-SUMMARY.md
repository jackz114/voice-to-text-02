---
phase: 02-review-loop
plan: "02"
subsystem: ui
tags: [react, nextjs, tailwind, typescript, knowledge-library]

requires:
  - phase: 02-01
    provides: GET /api/library/list and DELETE /api/library/delete API routes

provides:
  - /library page with sidebar domain navigation and list/grid item browsing
  - KnowledgeLibrary component (sidebar + content area + detail modal + delete)
  - DomainSidebar component (presentational domain filter)
  - KnowledgeItemCard component (list/grid variants with delete and click)

affects:
  - 02-04 (review UI — same card patterns)
  - 02-06 (notifications — links back to library)

tech-stack:
  added: []
  patterns:
    - "Sidebar + content layout with flex and hidden md:block for responsive"
    - "KnowledgeItem type exported from KnowledgeItemCard, re-exported from KnowledgeLibrary"
    - "Detail modal with fixed inset-0 overlay, stopPropagation on content"
    - "Hover-reveal delete button using group and opacity-0 group-hover:opacity-100"

key-files:
  created:
    - src/components/library/KnowledgeLibrary.tsx
    - src/components/library/DomainSidebar.tsx
    - src/components/library/KnowledgeItemCard.tsx
    - src/app/library/page.tsx
  modified: []

key-decisions:
  - "KnowledgeItem type defined in KnowledgeItemCard and re-exported from KnowledgeLibrary to avoid circular dependency"
  - "Modal (Option A) chosen over [id] route for detail view — no extra API route needed in Phase 2"
  - "supabase.auth.getSession() used for token in KnowledgeLibrary to match capture page pattern"

patterns-established:
  - "Library page: auth guard at page level, KnowledgeLibrary handles all data fetching"
  - "Item cards: always hover-reveal delete in list mode using group + opacity transition"

requirements-completed: [LIB-01, LIB-02, LIB-03]

duration: 8min
completed: 2026-03-23
---

# Phase 02 Plan 02: Knowledge Library UI Summary

**Sidebar-navigated knowledge library at /library with list/grid toggle, domain filtering, item detail modal, and delete — all wired to /api/library/list and /api/library/delete**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-23T09:02:03Z
- **Completed:** 2026-03-23T09:10:00Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- /library page with auth guard (loading/not-logged-in states with redirect link)
- Domain sidebar listing all domains with item counts, highlighted selection, "全部" total option
- List/grid toggle with KnowledgeItemCard rendering both layouts
- Detail modal showing full content with pre-wrap, tags, source link, dates
- Delete with confirm() dialog and immediate refetch

## Task Commits

1. **Task 1: KnowledgeLibrary component shell** - `ca927b0` (feat)
2. **Task 2: DomainSidebar component** - `c173dd1` (feat)
3. **Task 3: KnowledgeItemCard component** - `cebfefb` (feat)
4. **Task 4: Wire components and create /library page** - `4c91ae0` (feat)

## Files Created/Modified

- `src/components/library/KnowledgeLibrary.tsx` - Main library shell: sidebar + content area, fetchItems, handleDelete, detail modal, list/grid rendering
- `src/components/library/DomainSidebar.tsx` - Presentational sidebar with domain list and count badges
- `src/components/library/KnowledgeItemCard.tsx` - Item card with list/grid variants, delete confirmation, click handler
- `src/app/library/page.tsx` - Library page with auth guard, renders KnowledgeLibrary

## Decisions Made

- Used Modal (Option A) over `[id]` route for detail view — avoids creating new API route; full `content` field not yet returned by API so modal falls back to `contentPreview`
- `KnowledgeItem` interface exported from `KnowledgeItemCard` and re-exported from `KnowledgeLibrary` to avoid circular imports
- Used `supabase.auth.getSession()` inside fetch calls to match the existing capture page pattern (not `useAuth()` access token, since access token is not currently exposed via the hook)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

- `viewingItem.content` in the modal falls back to `contentPreview` because `/api/library/list` returns only `contentPreview` (50 chars), not `content`. The API route from 02-01 would need to also return the full `content` field for the modal to show it. The modal rendering is wired (`viewingItem.content ?? viewingItem.contentPreview`) — once the API returns `content`, it will show automatically.

## Next Phase Readiness

- /library page fully functional for browsing and deleting items
- KnowledgeItem type and card patterns available for 02-04 review UI
- API contract: if 02-01 adds `content` to the list response, the modal stub resolves automatically

---
*Phase: 02-review-loop*
*Completed: 2026-03-23*
