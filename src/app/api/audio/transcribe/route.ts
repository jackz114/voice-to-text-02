// src/app/api/audio/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { db } from "@/db/index";
import { transcriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    // 步骤 6: 调用 Whisper API 进行转写
    // gpt-4o-mini-transcribe 仅支持 "json" 格式（不支持 "text"）
    const arrayBuffer = await audioData.arrayBuffer();
    const ext = audioPath.split(".").pop() ?? "webm";
    const audioFile = new File([arrayBuffer], `audio.${ext}`, { type: `audio/${ext}` });

    const transcriptionResult = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-mini-transcribe",
      response_format: "json",
      language: "zh",
    });

    // 步骤 7: 更新数据库记录（状态：completed）
    await db
      .update(transcriptions)
      .set({
        text: transcriptionResult.text,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(transcriptions.id, transcriptionRow.id));

    console.log("转写完成:", {
      userId: user.id,
      audioPath,
      textLength: transcriptionResult.text.length,
    });

    return NextResponse.json({
      text: transcriptionResult.text,
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
