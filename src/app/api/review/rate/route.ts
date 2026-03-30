// src/app/api/review/rate/route.ts
// Uses Supabase REST API to update review ratings

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FSRS, Grade, createEmptyCard } from "ts-fsrs";
import { dbRowToFsrsCard, fsrsResultToDbUpdate } from "@/lib/fsrs";

export async function POST(request: NextRequest) {
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

    // Step 2: Validate request body
    const body = (await request.json()) as {
      knowledgeItemId?: unknown;
      rating?: unknown;
    };
    const knowledgeItemId = body.knowledgeItemId;
    const rating = body.rating;

    if (!knowledgeItemId || typeof knowledgeItemId !== "string") {
      return NextResponse.json(
        { error: "Missing knowledgeItemId", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 4) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1-4", code: "INVALID_RATING" },
        { status: 400 }
      );
    }

    // Step 3: Query review_state row and verify ownership
    const { data: rawRow, error: queryError } = await supabase
      .from("review_state")
      .select(
        `
        id,
        knowledge_item_id,
        stability,
        difficulty,
        retrievability,
        review_count,
        last_reviewed_at,
        next_review_at,
        knowledge_items!inner(user_id)
      `
      )
      .eq("knowledge_item_id", knowledgeItemId)
      .eq("knowledge_items.user_id", user.id)
      .maybeSingle();

    if (queryError || !rawRow) {
      return NextResponse.json(
        { error: "Item not found or access denied", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Format data to be compatible with fsrs library
    const row = {
      reviewStateId: rawRow.id,
      knowledgeItemId: rawRow.knowledge_item_id,
      stability: rawRow.stability,
      difficulty: rawRow.difficulty,
      retrievability: rawRow.retrievability,
      reviewCount: rawRow.review_count,
      lastReviewedAt: rawRow.last_reviewed_at,
      nextReviewAt: rawRow.next_review_at,
    };

    // Step 4: Build FSRS card and calculate new state
    const f = new FSRS({});
    // First review: use createEmptyCard() to avoid incorrect initial state with stability=0
    const fsrsCard =
      row.reviewCount === 0 ? createEmptyCard(row.nextReviewAt) : dbRowToFsrsCard(row);
    const result = f.next(fsrsCard, new Date(), rating as Grade);
    const dbUpdate = fsrsResultToDbUpdate(result, row.reviewCount);

    // Step 5: Write back to database
    const { error: updateError } = await supabase
      .from("review_state")
      .update({
        stability: dbUpdate.stability,
        difficulty: dbUpdate.difficulty,
        retrievability: dbUpdate.retrievability,
        review_count: dbUpdate.reviewCount,
        last_reviewed_at: dbUpdate.lastReviewedAt,
        next_review_at: dbUpdate.nextReviewAt,
      })
      .eq("knowledge_item_id", knowledgeItemId);

    if (updateError) {
      console.error("Failed to update review state:", updateError);
      throw updateError;
    }

    console.log("Rating update success:", {
      userId: user.id,
      knowledgeItemId,
      rating,
      nextReviewAt: result.card.due,
      reviewCount: dbUpdate.reviewCount,
    });

    // Step 6: Return results
    return NextResponse.json({
      nextReviewAt: result.card.due,
      stability: result.card.stability,
      difficulty: result.card.difficulty,
      reviewCount: dbUpdate.reviewCount,
    });
  } catch (error) {
    console.error("Rating update error:", error);
    return NextResponse.json(
      { error: "Update failed", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
