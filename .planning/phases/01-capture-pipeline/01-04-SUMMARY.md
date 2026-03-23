---
phase: 01-capture-pipeline
plan: "04"
subsystem: ui+api
tags: [react, tailwind, nextjs, typescript, drizzle, supabase, state-machine, fsrs]

# Dependency graph
requires:
  - phase: 01-01
    provides: knowledgeItems and reviewState Drizzle schema tables
  - phase: 01-02
    provides: KnowledgeItemCandidate type + POST /api/capture/extract
  - phase: 01-03
    provides: capture page state machine with confirming placeholder

provides:
  - ConfirmationCards component with per-card accept/reject/edit/undo
  - POST /api/capture/confirm — inserts knowledge_items + review_state rows
  - Complete end-to-end capture pipeline (paste → extract → review → save)

affects:
  - Phase 2 (knowledge library views will query knowledge_items table)
  - Phase 2 (FSRS review scheduling reads review_state.next_review_at)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Per-card status machine: "default" | "accepted" | "rejected" | "editing"
    - Tag input: commit on Enter/comma/Tab, Backspace deletes last tag, max 10
    - Dual DB insert pattern: knowledge_items then review_state in same loop
    - FSRS initial state: stability=0, difficulty=0, retrievability=0, nextReviewAt=tomorrow

key-files:
  created:
    - src/components/capture/ConfirmationCards.tsx
    - src/app/api/capture/confirm/route.ts
  modified:
    - src/app/capture/page.tsx

key-decisions:
  - "Per-card state tracked in flat useState array (not react-hook-form) — dynamic card states map naturally, no indirection needed"
  - "Inline reject confirmation (not modal) per UI-SPEC.md D-12 — keeps user in context"
  - "DB write deferred until user clicks 确认并保存 (D-11) — no writes during extraction or before user review"
  - "FSRS initial values set at insert time (nextReviewAt=tomorrow, stability=0) — Phase 2 will run real FSRS algorithm on first review"
  - "created_at satisfied by defaultNow() in schema — no UI display needed (EXTRACT-02)"

requirements-completed: [EXTRACT-02, EXTRACT-03, EXTRACT-05, TEXT-02]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 1 Plan 04: ConfirmationCards and Confirm API Summary

**Complete Phase 1 capture pipeline: ConfirmationCards UI with per-card accept/reject/edit, POST /api/capture/confirm writing to knowledge_items + review_state, wired end-to-end in the capture page**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-22T12:18:28Z
- **Completed:** 2026-03-22T12:23:52Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 3

## Accomplishments

- `ConfirmationCards` component: per-card status machine (default/accepted/rejected/editing), inline reject confirmation, undo, edit mode with all 4 fields (title, content, domain, tags), tag input with Enter/comma/Tab commit and Backspace-delete, max 10 tags with warning, bulk "全部保留", "确认并保存" button disabled when zero accepted, isSaving spinner state
- Accepted card visual: `border-l-4 border-blue-600 shadow-sm` indicator per UI-SPEC.md
- Rejected card visual: `opacity-40` + `line-through` title per UI-SPEC.md
- `POST /api/capture/confirm`: auth guard (401), validates items array (400), inserts `knowledge_items` row (sourceType: text_paste, auto created_at via defaultNow) + `review_state` row (nextReviewAt=tomorrow, FSRS initial values), returns `{ savedCount }`
- Capture page updated: ConfirmationCards replaces JSON placeholder, handleConfirm wired to confirm API, success message "已保存 N 条知识点" shown on idle return, saving state handled

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ConfirmationCards component** - `5ad74da` (feat)
2. **Task 2a: Create POST /api/capture/confirm route** - `9dc31d7` (feat)
3. **Task 2b: Wire ConfirmationCards into capture page** - `479c269` (feat)

## Files Created/Modified

- `src/components/capture/ConfirmationCards.tsx` - Card review UI: per-card accept/reject/edit/undo, bulk accept, inline tag management, confirm button with isSaving state
- `src/app/api/capture/confirm/route.ts` - POST endpoint: auth check, DB insert knowledge_items + review_state with FSRS initial state
- `src/app/capture/page.tsx` - Added handleConfirm, successMessage state, ConfirmationCards import, replaced TODO placeholder with real component, handles confirming+saving states

## Decisions Made

- Used flat `useState` array for card state management (not react-hook-form) — per plan note, highly dynamic per-card state (status + edit fields per card) maps naturally to array without form library indirection
- Inline reject confirmation banner (not modal) keeps user in context per UI-SPEC.md interaction contract
- DB write only after user explicit "确认并保存" action (D-11 compliance) — no writes happen during extraction or card review
- FSRS initial state (stability=0, difficulty=0, retrievability=0) set at Phase 1 insert time; Phase 2 will apply real FSRS algorithm on first review event

## Deviations from Plan

None - plan executed exactly as written.

## Checkpoint Status

**Checkpoint reached: checkpoint:human-verify**

The complete Phase 1 capture pipeline is built and ready for end-to-end verification:

1. Start dev server: `npm run dev`
2. Visit `http://localhost:3000/capture` — confirm redirect to `/login` when not logged in
3. Log in, return to `/capture` — confirm page loads with "捕获知识" heading and textarea
4. Paste a short text (under 50 chars) — confirm submit is disabled (too short)
5. Paste a real article or learning note (100+ chars) — click "提取知识"
6. Verify: button shows spinner + "正在提取…", textarea is disabled during extraction
7. Verify: confirmation cards appear — each shows title, content, domain badge, and tags
8. Test per-card actions: click "丢弃" on one card, confirm rejection, click "撤销"
9. Test edit mode on one card: change title, add a tag, click "保存修改"
10. Click "全部保留" — verify all cards show accepted state (blue left border)
11. Click "确认并保存" — verify saving state (spinner), then success message "已保存 X 条知识点。"
12. In Supabase Dashboard, verify rows exist in `knowledge_items` and `review_state` tables

## Known Stubs

None — all Phase 1 capture pipeline functionality is wired end-to-end. The `review_state` rows use placeholder FSRS values (stability=0, difficulty=0, retrievability=0) which is correct for Phase 1; Phase 2 will apply real FSRS algorithm on review events.

## Phase 1 Completion Notes

This plan completes Phase 1 (Capture Pipeline). Remaining Phase 1 gaps deferred to Phase 2:

- Audio recording/upload (MediaRecorder + Supabase Storage signed URL)
- Whisper transcription (POST /api/capture/transcribe)
- Knowledge library view (browse captured items)
- FSRS review scheduling (real algorithm, not just initial values)

---
*Phase: 01-capture-pipeline*
*Completed: 2026-03-22*

## Self-Check: PASSED

- FOUND: src/components/capture/ConfirmationCards.tsx
- FOUND: src/app/api/capture/confirm/route.ts
- FOUND: src/app/capture/page.tsx (modified)
- FOUND: .planning/phases/01-capture-pipeline/01-04-SUMMARY.md
- FOUND: commit 5ad74da (ConfirmationCards component)
- FOUND: commit 9dc31d7 (confirm route)
- FOUND: commit 479c269 (capture page wired)
- FOUND: commit 20c2db1 (docs/metadata)
