// src/app/api/search/route.ts
// GET /api/search?q=xxx&domain=xxx&limit=10

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeItems } from "@/db/schema";
import { sql, desc, eq, and } from "drizzle-orm";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import {
  toTsQuery,
  buildRankExpression,
  buildExcerptExpression,
  validateQuery,
  SearchResult,
  SearchResponse,
} from "@/lib/search";

// Search query validation schema
const searchQuerySchema = z.object({
  q: z.string().min(2).max(100),
  domain: z.string().optional(),
  limit: z.coerce.number().min(1).max(20).default(10),
  offset: z.coerce.number().min(0).default(0),
});

// Re-export types for API consumers
export type { SearchResult, SearchResponse } from "@/lib/search";

export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Step 2: Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const parseResult = searchQuerySchema.safeParse({
      q: searchParams.get("q"),
      domain: searchParams.get("domain") || undefined,
      limit: searchParams.get("limit") || "10",
      offset: searchParams.get("offset") || "0",
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid search parameters",
          code: "VALIDATION_ERROR",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { q: query, domain, limit, offset } = parseResult.data;

    // Step 3: Validate query content
    const validation = validateQuery(query);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: "INVALID_QUERY" },
        { status: 400 }
      );
    }

    // Step 4: Build search query components
    const tsquery = toTsQuery(query);
    const rankExpression = buildRankExpression(query);
    const excerptExpression = buildExcerptExpression(query, {
      maxWords: 50,
      minWords: 10,
      startSel: "<mark>",
      stopSel: "</mark>",
    });

    // Step 5: Build WHERE clause
    const whereConditions = [
      // Full-text search match
      sql`${knowledgeItems.searchVector} @@ ${tsquery}`,
      // User isolation
      eq(knowledgeItems.userId, user.id),
      // Optional domain filter
      domain ? eq(knowledgeItems.domain, domain) : undefined,
    ].filter(Boolean);

    // Step 6: Execute search query
    const results = await db
      .select({
        id: knowledgeItems.id,
        title: knowledgeItems.title,
        content: knowledgeItems.content,
        excerpt: excerptExpression,
        domain: knowledgeItems.domain,
        tags: knowledgeItems.tags,
        source: knowledgeItems.source,
        createdAt: knowledgeItems.createdAt,
        rank: rankExpression,
      })
      .from(knowledgeItems)
      .where(and(...whereConditions))
      .orderBy(desc(rankExpression))
      .limit(limit)
      .offset(offset);

    // Step 7: Get total count for pagination
    const countResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(knowledgeItems)
      .where(and(...whereConditions));

    const total = countResult[0]?.count || 0;

    // Step 8: Format response
    const response: SearchResponse = {
      results: results.map((r) => ({
        ...r,
        excerpt: String(r.excerpt),
        rank: Number(r.rank),
      })),
      query,
      total,
      hasMore: offset + results.length < total,
    };

    console.log(`Search: "${query}" returned ${results.length} results for user ${user.id}`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Search failed", code: "SEARCH_ERROR" },
      { status: 500 }
    );
  }
}
