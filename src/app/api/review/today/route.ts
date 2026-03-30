// src/app/api/review/today/route.ts
// Uses Supabase REST API to query today's review items

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Type definitions
interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  domain: string;
  source: string;
  tags: string[];
}

interface ReviewState {
  id: string;
  next_review_at: string;
  stability: number;
  difficulty: number;
  review_count: number;
  last_reviewed_at: string | null;
  knowledge_items: KnowledgeItem[];
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

    // Step 2: Query review items due today
    // Uses Supabase REST API to query from review_state table, joining knowledge_items
    const now = new Date().toISOString();

    const { data: rawItems, error: dbError } = await supabase
      .from("review_state")
      .select(
        `
        id,
        next_review_at,
        stability,
        difficulty,
        review_count,
        last_reviewed_at,
        knowledge_items!inner(
          id,
          title,
          content,
          domain,
          source,
          tags
        )
      `
      )
      .lte("next_review_at", now)
      .eq("knowledge_items.user_id", user.id);

    if (dbError) {
      console.error("Failed to query review items:", dbError);
      throw dbError;
    }

    // Format results
    const dueItems = (rawItems || []).map((item: ReviewState) => ({
      itemId: item.knowledge_items[0]?.id,
      title: item.knowledge_items[0]?.title,
      content: item.knowledge_items[0]?.content,
      domain: item.knowledge_items[0]?.domain,
      source: item.knowledge_items[0]?.source,
      tags: item.knowledge_items[0]?.tags,
      reviewStateId: item.id,
      nextReviewAt: item.next_review_at,
      stability: item.stability,
      difficulty: item.difficulty,
      reviewCount: item.review_count,
      lastReviewedAt: item.last_reviewed_at,
    }));

    console.log("Today's review items:", { userId: user.id, count: dueItems.length });

    // Step 3: Return results
    return NextResponse.json({ items: dueItems, count: dueItems.length });
  } catch (error) {
    console.error("Failed to get today's reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
