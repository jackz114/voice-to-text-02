---
phase: 03
plan: 03-01
subsystem: database
status: completed
duration: 0
completed_date: "2026-03-24"
requirements:
  - NOTIFY-01
  - SEARCH-01
dependencies: []
commits:
  - hash: "3493f8c"
    message: "feat(03-07): add user_preferences table and notification preferences API"
    files:
      - src/db/schema.ts
  - hash: "a8560a3"
    message: "feat(03-07): create notification settings page"
    files:
      - src/db/migrations/0003_add_search_and_preferences.sql
key_files:
  created:
    - src/db/migrations/0003_add_search_and_preferences.sql
  modified:
    - src/db/schema.ts
decisions:
  - "Used customType for tsvector since Drizzle doesn't have native support"
  - "Pre-migration for pgvector embedding column to avoid backfill debt in Phase 4"
  - "Weighted full-text search: title/tags=A, content=B, source=C per D-05"
  - "Auto-trigger on auth.users to create preferences for new users"
  - "Backfill SQL for existing users to have default preferences"
tech_stack:
  added:
    - pgvector extension
    - tsvector generated column
    - GIN index for full-text search
    - HNSW index for vector similarity
  patterns:
    - Drizzle customType for unsupported Postgres types
    - Generated columns for computed search vectors
    - RLS policies for user data isolation
---

# Phase 03 Plan 01: Database Schema Extensions Summary

## One-Liner

Extended database schema with full-text search (tsvector + GIN index), vector search pre-migration (pgvector + HNSW index), and user preferences table for notification settings.

## What Was Built

### Schema Extensions to knowledge_items

Added two new columns to support search functionality:

1. **search_vector** (tsvector) - Full-text search vector with weighted components:
   - Weight A (highest): title, tags
   - Weight B (medium): content
   - Weight C (lowest): source
   - Uses Chinese text search configuration
   - Generated always as stored computed column

2. **embedding** (vector(1536)) - Semantic search vector for Phase 4
   - Pre-migration to avoid backfill debt
   - 1536 dimensions for OpenAI embedding compatibility

Added indexes:
- `knowledge_items_search_idx` - GIN index on search_vector for fast full-text search
- `knowledge_items_embedding_idx` - HNSW index on embedding for vector similarity search

### New Table: user_preferences

Created user_preferences table for notification and user settings per D-01, D-02, D-09:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| user_id | uuid | - | FK to auth.users, unique per user |
| email_notifications_enabled | boolean | true | Master toggle for emails |
| daily_reminder_time | text | '09:00' | HH:mm format reminder time |
| reminder_timezone | text | 'Asia/Shanghai' | User's timezone |
| included_domains | text[] | [] | Domain filter (empty = all) |
| save_search_history | boolean | true | Search history setting |
| display_name | text | null | Email personalization |

Security:
- RLS enabled with policy: users can only access their own preferences
- FK to auth.users with ON DELETE CASCADE

Automation:
- Trigger `on_auth_user_created` auto-creates preferences for new users
- Backfill SQL inserts default preferences for existing users

### Migration SQL

Created `src/db/migrations/0003_add_search_and_preferences.sql` with 12 steps:
1. Enable pgvector extension
2. Add search_vector column with generated tsvector
3. Add embedding column for Phase 4
4. Create GIN index for full-text search
5. Create HNSW index for vector similarity
6. Create user_preferences table
7. Enable RLS on user_preferences
8. Create RLS policy
9. Create auto-create function
10. Attach trigger to auth.users
11. Backfill preferences for existing users
12. Force recalculation of search_vector

## Success Criteria Verification

| Criteria | Status | Evidence |
|----------|--------|----------|
| knowledge_items has search_vector tsvector | ✓ | schema.ts:42-50, migration step 2 |
| knowledge_items has embedding vector(1536) | ✓ | schema.ts:53, migration step 3 |
| GIN index exists | ✓ | schema.ts:57-58, migration step 4 |
| user_preferences table exists | ✓ | schema.ts:118-130, migration step 6 |
| RLS policies protect user_preferences | ✓ | migration steps 7-8 |
| Auto-trigger creates preferences for new users | ✓ | migration steps 9-10 |
| Existing users have default preferences backfilled | ✓ | migration step 11 |

## Deviations from Plan

### Execution Order Deviation

**Finding:** The work for plan 03-01 was executed as part of plan 03-07 commits.

**What happened:**
- Schema changes committed in `3493f8c` (feat(03-07): add user_preferences table...)
- Migration file committed in `a8560a3` (feat(03-07): create notification settings page)

**Impact:** None on functionality. All requirements from 03-01 are satisfied.

**Resolution:** This SUMMARY.md documents the actual state. The commits are cross-referenced.

## Verification Steps

### Build Verification
- TypeScript compilation passes (schema types are valid)
- No Drizzle ORM type errors

### Database Verification (to be run when applying migration)
```sql
-- Verify indexes
SELECT * FROM pg_indexes WHERE tablename = 'knowledge_items';
-- Expected: knowledge_items_search_idx, knowledge_items_embedding_idx

-- Verify columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'knowledge_items';
-- Expected: search_vector, embedding

-- Verify RLS
SELECT relrowsecurity FROM pg_class WHERE relname = 'user_preferences';
-- Expected: t
```

## Known Stubs

None. All schema elements are fully implemented.

## Self-Check: PASSED

- [x] src/db/schema.ts exists with all required changes
- [x] src/db/migrations/0003_add_search_and_preferences.sql exists with 12 steps
- [x] Commits 3493f8c and a8560a3 contain the required changes
- [x] Type exports added for UserPreference
- [x] All success criteria met
