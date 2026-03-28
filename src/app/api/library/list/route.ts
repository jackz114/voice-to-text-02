// src/app/api/library/list/route.ts
// 使用 Supabase REST API 查询知识库列表

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 类型定义
interface ReviewState {
  next_review_at: string;
  review_count: number;
}

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  domain: string;
  source: string;
  tags: string[];
  created_at: string;
  review_state: ReviewState[] | null;
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

    // 步骤 2: 读取可选的 domain 查询参数
    const domain = request.nextUrl.searchParams.get("domain");

    // 步骤 3: 查询知识条目（使用 Supabase REST API 的 foreign table 查询）
    // 查询 knowledge_items 表，并通过外键关联 review_state 表
    let query = supabase
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
        review_state!inner(
          next_review_at,
          review_count
        )
      `
      )
      .eq("user_id", user.id);

    // 可选的 domain 过滤
    if (domain) {
      query = query.eq("domain", domain);
    }

    // 排序：按创建时间倒序
    query = query.order("created_at", { ascending: false });

    const { data: rawItems, error: dbError } = await query;

    if (dbError) {
      console.error("知识库查询失败:", dbError);
      throw dbError;
    }

    // 格式化结果（保持与原接口相同的字段名）
    const items = (rawItems || []).map((item: KnowledgeItem) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      domain: item.domain,
      source: item.source,
      tags: item.tags,
      createdAt: item.created_at,
      nextReviewAt: item.review_state?.[0]?.next_review_at,
      reviewCount: item.review_state?.[0]?.review_count,
      // 生成 content 预览（前50个字符）
      contentPreview: item.content?.slice(0, 50) || "",
    }));

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
