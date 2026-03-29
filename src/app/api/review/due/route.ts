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
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folder");

    const now = new Date().toISOString();

    let query = supabase
      .from("review_state")
      .select(`
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
          folder_id,
          domain,
          source,
          tags
        )
      `)
      .lte("next_review_at", now)
      .eq("knowledge_items.user_id", user.id);

    if (folderId && folderId !== "default") {
      query = query.eq("knowledge_items.folder_id", folderId);
    } else {
      query = query.is("knowledge_items.folder_id", null);
    }

    query = query.order("next_review_at", { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    const items = (data || []).map((item: any) => ({
      itemId: item.knowledge_items[0]?.id,
      title: item.knowledge_items[0]?.title,
      content: item.knowledge_items[0]?.content,
      folder_id: item.knowledge_items[0]?.folder_id,
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

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error("获取待复习笔记失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}