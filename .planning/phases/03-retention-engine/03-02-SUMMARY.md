---
phase: 03
plan: 03-02
subsystem: retention-engine
tags: [search, api, postgresql, full-text-search]
dependency_graph:
  requires: ["03-01"]
  provides: ["search-api"]
  affects: []
tech_stack:
  added: ["PostgreSQL tsvector", "ts_rank", "ts_headline", "websearch_to_tsquery"]
  patterns: ["Full-text search with weighted ranking", "Highlighted excerpts"]
key_files:
  created:
    - src/lib/search.ts
    - src/app/api/search/route.ts
  modified: []
decisions:
  - "Used websearch_to_tsquery for Google-like search syntax support (quoted phrases, OR, -excluded)"
  - "Weighted ranking: title/tags A (1.0), content B (0.4), source C (0.2) per D-05 requirements"
  - "ts_headline for highlighted excerpts with <mark> tags around matching terms"
  - "Types defined in search.ts to avoid circular dependency with route.ts"
metrics:
  duration: "15m"
  completed_date: "2026-03-24"
---

# Phase 03 Plan 02: Search API Implementation Summary

**One-liner:** Implemented GET /api/search endpoint with PostgreSQL full-text search, ts_rank ranking, and ts_headline excerpt generation.

## What Was Built

### 1. Search Utility Module (`src/lib/search.ts`)

Core search utilities for PostgreSQL full-text search:

- **`toTsQuery(userQuery: string)`**: Converts user queries to PostgreSQL tsquery format using `websearch_to_tsquery` for advanced syntax support (quoted phrases, OR, excluded terms)
- **`buildRankExpression(query: string)`**: Builds weighted rank expression using ts_rank with the search vector
- **`buildExcerptExpression(query, options)`**: Generates highlighted excerpts using `ts_headline` with configurable highlight tags
- **`buildSearchWhere(query, domain?)`**: Builds WHERE clause with optional domain filtering
- **`validateQuery(query)`**: Validates query length (2-100 characters)

**Type Definitions:**
- `SearchResult`: Individual search result with id, title, content, excerpt, domain, tags, source, createdAt, rank
- `SearchResponse`: Complete response with results array, query string, total count, and hasMore flag

### 2. Search API Route (`src/app/api/search/route.ts`)

REST API endpoint at `GET /api/search`:

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q | string | required | Search query (2-100 chars) |
| domain | string | undefined | Filter by domain |
| limit | number | 10 | Results per page (1-20) |
| offset | number | 0 | Pagination offset |

**Features:**
- Authentication required (401 for anonymous users)
- Zod schema validation for all parameters
- Full-text search with weighted ranking (title/tags A, content B, source C)
- Highlighted excerpts with `<mark>` tags around matching terms
- Domain filtering for scoped searches
- User isolation (only searches own knowledge items)
- Pagination support with total count and hasMore flag

**Response Format:**
```json
{
  "results": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "excerpt": "string with <mark>highlighted</mark> terms",
      "domain": "string",
      "tags": ["array"],
      "source": "string or null",
      "createdAt": "ISO date",
      "rank": 0.123
    }
  ],
  "query": "search term",
  "total": 42,
  "hasMore": true
}
```

## Verification Results

### Build Verification
- [x] TypeScript compilation passes (no search-related errors)
- Pre-existing errors in other files (ts-fsrs, framer-motion) are unrelated to this plan

### API Verification
- [x] Endpoint structure implemented correctly
- [x] Authentication check returns 401 for unauthenticated users
- [x] Response format matches specification

### Behavior Verification
- [x] Search query validation (2-100 characters)
- [x] Results ordered by rank (highest first)
- [x] Domain filter support
- [x] User isolation enforced
- [x] Highlighted excerpts with `<mark>` tags
- [x] Pagination with offset/limit

### Performance Verification
- [x] Query uses GIN index on `knowledge_items_search_idx` (from 03-01)
- [x] Weighted search vector for relevance ranking

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all functionality fully implemented.

## Commits

| Hash | Message |
|------|---------|
| 433c8d9 | feat(03-02): create search utility module with PostgreSQL full-text search support |
| 67b0540 | feat(03-02): implement GET /api/search endpoint with full-text search |

## Self-Check: PASSED

- [x] Created files exist: `src/lib/search.ts`, `src/app/api/search/route.ts`
- [x] Commits exist: 433c8d9, 67b0540
- [x] No TypeScript errors in search-related files
- [x] Types properly exported for API consumers
