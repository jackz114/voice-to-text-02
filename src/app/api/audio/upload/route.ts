import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 上传音频文件到 R2
// 路由: POST /api/audio/upload
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
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 步骤 2: 获取上传的文件
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Audio file is required", code: "MISSING_FILE" },
        { status: 400 }
      );
    }

    // 步骤 3: 验证文件类型
    const validTypes = ["audio/mpeg", "audio/wav", "audio/webm", "audio/mp4", "audio/ogg"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid audio format", code: "INVALID_FORMAT" },
        { status: 400 }
      );
    }

    // 步骤 4: 验证文件大小 (最大 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large (max 50MB)", code: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    // 步骤 5: 生成唯一文件名
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 11);
    const fileExtension = file.name.split(".").pop() || "webm";
    const key = `audio/${user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;

    // 步骤 6: 获取 R2 bucket binding
    // @ts-ignore - AUDIO_BUCKET is a Cloudflare Workers binding
    const bucket = process.env.AUDIO_BUCKET;
    if (!bucket) {
      return NextResponse.json(
        { error: "Storage not configured", code: "STORAGE_ERROR" },
        { status: 500 }
      );
    }

    // 步骤 7: 上传文件到 R2
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        userId: user.id,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // 步骤 8: 返回文件信息
    // 生成公开的访问 URL (通过 API 代理)
    const audioUrl = `/api/audio/${encodeURIComponent(key)}`;

    console.log("Audio uploaded to R2:", {
      key,
      userId: user.id,
      size: file.size,
      type: file.type,
    });

    return NextResponse.json({
      success: true,
      audioUrl,
      key,
      size: file.size,
      type: file.type,
      duration: 0, // TODO: 通过 ffprobe 或浏览器 API 获取音频时长
    });
  } catch (error) {
    console.error("Upload audio error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload audio",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
