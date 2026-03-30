// src/app/api/audio/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// SiliconFlow API configuration
const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1";
const SILICONFLOW_MODEL = "FunAudioLLM/SenseVoiceSmall";

// Estimate audio duration from file size (bytes)
// Conservative estimate: ~500KB per minute (lower = more minutes allowed)
const BYTES_PER_MINUTE = 500 * 1024;

function estimateDurationMinutes(fileSizeBytes: number): number {
  const minutes = Math.ceil(fileSizeBytes / BYTES_PER_MINUTE);
  return Math.max(1, minutes); // Minimum 1 minute
}

export async function POST(request: NextRequest) {
  let estimatedMinutes = 0;

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

    // Step 5: Estimate duration and check user balance
    estimatedMinutes = estimateDurationMinutes(audioSize);

    // Check user balance
    const { data: balance, error: balanceError } = await supabase
      .from("user_balances")
      .select("remaining_minutes, subscription_status")
      .eq("user_id", user.id)
      .single();

    if (balanceError || !balance) {
      console.error("Failed to get user balance:", balanceError);
      return NextResponse.json(
        { error: "Unable to verify account balance. Please contact support.", code: "BALANCE_CHECK_ERROR" },
        { status: 500 }
      );
    }

    if (balance.remaining_minutes < estimatedMinutes) {
      return NextResponse.json(
        {
          error: `Insufficient minutes. You need ${estimatedMinutes} minutes but have ${balance.remaining_minutes} remaining. Please upgrade your plan.`,
          code: "INSUFFICIENT_MINUTES",
          required: estimatedMinutes,
          remaining: balance.remaining_minutes,
        },
        { status: 402 }
      );
    }

    // Step 6: File size validation (Whisper 25MB limit)
    const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
    if (audioSize > MAX_BYTES) {
      return NextResponse.json(
        { error: "Audio file exceeds 25MB limit", code: "FILE_TOO_LARGE" },
        { status: 413 }
      );
    }

    // Step 7: Call SiliconFlow SenseVoice API for transcription
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

    // Step 8: Deduct minutes from user balance
    const { error: deductError } = await supabase
      .from("user_balances")
      .update({
        used_minutes: balance.used_minutes + estimatedMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (deductError) {
      console.error("Failed to deduct minutes:", deductError);
      // Don't fail the transcription, but log the error
    }

    // Step 9: Record transcription
    const { error: insertError } = await supabase.from("transcriptions").insert({
      user_id: user.id,
      audio_url: audioPath,
      text: transcribedText,
      status: "completed",
      duration_seconds: estimatedMinutes * 60, // Estimate based on our calculation
      cost_minutes: estimatedMinutes,
    });

    if (insertError) {
      console.error("Failed to record transcription:", insertError);
      // Don't fail the transcription, but log the error
    }

    console.log("Transcription completed:", {
      userId: user.id,
      audioPath,
      textLength: transcribedText.length,
      estimatedMinutes,
      remainingMinutes: balance.remaining_minutes - estimatedMinutes,
    });

    return NextResponse.json({
      text: transcribedText,
      minutesUsed: estimatedMinutes,
      remainingMinutes: balance.remaining_minutes - estimatedMinutes,
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
