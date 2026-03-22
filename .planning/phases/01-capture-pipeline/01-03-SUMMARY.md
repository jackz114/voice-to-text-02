---
phase: 01-capture-pipeline
plan: "03"
subsystem: ui
tags: [react, tailwind, nextjs, typescript, state-machine, auth-guard]

# Dependency graph
requires:
  - phase: 01-02
    provides: KnowledgeItemCandidate type contract from POST /api/capture/extract
provides:
  - /capture route with auth guard and idle+extracting state machine states
  - TextPasteInput controlled component with character counter and spinner
affects:
  - 01-04 (ConfirmationCards plugs into confirming state placeholder in capture page)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Auth guard pattern: check loading first, then user, redirect with router.push
    - Bearer token retrieval via supabase.auth.getSession() in client components
    - State machine union type: type CaptureState = "idle" | "extracting" | "confirming" | "saving"
    - Controlled textarea component with props-driven disabled/spinner states

key-files:
  created:
    - src/components/capture/TextPasteInput.tsx
    - src/app/capture/page.tsx
  modified: []

key-decisions:
  - "Import supabase from @/components/auth/AuthProvider (re-export) rather than @/lib/supabase to use the same instance as AuthProvider"
  - "confirming state renders JSON placeholder pre block — Plan 04 replaces with ConfirmationCards"
  - "saving state declared in CaptureState type but not yet implemented — deferred to Plan 04"

patterns-established:
  - "Auth guard: check loading spinner first, then null user redirect, then render authenticated content"
  - "Bearer token: always call supabase.auth.getSession() immediately before the fetch, not cached"
  - "Error display: inline div with red-50 bg, never alert()"

requirements-completed: [TEXT-01, TEXT-02, EXTRACT-03]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 1 Plan 03: Capture Page and TextPasteInput Summary

**Capture page at /capture with auth-guarded state machine shell and TextPasteInput component featuring 100k character counter (gray/amber/red) and spinner button**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T12:11:21Z
- **Completed:** 2026-03-22T12:13:41Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- TextPasteInput controlled component: textarea with character counter color transitions (gray-400 / amber-600 / red-600), optional source URL input, animate-spin spinner during extraction
- Capture page `/capture`: auth guard redirects unauthenticated users to `/login?redirect_to=/capture`, implements idle and extracting states
- State machine type `CaptureState = "idle" | "extracting" | "confirming" | "saving"` defined — idle+extracting functional, confirming state has JSON placeholder for Plan 04
- Inline error messages (no alert()) for API errors and empty extraction results
- Bearer token retrieved via `supabase.auth.getSession()` before each fetch call

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TextPasteInput component** - `9f2d2df` (feat)
2. **Task 2: Create capture page with auth guard and state machine** - `cff711e` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/components/capture/TextPasteInput.tsx` - Controlled textarea component with 100k char limit, counter, source URL input, and spinner button
- `src/app/capture/page.tsx` - /capture route: auth guard, state machine (idle+extracting), calls /api/capture/extract with Bearer token

## Decisions Made

- Imported `supabase` from `@/components/auth/AuthProvider` (already re-exported there on line 67) rather than from `@/lib/supabase` to maintain the same singleton instance as AuthProvider uses
- The `confirming` state renders a `<pre>` JSON dump as placeholder — Plan 04 will replace this with the ConfirmationCards component
- `saving` state is declared in the `CaptureState` union type but no logic is wired yet — Plan 04 will wire this after ConfirmationCards is built

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

A pre-existing TypeScript error in `src/app/api/capture/capture-client.ts` (from plan 01-02): `Property 'chat' does not exist on type 'Beta'`. This is out of scope for this plan — our new files have zero TypeScript errors.

## Known Stubs

- `src/app/capture/page.tsx` lines 120-134: `captureState === "confirming"` block renders a `<pre>` JSON dump instead of the real ConfirmationCards UI. This is an intentional placeholder — Plan 04 replaces it with `<ConfirmationCards>`.
- `src/app/capture/page.tsx`: `saving` state in the CaptureState union has no logic wired yet. Plan 04 implements the save flow.

## Next Phase Readiness

- `/capture` route is live and auth-guarded
- `TextPasteInput` is fully functional and ready to use
- State machine shell is ready for Plan 04 to plug in ConfirmationCards at the `confirming` state
- The `handleExtract` function calls the real `/api/capture/extract` endpoint (built in Plan 02)

---
*Phase: 01-capture-pipeline*
*Completed: 2026-03-22*
