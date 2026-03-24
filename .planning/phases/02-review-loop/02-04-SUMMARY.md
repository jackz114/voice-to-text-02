---
phase: "02"
plan: "04"
subsystem: review-ui
tags: [framer-motion, review, fsrs, swipe-cards, active-recall]
dependency_graph:
  requires: [02-03]
  provides: [review-session-ui, swipeable-card-stack, rating-undo]
  affects: [/review, /library]
tech_stack:
  added: [framer-motion]
  patterns: [useMotionValue, useTransform, useAnimation, optimistic-ui, undo-bar]
key_files:
  created:
    - src/components/review/RatingButtons.tsx
    - src/components/review/ReviewCard.tsx
    - src/components/review/ReviewSession.tsx
    - src/app/review/page.tsx
  modified:
    - package.json
    - package-lock.json
decisions:
  - "Imported supabase from AuthProvider re-export (not createClient directly) to share singleton and match existing codebase pattern"
  - "Used tokenRef (useRef) for access token to avoid stale closure in handleRate and handleUndo"
  - "Placed undo bar in fixed positioning with corrected-rating RatingButtons to match FSRS-04 one-minute window spec"
metrics:
  duration: "~15 minutes"
  completed: "2026-03-23"
  tasks_completed: 3
  files_created: 4
  files_modified: 2
---

# Phase 02 Plan 04: Review Session UI Summary

**One-liner:** Framer-motion swipeable card stack with click-to-reveal active recall, 4-emoji FSRS rating buttons, 5-streak Easy nudge, and 60-second rating undo bar.

## What Was Built

The complete review session UI for the daily FSRS-powered review workflow. Users visit `/review`, see a card stack of items due today, tap to reveal the answer, then rate their recall using 4 emoji buttons or swipe gestures.

### Components

**RatingButtons** (`src/components/review/RatingButtons.tsx`): A stateless row of 4 color-coded buttons (red=Again, orange=Hard, green=Good, blue=Easy) with emoji labels. Accepts `onRate(1|2|3|4)` callback and `disabled` flag.

**ReviewCard** (`src/components/review/ReviewCard.tsx`): A single swipeable card backed by framer-motion. Right swipe triggers Easy (4), left swipe triggers Again (1). Click-to-reveal mechanic starts with only the title visible; a "点击揭示内容" button reveals full content and rating buttons. Non-top cards are visually stacked with offset/scale but not draggable.

**ReviewSession** (`src/components/review/ReviewSession.tsx`): The orchestrator with no props. Fetches from `/api/review/today`, manages session state (currentIndex, consecutiveEasyCount, undo state), handles optimistic UI updates, and renders the card stack. After 5 consecutive Easy ratings shows the anti-cheat nudge (FSRS-03). After each rating shows a 60-second undo bar with corrected rating re-submit (FSRS-04).

**ReviewPage** (`src/app/review/page.tsx`): Auth-guarded page wrapping ReviewSession with a simple header.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install framer-motion + RatingButtons | 7dfd94f | package.json, RatingButtons.tsx |
| 2 | ReviewCard with framer-motion swipe | b7492bf | ReviewCard.tsx |
| 3 | ReviewSession orchestrator + /review page | 9bf3a1e | ReviewSession.tsx, review/page.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Use AuthProvider re-export for supabase instead of createClient**
- **Found during:** Task 3
- **Issue:** Plan specified creating a new `createClient` call in ReviewSession, but capture/page.tsx already imports `supabase` from `@/components/auth/AuthProvider` as the project pattern. Creating a second client would violate the singleton pattern documented in CLAUDE.md.
- **Fix:** Imported `supabase` from `@/components/auth/AuthProvider` (matching existing project pattern from capture/page.tsx).
- **Files modified:** src/components/review/ReviewSession.tsx
- **Commit:** 9bf3a1e

**2. [Rule 2 - Missing critical functionality] Use useRef for token to avoid stale closure**
- **Found during:** Task 3
- **Issue:** Plan stored the access token in a `useState` variable, but `handleRate` and `handleUndo` would capture stale state in their closures.
- **Fix:** Used `useRef` (tokenRef) for the access token so all async handlers always read the current value.
- **Files modified:** src/components/review/ReviewSession.tsx
- **Commit:** 9bf3a1e

## Known Stubs

None. All API calls connect to real endpoints from 02-03 (`/api/review/today`, `/api/review/rate`).

## Self-Check: PASSED
