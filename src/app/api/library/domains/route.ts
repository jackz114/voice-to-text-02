// src/app/api/library/domains/route.ts
// 获取用户的所有领域(domain)列表及其计数 - 使用 Supabase REST API

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 查询所有领域及其计数（使用 Supabase REST API）
    const { data: items, error: dbError } = await supabase
      .from("knowledge_items")
      .select("domain")
      .eq("user_id", user.id);

    if (dbError) {
      console.error("查询领域失败:", dbError);
      throw dbError;
    }

    // 计算每个领域的计数
    const counts: Record<string, number> = {};
    for (const item of items || []) {
      counts[item.domain] = (counts[item.domain] || 0) + 1;
    }

    const domains = Object.keys(counts);
    const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0);

    return NextResponse.json({
      domains,
      counts,
      totalCount,
    });
  } catch (error) {
    console.error("获取领域列表失败:", error);
    return NextResponse.json(
      { error: "获取领域列表失败" },
      { status: 500 }
    );
  }
}
