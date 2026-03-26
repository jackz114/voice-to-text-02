// src/lib/search.ts
// Search utilities and types

// Search result types
export type SearchResult = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  domain: string;
  tags: string[];
  source: string | null;
  createdAt: Date;
  rank: number;
};

export type SearchResponse = {
  results: SearchResult[];
  query: string;
  total: number;
  hasMore: boolean;
};

/**
 * Build search query for Supabase textSearch
 * Converts user query to tsquery-compatible format
 */
export function buildSearchQuery(userQuery: string): string {
  // Escape special characters and normalize
  const normalized = userQuery
    .replace(/[\s]+/g, " ") // Normalize whitespace
    .trim();

  if (!normalized) {
    return "";
  }

  // Split into words and add wildcard for prefix matching
  const words = normalized.split(" ");
  return words.join(" & ");
}

/**
 * Create excerpt from content with highlighted terms
 * Simple fallback since Supabase REST doesn't support ts_headline
 */
export function createExcerpt(
  content: string,
  query: string,
  options: {
    maxLength?: number;
    highlightStart?: string;
    highlightEnd?: string;
  } = {}
): string {
  const {
    maxLength = 150,
    highlightStart = "<mark>",
    highlightEnd = "</mark>",
  } = options;

  const normalizedQuery = query.toLowerCase().trim();
  const lowerContent = content.toLowerCase();

  // Find the position of the first match
  const matchIndex = lowerContent.indexOf(normalizedQuery);

  let excerpt: string;
  if (matchIndex === -1) {
    // No match found, return start of content
    excerpt = content.slice(0, maxLength);
  } else {
    // Find a good starting point (a bit before the match)
    const startPos = Math.max(0, matchIndex - 50);
    const endPos = Math.min(content.length, startPos + maxLength);
    excerpt = content.slice(startPos, endPos);

    // Add ellipsis if needed
    if (startPos > 0) {
      excerpt = "..." + excerpt;
    }
    if (endPos < content.length) {
      excerpt = excerpt + "...";
    }

    // Simple highlight (case-insensitive replacement)
    const words = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);
    for (const word of words) {
      const regex = new RegExp(`(${escapeRegex(word)})`, "gi");
      excerpt = excerpt.replace(regex, `${highlightStart}$1${highlightEnd}`);
    }
  }

  return excerpt;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
