// src/app/api/library/domains/route.ts
// 获取用户的所有领域(domain)列表及其计数 - 独立于过滤的 items

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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

    // 查询所有领域及其计数
    const result = await db
      .select({
        domain: knowledgeItems.domain,
        count: sql<number>`count(*)::int`,
      })
      .from(knowledgeItems)
      .where(eq(knowledgeItems.userId, user.id))
      .groupBy(knowledgeItems.domain);

    // 计算总数
    const totalCount = result.reduce((sum, item) => sum + item.count, 0);

    // 构建响应
    const domains = result.map((r) => r.domain);
    const counts: Record<string, number> = {};
    for (const item of result) {
      counts[item.domain] = item.count;
    }

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
