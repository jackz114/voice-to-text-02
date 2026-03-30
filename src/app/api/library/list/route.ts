// src/app/api/library/list/route.ts
// Uses Supabase REST API to query knowledge library list

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Type definitions
interface ReviewState {
  next_review_at: string;
  review_count: number;
}

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  domain: string;
  source: string;
  tags: string[];
  created_at: string;
  folder_id: string | null;
  review_state: ReviewState[] | null;
}

export async function GET(request: NextRequest) {
  try {
    // Step 1: Verify user identity
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
        { error: "Please sign in first", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Step 2: Read optional domain query parameter
    const domain = request.nextUrl.searchParams.get("domain");

    // Step 3: Query knowledge items (using Supabase REST API foreign table query)
    // Query knowledge_items table and join review_state via foreign key
    let query = supabase
      .from("knowledge_items")
      .select(
        `
        id,
        title,
        content,
        domain,
        source,
        tags,
        created_at,
        folder_id,
        review_state(
          next_review_at,
          review_count
        )
      `
      )
      .eq("user_id", user.id);

    // Optional domain filter
    if (domain) {
      query = query.eq("domain", domain);
    }

    // Sort: by creation time descending
    query = query.order("created_at", { ascending: false });

    const { data: rawItems, error: dbError } = await query;

    if (dbError) {
      console.error("Failed to query knowledge library:", dbError);
      throw dbError;
    }

    // Format results (keeping same field names as original interface)
    const items = (rawItems || []).map((item: KnowledgeItem) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      domain: item.domain,
      source: item.source,
      tags: item.tags,
      createdAt: item.created_at,
      folder_id: item.folder_id,
      nextReviewAt: item.review_state?.[0]?.next_review_at,
      reviewCount: item.review_state?.[0]?.review_count,
      // Generate content preview (first 50 characters)
      contentPreview: item.content?.slice(0, 50) || "",
    }));

    console.log("Knowledge library list queried:", { userId: user.id, count: items.length, domain });

    // Step 4: Return results
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to get knowledge library list:", error);
    return NextResponse.json(
      { error: "Failed to fetch", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
