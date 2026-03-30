// src/app/api/audio/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// SiliconFlow API configuration
const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1";
const SILICONFLOW_MODEL = "FunAudioLLM/SenseVoiceSmall";

export async function POST(request: NextRequest) {
  try {
    // Step 1: Verify user identity
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
      return NextResponse.json({ error: "Please sign in first", code: "UNAUTHORIZED" }, { status: 401 });
    }

    // Step 2: Parse request body
    const { audioPath } = (await request.json()) as { audioPath: string };
    if (!audioPath || typeof audioPath !== "string") {
      return NextResponse.json({ error: "Missing audioPath", code: "INVALID_INPUT" }, { status: 400 });
    }

    // Step 3: Verify audio path ownership (audio/{userId}/...)
    const pathParts = audioPath.split("/");
    if (pathParts.length < 2 || pathParts[1] !== user.id) {
      return NextResponse.json({ error: "Access denied", code: "FORBIDDEN" }, { status: 403 });
    }

    // Step 4: Get audio from R2 bucket
    const bucket = AUDIO_BUCKET;
    if (!bucket) {
      return NextResponse.json({ error: "Storage not configured", code: "STORAGE_ERROR" }, { status: 500 });
    }

    const audioObject = await bucket.get(audioPath);
    if (!audioObject) {
      return NextResponse.json({ error: "Audio file not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const audioData = await audioObject.arrayBuffer();
    const audioSize = audioData.byteLength;

    // Step 5: File size validation (Whisper 25MB limit)
    const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
    if (audioSize > MAX_BYTES) {
      return NextResponse.json(
        { error: "Audio file exceeds 25MB limit", code: "FILE_TOO_LARGE" },
        { status: 413 }
      );
    }

    // Step 6: Call SiliconFlow SenseVoice API for transcription
    const ext = audioPath.split(".").pop() ?? "webm";
    const mimeType = ext === "mp3" ? "audio/mpeg" : ext === "wav" ? "audio/wav" : `audio/${ext}`;

    // Build FormData
    const formData = new FormData();
    formData.append("file", new Blob([audioData], { type: mimeType }), `audio.${ext}`);
    formData.append("model", SILICONFLOW_MODEL);
    formData.append("language", "auto");
    formData.append("response_format", "json");

    const siliconFlowApiKey = process.env.SILICONFLOW_API_KEY;
    if (!siliconFlowApiKey) {
      console.error("SILICONFLOW_API_KEY is not configured");
      return NextResponse.json(
        { error: "Transcription service not configured", code: "CONFIG_ERROR" },
        { status: 500 }
      );
    }

    const response = await fetch(`${SILICONFLOW_BASE_URL}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${siliconFlowApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SiliconFlow API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        audioSize,
        mimeType,
      });
      return NextResponse.json(
        { error: `Transcription service error: ${errorText.slice(0, 200)}`, code: "TRANSCRIPTION_API_ERROR" },
        { status: 502 }
      );
    }

    const transcriptionResult = (await response.json()) as { text?: string };
    console.log("SiliconFlow API response:", transcriptionResult);
    const transcribedText = transcriptionResult.text ?? "";

    console.log("Transcription completed:", {
      userId: user.id,
      audioPath,
      textLength: transcribedText.length,
    });

    return NextResponse.json({
      text: transcribedText,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Transcription failed: ${errorMessage}`, code: "TRANSCRIPTION_ERROR" },
      { status: 500 }
    );
  }
}
