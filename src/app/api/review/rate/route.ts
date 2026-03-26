// src/app/api/review/rate/route.ts
// 使用 Supabase REST API 更新复习评分

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FSRS, Grade, createEmptyCard } from "ts-fsrs";
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
    const body = (await request.json()) as {
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
    const { data: rawRow, error: queryError } = await supabase
      .from("review_state")
      .select(
        `
        id,
        knowledge_item_id,
        stability,
        difficulty,
        retrievability,
        review_count,
        last_reviewed_at,
        next_review_at,
        knowledge_items!inner(user_id)
      `
      )
      .eq("knowledge_item_id", knowledgeItemId)
      .eq("knowledge_items.user_id", user.id)
      .maybeSingle();

    if (queryError || !rawRow) {
      return NextResponse.json(
        { error: "条目不存在或无权访问", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 格式化数据以兼容 fsrs 库
    const row = {
      reviewStateId: rawRow.id,
      knowledgeItemId: rawRow.knowledge_item_id,
      stability: rawRow.stability,
      difficulty: rawRow.difficulty,
      retrievability: rawRow.retrievability,
      reviewCount: rawRow.review_count,
      lastReviewedAt: rawRow.last_reviewed_at,
      nextReviewAt: rawRow.next_review_at,
    };

    // 步骤 4: 构建 FSRS 卡片并计算新状态
    const f = new FSRS({});
    // 首次复习：使用 createEmptyCard() 避免 stability=0 的错误初始状态
    const fsrsCard =
      row.reviewCount === 0 ? createEmptyCard(row.nextReviewAt) : dbRowToFsrsCard(row);
    const result = f.next(fsrsCard, new Date(), rating as Grade);
    const dbUpdate = fsrsResultToDbUpdate(result, row.reviewCount);

    // 步骤 5: 写回数据库
    const { error: updateError } = await supabase
      .from("review_state")
      .update({
        stability: dbUpdate.stability,
        difficulty: dbUpdate.difficulty,
        retrievability: dbUpdate.retrievability,
        review_count: dbUpdate.reviewCount,
        last_reviewed_at: dbUpdate.lastReviewedAt,
        next_review_at: dbUpdate.nextReviewAt,
      })
      .eq("knowledge_item_id", knowledgeItemId);

    if (updateError) {
      console.error("更新复习状态失败:", updateError);
      throw updateError;
    }

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
