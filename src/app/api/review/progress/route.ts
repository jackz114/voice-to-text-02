// src/app/api/review/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
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

    // Get all folders and their note statistics
    const { data: folders, error: foldersError } = await supabase
      .from("folders")
      .select("id, name")
      .eq("user_id", user.id);
    if (foldersError) throw foldersError;

    // Get all note count (grouped by folder)
    const { data: allItems, error: itemsError } = await supabase
      .from("knowledge_items")
      .select("folder_id")
      .eq("user_id", user.id);
    if (itemsError) throw itemsError;

    // Get all activated review states
    const { data: allReviewStates, error: reviewError } = await supabase
      .from("review_state")
      .select("knowledge_item_id")
      .eq("user_id", user.id);
    if (reviewError) throw reviewError;

    type ReviewState = { knowledge_item_id: string };
    const activatedItemIds = new Set((allReviewStates || []).map((s: ReviewState) => s.knowledge_item_id));

    // Type definitions for Supabase responses
    type FolderItem = { id: string; name: string };
    type KnowledgeItem = { id: string; folder_id: string | null };

    // Stats by folder
    const folderStats = ((folders || []) as FolderItem[]).map(folder => {
      const total = ((allItems || []) as KnowledgeItem[]).filter(i => i.folder_id === folder.id).length;
      const activated = ((allItems || []) as KnowledgeItem[]).filter(i => i.folder_id === folder.id && activatedItemIds.has(i.id)).length;
      return { id: folder.id, name: folder.name, total, activated };
    });

    // default folder
    const typedAllItems = (allItems || []) as KnowledgeItem[];
    const defaultTotal = typedAllItems.filter(i => i.folder_id === null).length;
    const defaultActivated = typedAllItems.filter(i => i.folder_id === null && activatedItemIds.has(i.id)).length;
    folderStats.unshift({ id: "default", name: "default", total: defaultTotal, activated: defaultActivated });

    // Global stats
    const totalItems = typedAllItems.length;
    const activatedCount = activatedItemIds.size;

    return NextResponse.json({
      folders: folderStats,
      stats: { total: totalItems, activated: activatedCount }
    });
  } catch (error) {
    console.error("Failed to get learning progress:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}