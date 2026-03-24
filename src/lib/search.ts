// src/lib/search.ts
// Search query builders and utilities

import { sql, SQL } from "drizzle-orm";
import { knowledgeItems } from "@/db/schema";

/**
 * Convert user query to PostgreSQL tsquery format
 * Uses websearch_to_tsquery for Google-like syntax support
 * Falls back to plainto_tsquery for simple input
 */
export function toTsQuery(userQuery: string): SQL {
  // Escape special characters and normalize
  const normalized = userQuery
    .replace(/[\s]+/g, " ") // Normalize whitespace
    .trim();

  if (!normalized) {
    return sql`''::tsquery`;
  }

  // Use websearch_to_tsquery for advanced syntax support:
  // - "quoted phrases"
  // - OR between terms
  // - -excluded terms
  return sql`websearch_to_tsquery('chinese', ${normalized})`;
}

/**
 * Build search rank expression using weighted tsvector
 * Title and tags weight A (1.0), content weight B (0.4), source weight C (0.2)
 */
export function buildRankExpression(query: string): SQL {
  const tsquery = toTsQuery(query);
  return sql`ts_rank(${knowledgeItems.searchVector}, ${tsquery})`;
}

/**
 * Build highlighted excerpt using ts_headline
 * Shows matching context with <mark> tags
 */
export function buildExcerptExpression(
  query: string,
  options: {
    maxWords?: number;
    minWords?: number;
    startSel?: string;
    stopSel?: string;
  } = {}
): SQL {
  const {
    maxWords = 50,
    minWords = 10,
    startSel = "<mark>",
    stopSel = "</mark>",
  } = options;

  const tsquery = toTsQuery(query);

  return sql`ts_headline(
    'chinese',
    ${knowledgeItems.content},
    ${tsquery},
    'StartSel=${sql.raw(startSel)}, StopSel=${sql.raw(stopSel)}, MaxWords=${maxWords}, MinWords=${minWords}'
  )`;
}

/**
 * Build WHERE clause for search with optional domain filter
 */
export function buildSearchWhere(
  query: string,
  domain?: string
): SQL {
  const tsquery = toTsQuery(query);

  if (domain) {
    return sql`${knowledgeItems.searchVector} @@ ${tsquery} AND ${knowledgeItems.domain} = ${domain}`;
  }

  return sql`${knowledgeItems.searchVector} @@ ${tsquery}`;
}

/**
 * Minimum query length validation
 */
export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 100;

export function validateQuery(query: string): {
  valid: boolean;
  error?: string;
} {
  if (!query || query.trim().length === 0) {
    return { valid: false, error: "Search query is required" };
  }

  if (query.trim().length < MIN_SEARCH_LENGTH) {
    return {
      valid: false,
      error: `Query must be at least ${MIN_SEARCH_LENGTH} characters`,
    };
  }

  if (query.length > MAX_SEARCH_LENGTH) {
    return {
      valid: false,
      error: `Query must be at most ${MAX_SEARCH_LENGTH} characters`,
    };
  }

  return { valid: true };
}

// Re-export types for convenience
export type { SearchResult, SearchResponse } from "@/app/api/search/route";
