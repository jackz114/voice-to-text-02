// src/app/api/library/item/route.ts
// 使用 Supabase REST API 查询/创建知识条目

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // 步骤 2: 解析请求体
    const body = await request.json();
    const { title, content, domain, source, source_type, tags, folder_id } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "缺少必填字段：title, content", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // 步骤 3: 创建知识条目
    const { data: newItem, error: dbError } = await supabase
      .from("knowledge_items")
      .insert({
        user_id: user.id,
        title,
        content,
        domain: folder_id || "default",
        source: source || "manual",
        source_type: source_type || "text",
        tags: tags || [],
        folder_id: folder_id || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("创建知识条目失败:", dbError);
      return NextResponse.json(
        { error: "数据库错误", code: "DB_ERROR", details: dbError.message },
        { status: 500 }
      );
    }

    // 步骤 4: 创建 review_state 记录
    const { error: reviewError } = await supabase
      .from("review_state")
      .insert({
        item_id: newItem.id,
        next_review_at: new Date().toISOString(),
        review_count: 0,
      });

    if (reviewError) {
      console.error("创建 review_state 失败:", reviewError);
      // 不阻止成功响应，只是没有复习记录
    }

    console.log("知识条目创建成功:", { userId: user.id, itemId: newItem.id, title });

    // 步骤 5: 返回创建的条目
    return NextResponse.json({
      id: newItem.id,
      title: newItem.title,
      content: newItem.content,
      domain: newItem.domain,
      source: newItem.source,
      tags: newItem.tags,
      createdAt: newItem.created_at,
      folder_id: newItem.folder_id,
    });
  } catch (error) {
    console.error("创建知识条目错误:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "创建失败", code: "INTERNAL_ERROR", details: errorMessage },
      { status: 500 }
    );
  }
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
