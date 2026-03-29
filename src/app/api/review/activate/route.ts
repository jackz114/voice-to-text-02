// src/app/api/review/activate/route.ts
// 激活指定文件夹下的所有笔记，为其创建复习状态记录

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
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json() as { folder_id?: string };
    const folderId = body.folder_id;

    // 获取该用户指定文件夹下还没有 review_state 的笔记
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

    // 为每张笔记创建 review_state 记录
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const reviewStates = (items || []).map(item => ({
      knowledge_item_id: item.id,
      user_id: user.id,
      stability: 0,
      difficulty: 0,
      retrievability: 0,
      review_count: 0,
      next_review_at: tomorrow.toISOString(),
      last_reviewed_at: null,
    }));

    if (reviewStates.length > 0) {
      const { error: insertError } = await supabase
        .from("review_state")
        .insert(reviewStates);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ activated_count: reviewStates.length });
  } catch (error) {
    console.error("激活笔记失败:", error);
    return NextResponse.json({ error: "激活失败" }, { status: 500 });
  }
}