// src/app/api/audio/signed-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // 步骤 1: 验证用户身份（与 confirm/route.ts 相同模式）
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
      return NextResponse.json({ error: "请先登录", code: "UNAUTHORIZED" }, { status: 401 });
    }

    // 步骤 2: 解析请求中的文件扩展名（可选，默认 .webm）
    const body = await request.json().catch(() => ({}));
    const ext = (body as { ext?: string }).ext ?? "webm";

    // 步骤 3: 生成签名上传 URL（音频文件直接上传到 Supabase Storage）
    const fileName = `${user.id}/${Date.now()}.${ext}`;
    const { data, error: storageError } = await supabase.storage
      .from("audio")
      .createSignedUploadUrl(fileName);

    if (storageError || !data) {
      console.error("签名 URL 生成错误:", storageError);
      return NextResponse.json(
        { error: "无法生成上传链接", code: "STORAGE_ERROR" },
        { status: 500 }
      );
    }

    console.log("签名上传 URL 已生成:", { userId: user.id, fileName });
    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    });
  } catch (error) {
    console.error("签名 URL 错误:", error);
    return NextResponse.json({ error: "服务器错误", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
