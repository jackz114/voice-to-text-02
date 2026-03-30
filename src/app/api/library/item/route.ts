// src/app/api/library/item/route.ts
// Uses Supabase REST API to query/create knowledge items

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // Step 2: Parse request body
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      domain?: string;
      source?: string;
      source_type?: string;
      tags?: string[];
      folder_id?: string;
    };
    const { title, content, domain, source, source_type, tags, folder_id } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title, content", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // Step 3: Create knowledge item
    const { data: newItem, error: dbError } = await supabase
      .from("knowledge_items")
      .insert({
        user_id: user.id,
        title,
        content,
        domain: folder_id || "default",
        source: source || "manual",
        source_type: source_type || "text",
        tags: tags || [],
        folder_id: folder_id || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Failed to create knowledge item:", dbError);
      return NextResponse.json(
        { error: "Database error", code: "DB_ERROR", details: dbError.message },
        { status: 500 }
      );
    }

    // Step 4: Create review_state record
    const { error: reviewError } = await supabase
      .from("review_state")
      .insert({
        item_id: newItem.id,
        next_review_at: new Date().toISOString(),
        review_count: 0,
      });

    if (reviewError) {
      console.error("Failed to create review_state:", reviewError);
      // Don't block the success response, just no review record
    }

    console.log("Knowledge item created:", { userId: user.id, itemId: newItem.id, title });

    // Step 5: Return created item
    return NextResponse.json({
      id: newItem.id,
      title: newItem.title,
      content: newItem.content,
      domain: newItem.domain,
      source: newItem.source,
      tags: newItem.tags,
      createdAt: newItem.created_at,
      folder_id: newItem.folder_id,
    });
  } catch (error) {
    console.error("Failed to create knowledge item:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Creation failed", code: "INTERNAL_ERROR", details: errorMessage },
      { status: 500 }
    );
  }
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

    // Step 2: Read id query parameter
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // Step 3: Query knowledge item (using Supabase REST API with review_state join)
    const { data: rawItem, error: dbError } = await supabase
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
        review_state(
          next_review_at,
          review_count
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (dbError) {
      console.error("Failed to query knowledge item:", dbError);
      throw dbError;
    }

    if (!rawItem) {
      return NextResponse.json(
        { error: "Knowledge item not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    console.log("Knowledge item details queried:", { userId: user.id, itemId: id });

    // Step 4: Format and return results
    // review_state is an array type, take the first element (one-to-one relationship)
    const reviewState = Array.isArray(rawItem.review_state)
      ? rawItem.review_state[0]
      : rawItem.review_state;

    const item = {
      id: rawItem.id,
      title: rawItem.title,
      content: rawItem.content,
      domain: rawItem.domain,
      source: rawItem.source,
      tags: rawItem.tags,
      createdAt: rawItem.created_at,
      nextReviewAt: reviewState?.next_review_at ?? null,
      reviewCount: reviewState?.review_count ?? 0,
    };

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to get knowledge item details:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch", code: "INTERNAL_ERROR", details: errorMessage },
      { status: 500 }
    );
  }
}
