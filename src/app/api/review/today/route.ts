// src/app/api/review/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/db/index";
import { knowledgeItems, reviewState } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";

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

    // 步骤 2: 查询今日到期的复习条目（nextReviewAt <= now 且属于当前用户）
    const dueItems = await db
      .select({
        itemId: knowledgeItems.id,
        title: knowledgeItems.title,
        content: knowledgeItems.content,
        domain: knowledgeItems.domain,
        source: knowledgeItems.source,
        tags: knowledgeItems.tags,
        reviewStateId: reviewState.id,
        nextReviewAt: reviewState.nextReviewAt,
        stability: reviewState.stability,
        difficulty: reviewState.difficulty,
        reviewCount: reviewState.reviewCount,
        lastReviewedAt: reviewState.lastReviewedAt,
      })
      .from(reviewState)
      .innerJoin(knowledgeItems, eq(reviewState.knowledgeItemId, knowledgeItems.id))
      .where(
        and(
          eq(knowledgeItems.userId, user.id),
          lte(reviewState.nextReviewAt, new Date())
        )
      );

    console.log("今日复习条目:", { userId: user.id, count: dueItems.length });

    // 步骤 3: 返回结果
    return NextResponse.json({ items: dueItems, count: dueItems.length });
  } catch (error) {
    console.error("今日复习获取错误:", error);
    return NextResponse.json(
      { error: "获取失败", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
