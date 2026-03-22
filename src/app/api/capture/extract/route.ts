// src/app/api/capture/extract/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractKnowledgeItems, CaptureError } from "../capture-client";

const MAX_TEXT_LENGTH = 100_000; // 100,000 字符上限 (Pitfall 5)
const MIN_TEXT_LENGTH = 50; // 最短 50 字符，避免无意义提取

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

    // 步骤 2: 解析并验证请求体
    const body = await request.json();
    const { text, sourceUrl } = body as { text: unknown; sourceUrl?: unknown };

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "缺少 text 参数", code: "MISSING_TEXT" },
        { status: 400 }
      );
    }

    if (text.length < MIN_TEXT_LENGTH) {
      return NextResponse.json(
        { error: "内容太短，请粘贴至少 50 个字符的内容。", code: "TEXT_TOO_SHORT" },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: "内容超出限制（100,000 字符），请分段粘贴。", code: "TEXT_TOO_LONG" },
        { status: 413 }
      );
    }

    const sourceUrlStr = typeof sourceUrl === "string" ? sourceUrl : undefined;

    // 步骤 3: 调用 AI 提取
    const items = await extractKnowledgeItems(text, sourceUrlStr);

    if (items.length === 0) {
      return NextResponse.json(
        {
          error: "AI 未能从该内容中提取到知识点。尝试粘贴更具体的学习材料。",
          code: "NO_ITEMS_EXTRACTED",
          items: [],
        },
        { status: 200 } // 200 so the client can show the "no items" state gracefully
      );
    }

    console.log("知识提取成功:", {
      userId: user.id,
      itemCount: items.length,
      textLength: text.length,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("捕获提取错误:", error);

    if (error instanceof CaptureError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "提取失败，请检查网络后重试。", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
