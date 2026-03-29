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
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 获取所有文件夹及其笔记统计
    const { data: folders, error: foldersError } = await supabase
      .from("folders")
      .select("id, name")
      .eq("user_id", user.id);
    if (foldersError) throw foldersError;

    // 获取所有笔记数量（按文件夹分组）
    const { data: allItems, error: itemsError } = await supabase
      .from("knowledge_items")
      .select("folder_id")
      .eq("user_id", user.id);
    if (itemsError) throw itemsError;

    // 获取所有已激活的复习状态
    const { data: allReviewStates, error: reviewError } = await supabase
      .from("review_state")
      .select("knowledge_item_id")
      .eq("user_id", user.id);
    if (reviewError) throw reviewError;

    const activatedItemIds = new Set((allReviewStates || []).map((s: any) => s.knowledge_item_id));

    // 按文件夹统计
    const folderStats = (folders || []).map(folder => {
      const total = (allItems || []).filter(i => i.folder_id === folder.id).length;
      const activated = (allItems || []).filter(i => i.folder_id === folder.id && activatedItemIds.has(i.id)).length;
      return { id: folder.id, name: folder.name, total, activated };
    });

    // default 文件夹
    const defaultTotal = (allItems || []).filter(i => i.folder_id === null).length;
    const defaultActivated = (allItems || []).filter(i => i.folder_id === null && activatedItemIds.has(i.id)).length;
    folderStats.unshift({ id: "default", name: "default", total: defaultTotal, activated: defaultActivated });

    // 全局统计
    const totalItems = (allItems || []).length;
    const activatedCount = activatedItemIds.size;

    return NextResponse.json({
      folders: folderStats,
      stats: { total: totalItems, activated: activatedCount }
    });
  } catch (error) {
    console.error("获取学习进度失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}