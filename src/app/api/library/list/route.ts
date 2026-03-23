// src/app/api/library/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/db/index";
import { knowledgeItems, reviewState } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

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

    // 步骤 2: 读取可选的 domain 查询参数
    const domain = request.nextUrl.searchParams.get("domain");

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
        contentPreview: sql<string>`LEFT(${knowledgeItems.content}, 50)`,
      })
      .from(knowledgeItems)
      .innerJoin(reviewState, eq(reviewState.knowledgeItemId, knowledgeItems.id))
      .where(
        domain
          ? and(eq(knowledgeItems.userId, user.id), eq(knowledgeItems.domain, domain))
          : eq(knowledgeItems.userId, user.id)
      )
      .orderBy(desc(knowledgeItems.createdAt));

    console.log("知识库列表查询成功:", { userId: user.id, count: items.length, domain });

    // 步骤 4: 返回结果
    return NextResponse.json({ items });
  } catch (error) {
    console.error("知识库列表错误:", error);
    return NextResponse.json(
      { error: "获取失败", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
