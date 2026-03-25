import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 获取音频文件 (通过 API 代理访问 R2)
// 路由: GET /api/audio/[key]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    // 步骤 1: 验证用户身份 (可选: 如果是公开分享可以去掉)
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
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 步骤 2: 获取文件 key
    const { key } = await params;
    const decodedKey = decodeURIComponent(key);

    // 步骤 3: 权限检查 (确保用户只能访问自己的文件)
    // key 格式: audio/{userId}/{filename}
    const keyParts = decodedKey.split("/");
    if (keyParts.length < 2 || keyParts[1] !== user.id) {
      return NextResponse.json(
        { error: "Access denied", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // 步骤 4: 获取 R2 bucket binding
    // @ts-expect-error - AUDIO_BUCKET is a Cloudflare Workers binding
    const bucket = process.env.AUDIO_BUCKET;
    if (!bucket) {
      return NextResponse.json(
        { error: "Storage not configured", code: "STORAGE_ERROR" },
        { status: 500 }
      );
    }

    // 步骤 5: 从 R2 获取文件
    const object = await bucket.get(decodedKey);

    if (!object) {
      return NextResponse.json(
        { error: "Audio not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 步骤 6: 返回文件内容
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000"); // 缓存一年

    return new NextResponse(object.body as ReadableStream, {
      headers,
    });
  } catch (error) {
    console.error("Get audio error:", error);
    return NextResponse.json(
      {
        error: "Failed to get audio",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
