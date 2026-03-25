// src/app/api/review/rate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/db/index";
import { knowledgeItems, reviewState } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { FSRS, Rating, Grade, createEmptyCard } from "ts-fsrs";
import { dbRowToFsrsCard, fsrsResultToDbUpdate } from "@/lib/fsrs";

export async function POST(request: NextRequest) {
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

    // 步骤 2: 验证请求体
    const body = await request.json() as {
      knowledgeItemId?: unknown;
      rating?: unknown;
    };
    const knowledgeItemId = body.knowledgeItemId;
    const rating = body.rating;

    if (!knowledgeItemId || typeof knowledgeItemId !== "string") {
      return NextResponse.json(
        { error: "缺少 knowledgeItemId", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 4) {
      return NextResponse.json(
        { error: "评分必须是 1-4 之间的整数", code: "INVALID_RATING" },
        { status: 400 }
      );
    }

    // 步骤 3: 查询 review_state 行并验证归属权
    const [row] = await db
      .select({
        reviewStateId: reviewState.id,
        knowledgeItemId: reviewState.knowledgeItemId,
        stability: reviewState.stability,
        difficulty: reviewState.difficulty,
        retrievability: reviewState.retrievability,
        reviewCount: reviewState.reviewCount,
        lastReviewedAt: reviewState.lastReviewedAt,
        nextReviewAt: reviewState.nextReviewAt,
      })
      .from(reviewState)
      .innerJoin(knowledgeItems, eq(reviewState.knowledgeItemId, knowledgeItems.id))
      .where(
        and(
          eq(reviewState.knowledgeItemId, knowledgeItemId),
          eq(knowledgeItems.userId, user.id)
        )
      );

    if (!row) {
      return NextResponse.json(
        { error: "条目不存在或无权访问", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 步骤 4: 构建 FSRS 卡片并计算新状态
    const f = new FSRS({});
    // 首次复习：使用 createEmptyCard() 避免 stability=0 的错误初始状态
    const fsrsCard =
      row.reviewCount === 0 ? createEmptyCard(row.nextReviewAt) : dbRowToFsrsCard(row);
    const result = f.next(fsrsCard, new Date(), rating as Grade);
    const dbUpdate = fsrsResultToDbUpdate(result, row.reviewCount);

    // 步骤 5: 写回数据库
    await db.update(reviewState).set(dbUpdate).where(eq(reviewState.knowledgeItemId, knowledgeItemId));

    console.log("评分更新成功:", {
      userId: user.id,
      knowledgeItemId,
      rating,
      nextReviewAt: result.card.due,
      reviewCount: dbUpdate.reviewCount,
    });

    // 步骤 6: 返回结果
    return NextResponse.json({
      nextReviewAt: result.card.due,
      stability: result.card.stability,
      difficulty: result.card.difficulty,
      reviewCount: dbUpdate.reviewCount,
    });
  } catch (error) {
    console.error("评分更新错误:", error);
    return NextResponse.json(
      { error: "更新失败", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
