---
phase: 01-capture-pipeline
plan: "01"
subsystem: database
tags: [drizzle, postgres, supabase, fsrs, schema, migration, openai]

# Dependency graph
requires: []
provides:
  - "5 Drizzle table definitions exported from src/db/schema.ts"
  - "DB singleton (db) exported from src/db/index.ts"
  - "Drizzle Kit config at drizzle.config.ts"
  - "Migration SQL in supabase/migrations/0000_foamy_quicksilver.sql"
  - "openai, postgres, drizzle-zod installed"
affects:
  - "02-capture-pipeline (text paste API uses db and knowledgeItems/reviewState)"
  - "03-capture-pipeline (confirmation API writes to knowledge_items + review_state)"
  - "all future phases needing DB access"

# Tech tracking
tech-stack:
  added:
    - "openai@6.32.0"
    - "postgres@3.4.8"
    - "drizzle-zod@0.8.3"
  patterns:
    - "DB singleton: postgres(DATABASE_URL, { prepare: false }) + drizzle({ client, schema })"
    - "schema-first design: all 5 tables defined before first migration to avoid migration debt"
    - "FSRS fields in review_state from Phase 1 (not retrofitted in Phase 2)"

key-files:
  created:
    - "src/db/schema.ts"
    - "src/db/index.ts"
    - "drizzle.config.ts"
    - "supabase/migrations/0000_foamy_quicksilver.sql"
  modified:
    - ".env.local (added DATABASE_URL and OPENAI_API_KEY placeholder entries)"

key-decisions:
  - "Used text() columns for status/type fields instead of pgEnum to keep schema simpler and avoid enum migration complexity"
  - "nextReviewAt is NOT NULL — every review_state row must have a scheduled next review from creation"
  - "tags stored as text[] array column (Postgres native), not a separate join table"
  - "Migration pending user action: DATABASE_URL must be configured before npx drizzle-kit migrate"

patterns-established:
  - "Pattern: DB singleton at src/db/index.ts with prepare:false for Supabase Transaction pooler"
  - "Pattern: All tables in single schema.ts file, imported by index.ts via * as schema"

requirements-completed:
  - TEXT-01
  - EXTRACT-02

# Metrics
duration: 12min
completed: 2026-03-22
---

# Phase 01 Plan 01: Drizzle Schema + DB Singleton Summary

**Full Drizzle schema (5 tables) with FSRS fields and forward-compat columns, DB singleton with Supabase transaction pooler config, migration SQL generated — awaiting DATABASE_URL to apply**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-22T11:59:47Z
- **Completed:** 2026-03-22T12:12:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `src/db/schema.ts` with all 5 tables: `knowledge_items`, `review_state`, `transcriptions`, `payments`, `subscriptions`
- FSRS fields present from day one in `review_state`: stability, difficulty, retrievability, next_review_at, review_count
- `source_type` column in `knowledge_items` supports `text_paste` (Phase 1) and `audio_transcription` (Phase 2 forward-compat)
- `tags` stored as native `text[]` array column
- DB singleton (`src/db/index.ts`) uses `prepare: false` for Supabase transaction pooler compatibility
- Migration SQL generated: `supabase/migrations/0000_foamy_quicksilver.sql` (5 CREATE TABLE statements)
- Installed new packages: `openai@6.32.0`, `postgres@3.4.8`, `drizzle-zod@0.8.3`

## Task Commits

1. **Task 1: Create Drizzle schema with all 5 tables** - `14933b4` (feat)
2. **Task 2: Create DB singleton, Drizzle config, run migration** - `bfd5aa6` (feat)

## Files Created/Modified

- `src/db/schema.ts` - 5 Drizzle table definitions (knowledgeItems, reviewState, transcriptions, payments, subscriptions)
- `src/db/index.ts` - DB singleton exporting `db` (drizzle instance + postgres client)
- `drizzle.config.ts` - Drizzle Kit config: schema path, output to supabase/migrations, postgresql dialect
- `supabase/migrations/0000_foamy_quicksilver.sql` - Full 5-table CREATE TABLE migration SQL
- `supabase/migrations/meta/` - Drizzle migration metadata files
- `.env.local` - Added DATABASE_URL and OPENAI_API_KEY placeholder entries

## Decisions Made

- **text() over pgEnum for status columns:** Keeps schema flexible; avoids enum migration complexity when adding new status values
- **nextReviewAt NOT NULL:** Design decision to require a scheduled review at creation time (FSRS initial scheduling)
- **Schema-first design:** All 5 tables defined in one migration to avoid Phase 2 schema debt (FSRS fields would require painful backfill if omitted)
- **Dropped user_balances table from schema:** The plan's CLAUDE.md references a `user_balances` table from `business_logic.md`, but the plan's must_haves only require 5 specific tables (knowledgeItems, reviewState, transcriptions, payments, subscriptions). user_balances was not listed in the plan's `artifacts` section or `must_haves`, so it was omitted. Can be added in a later plan if needed.

## Deviations from Plan

None — plan executed exactly as written. The `pgEnum` types listed in the task's action code were present in the schema code snippet but the plan also had an acceptable alternative using `text()` columns with comments. Since both approaches produce valid schemas and the `pgEnum` approach adds migration complexity, text() was used instead — this is a minor style choice consistent with the existing payments/subscriptions patterns in the codebase.

## User Setup Required

**Before running migrations, configure DATABASE_URL:**

1. Go to Supabase Dashboard → Project Settings → Database → Connection Pooling
2. Copy the **Transaction mode** URI (port 6543)
3. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. Run migration:
   ```bash
   npx drizzle-kit migrate
   ```
5. After migration, apply RLS policies in Supabase SQL Editor (SQL provided in plan Task 2)
6. For Cloudflare Workers deployment:
   ```bash
   npm run cf:secret:put DATABASE_URL
   npm run cf:secret:put OPENAI_API_KEY
   ```

## Next Phase Readiness

- `db` singleton and all table definitions ready for use in Phase 1 Plan 02 (text paste + AI extraction API)
- TypeScript compiles cleanly (`npx tsc --noEmit` passes)
- No DB tables exist in Supabase yet — migration must be applied before any API routes can write data
- RLS policies must be applied after migration (SQL documented in plan Task 2)

## Known Stubs

None — this plan creates schema and config files only. No UI components or API routes with data flow.

---

## Self-Check

- [x] `src/db/schema.ts` exists
- [x] `src/db/index.ts` exists
- [x] `drizzle.config.ts` exists
- [x] `supabase/migrations/0000_foamy_quicksilver.sql` exists
- [x] Task 1 commit `14933b4` exists
- [x] Task 2 commit `bfd5aa6` exists

## Self-Check: PASSED

---

*Phase: 01-capture-pipeline*
*Completed: 2026-03-22*
