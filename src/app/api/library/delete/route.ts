// src/app/api/library/delete/route.ts
// 使用 Supabase REST API 删除知识条目

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: NextRequest) {
  try {
    // 步骤 1: 验证用户身份
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
        { error: "请先登录", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 步骤 2: 解析请求体
    const { id } = (await request.json()) as { id?: unknown };
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "缺少知识条目 id", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    // 步骤 3: 验证条目所有权
    const { data: item, error: checkError } = await supabase
      .from("knowledge_items")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError || !item) {
      return NextResponse.json(
        { error: "条目不存在或无权删除", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 步骤 4: 先删除 review_state（外键关联）
    const { error: reviewError } = await supabase
      .from("review_state")
      .delete()
      .eq("knowledge_item_id", id);

    if (reviewError) {
      console.error("删除复习状态失败:", reviewError);
      throw reviewError;
    }

    // 步骤 5: 再删除 knowledge_item
    const { error: deleteError } = await supabase
      .from("knowledge_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("删除知识条目失败:", deleteError);
      throw deleteError;
    }

    console.log("知识条目删除成功:", { userId: user.id, deletedId: id });

    // 步骤 6: 返回成功
    return NextResponse.json({ deleted: id });
  } catch (error) {
    console.error("删除知识条目错误:", error);
    return NextResponse.json(
      { error: "删除失败", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
