// src/app/api/library/item/route.ts
// 使用 Supabase REST API 查询单个知识条目详情

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // 步骤 3: 查询知识条目（使用 Supabase REST API 关联 review_state）
    const { data: rawItem, error: dbError } = await supabase
      .from("knowledge_items")
      .select(
        `
        id,
        title,
        content,
        domain,
        source,
        tags,
        created_at,
        review_state(
          next_review_at,
          review_count
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (dbError) {
      console.error("知识条目查询失败:", dbError);
      throw dbError;
    }

    if (!rawItem) {
      return NextResponse.json(
        { error: "知识条目不存在", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    console.log("知识条目详情查询成功:", { userId: user.id, itemId: id });

    // 步骤 4: 格式化并返回结果
    // review_state 是数组类型，取第一个元素（一对一关系）
    const reviewState = Array.isArray(rawItem.review_state)
      ? rawItem.review_state[0]
      : rawItem.review_state;

    const item = {
      id: rawItem.id,
      title: rawItem.title,
      content: rawItem.content,
      domain: rawItem.domain,
      source: rawItem.source,
      tags: rawItem.tags,
      createdAt: rawItem.created_at,
      nextReviewAt: reviewState?.next_review_at ?? null,
      reviewCount: reviewState?.review_count ?? 0,
    };

    return NextResponse.json(item);
  } catch (error) {
    console.error("知识条目详情错误:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "获取失败", code: "INTERNAL_ERROR", details: errorMessage },
      { status: 500 }
    );
  }
}
