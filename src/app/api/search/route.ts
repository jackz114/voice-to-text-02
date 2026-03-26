// src/app/api/search/route.ts
// GET /api/search?q=xxx&domain=xxx&limit=10

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  buildSearchQuery,
  createExcerpt,
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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token ?? undefined);

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

    // Step 4: Build search query
    const searchQuery = buildSearchQuery(query);

    // Step 5: Execute search using Supabase textSearch
    let dbQuery = supabase
      .from("knowledge_items")
      .select(
        "id, title, content, domain, tags, source, created_at, search_vector",
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .textSearch("search_vector", searchQuery);

    // Optional domain filter
    if (domain) {
      dbQuery = dbQuery.eq("domain", domain);
    }

    // Execute query with pagination
    const { data: rawResults, error: searchError, count } = await dbQuery
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (searchError) {
      console.error("Search query failed:", searchError);
      throw searchError;
    }

    // Step 6: Format results
    const results: SearchResult[] = (rawResults || []).map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      excerpt: createExcerpt(item.content, query),
      domain: item.domain,
      tags: item.tags,
      source: item.source,
      createdAt: new Date(item.created_at),
      rank: 1, // Supabase textSearch doesn't return rank directly
    }));

    const total = count || 0;

    const response: SearchResponse = {
      results,
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
