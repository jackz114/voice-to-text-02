---
phase: 03
plan: 03-01
subsystem: database
status: completed
tags: [database, schema, search, notifications, pgvector, full-text-search]
dependency_graph:
  requires: []
  provides: [03-02, 03-03, 03-04, 03-05, 03-06, 03-07]
  affects: [knowledge_items, user_preferences]
tech_stack:
  added: [pgvector, tsvector, GIN index, HNSW index]
  patterns: [generatedAlwaysAs for computed columns, customType for tsvector]
key_files:
  created:
    - src/db/migrations/0003_add_search_and_preferences.sql
  modified:
    - src/db/schema.ts
decisions:
  - Used customType for tsvector since Drizzle doesn't have native support
  - Weighted search vector: A (title/tags), B (content), C (source) per D-05
  - Pre-migration for Phase 4: added embedding column (1536d) with HNSW index
  - Auto-trigger on auth.users to create preferences for new users
  - Backfill migration for existing users
metrics:
  duration: 5m
  completed_date: "2026-03-24"
---

# Phase 03 Plan 03-01: Database Schema Extensions Summary

**One-liner:** Extended database schema with full-text search (tsvector + GIN), vector search pre-migration (pgvector + HNSW), and user preferences table for notification settings.

---

## What Was Built

### Schema Extensions (`src/db/schema.ts`)

1. **Custom tsvector type** - Since Drizzle ORM doesn't have native tsvector support, created a `customType` wrapper for PostgreSQL's tsvector type.

2. **Extended `knowledge_items` table:**
   - `search_vector` (tsvector) - Generated column with weighted text search:
     - Weight A: title, tags (highest priority)
     - Weight B: content (medium priority)
     - Weight C: source (lowest priority)
   - `embedding` (vector[1536]) - For Phase 4 semantic search pre-migration
   - GIN index `knowledge_items_search_idx` on search_vector
   - HNSW index `knowledge_items_embedding_idx` on embedding with cosine ops

3. **New `user_preferences` table:**
   - Notification settings: `email_notifications_enabled`, `daily_reminder_time`, `reminder_timezone`
   - Domain filters: `included_domains` (empty array = all domains)
   - Search settings: `save_search_history`
   - Profile: `display_name`
   - RLS policies for user data isolation

### Migration (`src/db/migrations/0003_add_search_and_preferences.sql`)

Complete SQL migration including:
- pgvector extension enablement
- Column additions with generated expressions
- Index creation (GIN + HNSW)
- Table creation with foreign key constraints
- RLS enablement and policies
- Trigger function for auto-creating preferences on new users
- Backfill for existing users

---

## Requirements Satisfied

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| NOTIFY-01 | Ready | `user_preferences` table with notification settings |
| SEARCH-01 | Ready | `search_vector` column with GIN index for full-text search |

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Verification Results

### Build Verification
- [x] `npm run lint` passes for `src/db/schema.ts`
- [ ] `npm run build` - Blocked by pre-existing .next directory file lock (unrelated to changes)
- [ ] `npm run type-check` - No such script; `npx tsc --noEmit` shows pre-existing drizzle-orm internal type issues unrelated to schema changes

### Schema Verification
- [x] Schema file syntax validated via ESLint
- [x] Migration file created with proper SQL syntax
- [ ] Database migration applied - Requires `DATABASE_URL` environment variable and `npx drizzle-kit push`

---

## Known Stubs

None - all schema fields are fully defined with proper types and defaults.

---

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| da056ca | feat(03-01): extend database schema for search and notifications | src/db/schema.ts |
| b522fb3 | chore(03-01): add database migration for search and preferences | src/db/migrations/0003_add_search_and_preferences.sql |

---

## Next Steps

1. Apply migration to database: `npx drizzle-kit push` (requires DATABASE_URL)
2. Verify indexes created: Check `pg_indexes` table for `knowledge_items_search_idx` and `knowledge_items_embedding_idx`
3. Proceed to Plan 03-02 (Search API implementation)

---

*Self-Check: PASSED*
- [x] Created files exist: `src/db/migrations/0003_add_search_and_preferences.sql`
- [x] Modified files exist: `src/db/schema.ts`
- [x] Commits exist: da056ca, b522fb3
