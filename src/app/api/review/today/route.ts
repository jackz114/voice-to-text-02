// src/app/api/review/today/route.ts
// 使用 Supabase REST API 查询今日复习条目

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 类型定义
interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  domain: string;
  source: string;
  tags: string[];
}

interface ReviewState {
  id: string;
  next_review_at: string;
  stability: number;
  difficulty: number;
  review_count: number;
  last_reviewed_at: string | null;
  knowledge_items: KnowledgeItem;
}

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

    // 步骤 2: 查询今日到期的复习条目
    // 使用 Supabase REST API 从 review_state 表查询，关联 knowledge_items
    const now = new Date().toISOString();

    const { data: rawItems, error: dbError } = await supabase
      .from("review_state")
      .select(
        `
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
          domain,
          source,
          tags
        )
      `
      )
      .lte("next_review_at", now)
      .eq("knowledge_items.user_id", user.id);

    if (dbError) {
      console.error("查询复习条目失败:", dbError);
      throw dbError;
    }

    // 格式化结果
    const dueItems = (rawItems || []).map((item: ReviewState) => ({
      itemId: item.knowledge_items.id,
      title: item.knowledge_items.title,
      content: item.knowledge_items.content,
      domain: item.knowledge_items.domain,
      source: item.knowledge_items.source,
      tags: item.knowledge_items.tags,
      reviewStateId: item.id,
      nextReviewAt: item.next_review_at,
      stability: item.stability,
      difficulty: item.difficulty,
      reviewCount: item.review_count,
      lastReviewedAt: item.last_reviewed_at,
    }));

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
