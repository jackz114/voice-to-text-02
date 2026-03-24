// src/app/api/library/item/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/db/index";
import { knowledgeItems, reviewState } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
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

    // 步骤 2: 读取 id 查询参数
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "缺少 id 参数", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // 步骤 3: 查询知识条目（连接 review_state 获取复习时间）
    const items = await db
      .select({
        id: knowledgeItems.id,
        title: knowledgeItems.title,
        content: knowledgeItems.content,
        domain: knowledgeItems.domain,
        source: knowledgeItems.source,
        tags: knowledgeItems.tags,
        createdAt: knowledgeItems.createdAt,
        nextReviewAt: reviewState.nextReviewAt,
        reviewCount: reviewState.reviewCount,
      })
      .from(knowledgeItems)
      .leftJoin(reviewState, eq(reviewState.knowledgeItemId, knowledgeItems.id))
      .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.userId, user.id)))
      .limit(1);

    if (items.length === 0) {
      return NextResponse.json(
        { error: "知识条目不存在", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    console.log("知识条目详情查询成功:", { userId: user.id, itemId: id });

    // 步骤 4: 返回结果
    return NextResponse.json(items[0]);
  } catch (error) {
    console.error("知识条目详情错误:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "获取失败", code: "INTERNAL_ERROR", details: errorMessage },
      { status: 500 }
    );
  }
}
