// src/app/api/capture/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/db/index";
import { knowledgeItems, reviewState } from "@/db/schema";

interface KnowledgeItemInput {
  title: string;
  content: string;
  source?: string;
  domain: string;
  tags: string[];
}

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
        { error: "请先登录后使用捕获功能。", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 步骤 2: 验证请求体
    const body = await request.json();
    const { items } = body as { items: unknown };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items 数组不能为空", code: "INVALID_ITEMS" },
        { status: 400 }
      );
    }

    // 步骤 3: 逐条写入数据库 (D-11: 仅在用户确认后写入)
    // created_at is set automatically by defaultNow() in the Drizzle schema (satisfies EXTRACT-02)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    let savedCount = 0;
    for (const item of items as KnowledgeItemInput[]) {
      if (!item.title || !item.content || !item.domain) continue;

      // 插入 knowledge_items 行
      const [inserted] = await db
        .insert(knowledgeItems)
        .values({
          userId: user.id,
          sourceType: "text_paste",
          title: item.title,
          content: item.content,
          source: item.source ?? null,
          domain: item.domain,
          tags: item.tags ?? [],
        })
        .returning({ id: knowledgeItems.id });

      if (!inserted) continue;

      // 插入 review_state 行 — 初始 FSRS 状态，首次复习定为明天
      await db.insert(reviewState).values({
        knowledgeItemId: inserted.id,
        stability: 0,
        difficulty: 0,
        retrievability: 0,
        reviewCount: 0,
        nextReviewAt: tomorrow,
      });

      savedCount++;
    }

    console.log("知识条目保存成功:", { userId: user.id, savedCount });

    return NextResponse.json({ savedCount });
  } catch (error) {
    console.error("确认保存错误:", error);
    return NextResponse.json(
      { error: "保存失败，请重试。", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
