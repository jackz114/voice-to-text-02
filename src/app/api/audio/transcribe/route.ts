// src/app/api/audio/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/db/index";
import { transcriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

// 硅基流动 API 配置
const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1";
const SILICONFLOW_MODEL = "FunAudioLLM/SenseVoiceSmall";

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
      return NextResponse.json({ error: "请先登录", code: "UNAUTHORIZED" }, { status: 401 });
    }

    // 步骤 2: 解析请求体
    const { audioPath } = (await request.json()) as { audioPath: string };
    if (!audioPath || typeof audioPath !== "string") {
      return NextResponse.json({ error: "缺少 audioPath", code: "INVALID_INPUT" }, { status: 400 });
    }

    // 步骤 3: 创建 transcriptions 记录（状态：processing）
    const [transcriptionRow] = await db
      .insert(transcriptions)
      .values({
        userId: user.id,
        audioUrl: audioPath,
        status: "processing",
        language: "zh",
      })
      .returning({ id: transcriptions.id });

    // 步骤 4: 从 Supabase Storage 下载音频（服务端下载供 Whisper 使用）
    // 音频已存在 Supabase Storage；服务端通过 service role 访问
    const { data: audioData, error: downloadError } = await supabase.storage
      .from("audio")
      .download(audioPath);

    if (downloadError || !audioData) {
      await db
        .update(transcriptions)
        .set({ status: "failed" })
        .where(eq(transcriptions.id, transcriptionRow.id));
      console.error("音频下载错误:", downloadError);
      return NextResponse.json(
        { error: "音频文件访问失败", code: "DOWNLOAD_ERROR" },
        { status: 500 }
      );
    }

    // 步骤 5: 文件大小校验（Whisper 25MB 上限）
    const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
    if (audioData.size > MAX_BYTES) {
      await db
        .update(transcriptions)
        .set({ status: "failed" })
        .where(eq(transcriptions.id, transcriptionRow.id));
      return NextResponse.json(
        { error: "音频文件超过 25MB 限制", code: "FILE_TOO_LARGE" },
        { status: 413 }
      );
    }

    // 步骤 6: 调用硅基流动 SenseVoice API 进行转写
    const arrayBuffer = await audioData.arrayBuffer();
    const ext = audioPath.split(".").pop() ?? "webm";
    const mimeType = ext === "mp3" ? "audio/mpeg" : `audio/${ext}`;

    // 构建 FormData
    const formData = new FormData();
    formData.append("file", new Blob([arrayBuffer], { type: mimeType }), `audio.${ext}`);
    formData.append("model", SILICONFLOW_MODEL);
    formData.append("language", "zh");
    formData.append("response_format", "json");

    const response = await fetch(`${SILICONFLOW_BASE_URL}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("硅基流动 API 错误:", errorData);
      await db
        .update(transcriptions)
        .set({ status: "failed" })
        .where(eq(transcriptions.id, transcriptionRow.id));
      return NextResponse.json(
        { error: "转写服务暂时不可用", code: "TRANSCRIPTION_API_ERROR" },
        { status: 502 }
      );
    }

    const transcriptionResult = await response.json() as { text: string };
    const transcribedText = transcriptionResult.text ?? "";

    // 步骤 7: 更新数据库记录（状态：completed）
    await db
      .update(transcriptions)
      .set({
        text: transcribedText,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(transcriptions.id, transcriptionRow.id));

    console.log("转写完成:", {
      userId: user.id,
      audioPath,
      textLength: transcribedText.length,
    });

    return NextResponse.json({
      text: transcribedText,
      transcriptionId: transcriptionRow.id,
    });
  } catch (error) {
    console.error("转写错误:", error);
    return NextResponse.json(
      { error: "转写失败，请重试", code: "TRANSCRIPTION_ERROR" },
      { status: 500 }
    );
  }
}
