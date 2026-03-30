// src/app/api/review/activate/route.ts
// Activates all notes in a specified folder, creating review state records for them

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token ?? undefined);
    if (!user) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    const body = await request.json() as { folder_id?: string };
    const folderId = body.folder_id;

    // Get notes in the specified folder that don't have review_state yet
    let query = supabase
      .from("knowledge_items")
      .select("id")
      .eq("user_id", user.id);

    if (folderId && folderId !== "default") {
      query = query.eq("folder_id", folderId);
    } else {
      query = query.is("folder_id", null);
    }

    const { data: items, error: itemsError } = await query;
    if (itemsError) throw itemsError;

    // Create review_state record for each note (immediately reviewable)
    const now = new Date();

    const reviewStates = (items || []).map(item => ({
      knowledge_item_id: item.id,
      user_id: user.id,
      stability: 0,
      difficulty: 0,
      retrievability: 0,
      review_count: 0,
      next_review_at: now.toISOString(),
      last_reviewed_at: null,
    }));

    if (reviewStates.length > 0) {
      // Use upsert to handle already activated cards (will update next_review_at)
      const { error: upsertError } = await supabase
        .from("review_state")
        .upsert(reviewStates, { onConflict: "knowledge_item_id" });
      if (upsertError) throw upsertError;
    }

    return NextResponse.json({ activated_count: reviewStates.length });
  } catch (error) {
    console.error("Failed to activate notes:", error);
    return NextResponse.json({ error: "Activation failed" }, { status: 500 });
  }
}