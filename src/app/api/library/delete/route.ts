// src/app/api/library/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/db/index";
import { knowledgeItems, reviewState } from "@/db/schema";
import { and, eq } from "drizzle-orm";

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

    // 步骤 3: 先删除 review_state（无 CASCADE 定义）
    await db.delete(reviewState).where(eq(reviewState.knowledgeItemId, id));

    // 步骤 4: 再删除 knowledge_item（含所有者校验）
    const deleted = await db
      .delete(knowledgeItems)
      .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.userId, user.id)))
      .returning({ id: knowledgeItems.id });

    // 步骤 5: 检查删除结果
    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "条目不存在或无权删除", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    console.log("知识条目删除成功:", { userId: user.id, deletedId: deleted[0].id });

    // 步骤 6: 返回成功
    return NextResponse.json({ deleted: deleted[0].id });
  } catch (error) {
    console.error("删除知识条目错误:", error);
    return NextResponse.json(
      { error: "删除失败", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
