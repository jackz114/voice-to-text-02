"use client";

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

interface AudioRecorderProps {
  onTranscriptReady: (text: string) => void; // called with transcribed text
  authToken: string | undefined; // Bearer token from parent (session.access_token)
}

// 按优先级探测浏览器支持的最佳音频编码格式（AUDIO-03）
function getSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "audio/webm"; // 兜底
}

export function AudioRecorder({ onTranscriptReady, authToken }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [waveformAmplitudes, setWaveformAmplitudes] = useState<number[]>(Array(20).fill(0));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const uploadAndTranscribe = async (blob: Blob, mimeType: string, ext: string) => {
    // 25 MB 预上传校验（TRANS-02）
    if (blob.size > 25 * 1024 * 1024) {
      setError("录音文件超过 25MB 限制，请缩短录音时长");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 步骤 1: 获取签名上传 URL
      const signedRes = await fetch("/api/audio/signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ ext }),
      });
      if (!signedRes.ok) {
        setError("获取上传链接失败");
        setIsUploading(false);
        return;
      }
      const { signedUrl: _signedUrl, token, path } = await signedRes.json();

      // 步骤 2: 浏览器直接上传到 Supabase Storage（音频字节不经过 Cloudflare Worker）
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error: uploadError } = await supabase.storage
        .from("audio")
        .uploadToSignedUrl(path, token, blob, { contentType: mimeType });

      setIsUploading(false);
      if (uploadError) {
        setError("上传失败：" + uploadError.message);
        return;
      }

      // 步骤 3: 触发转写
      setIsTranscribing(true);
      const transcribeRes = await fetch("/api/audio/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ audioPath: path }),
      });
      setIsTranscribing(false);

      if (!transcribeRes.ok) {
        setError("转写失败，请重试");
        return;
      }
      const { text } = await transcribeRes.json();
      onTranscriptReady(text);
    } catch (err) {
      setIsUploading(false);
      setIsTranscribing(false);
      setError("操作失败，请检查网络后重试");
      console.error("音频上传/转写错误:", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
      chunksRef.current = [];

      // Web Audio API 用于波形可视化
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      // 启动波形动画循环
      const updateWaveform = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const amps = Array.from(data.slice(0, 20)).map((v) => v / 255);
        setWaveformAmplitudes(amps);
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

      // 关键：在 onstop 内部组装 Blob，而不是在调用 stop() 之后（Pitfall 4）
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
        await uploadAndTranscribe(blob, mimeType, ext);
      };

      recorder.start(1000); // 每秒收集一个 chunk
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setError(null);

      // 已用时间计数器
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } catch (err) {
      setError("无法访问麦克风，请检查浏览器权限设置");
      console.error("麦克风访问错误:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current !== null) clearInterval(timerRef.current);
    setIsRecording(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setWaveformAmplitudes(Array(20).fill(0));
  };

  const togglePause = () => {
    if (isPaused) {
      mediaRecorderRef.current?.resume();
    } else {
      mediaRecorderRef.current?.pause();
    }
    setIsPaused(!isPaused);
  };

  return (
    <div className="border rounded-xl p-4 bg-white space-y-4">
      <h3 className="font-semibold text-gray-800">音频录制</h3>

      {/* 波形显示（仅录制中且未暂停时可见）*/}
      {isRecording && !isPaused && (
        <div className="flex items-end gap-0.5 h-10 justify-center">
          {waveformAmplitudes.map((amp, i) => (
            <div
              key={i}
              className="w-2 bg-blue-500 rounded-full transition-all duration-75"
              style={{ height: `${Math.max(4, amp * 40)}px` }}
            />
          ))}
        </div>
      )}

      {/* 已用时间 */}
      {isRecording && (
        <p className="text-center text-gray-600 text-sm">
          {isPaused ? "⏸ 已暂停 " : "🔴 录制中 "}
          {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}
        </p>
      )}

      {/* 错误消息 */}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* 状态提示 */}
      {isUploading && <p className="text-gray-600 text-sm text-center">正在上传...</p>}
      {isTranscribing && <p className="text-gray-600 text-sm text-center">正在转写，请稍候...</p>}

      {/* 控制按钮 */}
      <div className="flex gap-2 justify-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isUploading || isTranscribing}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            🎙️ 开始录制
          </button>
        ) : (
          <>
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              {isPaused ? "▶ 继续" : "⏸ 暂停"}
            </button>
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium"
            >
              ⏹ 停止并转写
            </button>
          </>
        )}
      </div>
    </div>
  );
}
