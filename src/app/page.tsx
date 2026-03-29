"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white font-sans">
      {/* 导航栏 */}
      <Navbar />

      {/* Hero 区域 */}
      <Hero />

      {/* 特性展示区 */}
      <Features />

      {/* 界面展示 */}
      <InterfaceShowcase />

      {/* Footer */}
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <WaveIcon />
          <span className="text-xl font-bold tracking-tight">VoiceNote</span>
        </div>

        {/* 导航链接 */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/capture">Product</NavLink>
          <NavLink href="#">Technology</NavLink>
          <NavLink href="#">About</NavLink>
          <NavLink href="/payment">Pricing</NavLink>
        </div>

        {/* CTA 按钮 */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="h-9 px-4 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Try for free
          </Link>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      {children}
    </a>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 左侧文字 */}
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              Your voice, in{" "}
              <span className="text-blue-600 dark:text-blue-400">any language.</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-lg">
              Experience the future of communication with AI-powered voice synthesis and
              transcription. Transcribe, translate, and preserve your voice across any
              language — in real time.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="h-11 px-6 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="h-11 px-6 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* 右侧波形翻译演示 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <WaveformDemo />
          </div>
        </div>
      </div>
    </section>
  );
}

function WaveIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="8" fill="#2563EB" />
      <path
        d="M8 18V14M12 18V10M16 18V12M20 18V16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WaveformDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // 绘制多条波形
      const colors = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef"];
      const heights = [60, 45, 55, 40];

      for (let wave = 0; wave < 4; wave++) {
        ctx.beginPath();
        ctx.strokeStyle = colors[wave];
        ctx.lineWidth = 2;

        for (let x = 0; x < width; x++) {
          const y =
            height / 2 +
            Math.sin((x / 20) * (wave + 1) + phase + wave * 0.5) * heights[wave];
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      phase += 0.05;
      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const translations = [
    { from: "English", to: "普通话", text: "Hello, how are you today?" },
    { from: "English", to: "Español", text: "Hello, how are you today?" },
    { from: "English", to: "日本語", text: "Hello, how are you today?" },
    { from: "English", to: "한국어", text: "Hello, how are you today?" },
  ];

  return (
    <div className="space-y-4">
      {/* 波形动画 */}
      <canvas
        ref={canvasRef}
        width={500}
        height={100}
        className="w-full h-24 rounded-lg"
      />

      {/* 语言翻译标签 */}
      <div className="flex flex-wrap gap-2">
        {translations.map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs"
          >
            <span className="text-gray-500">{t.from}</span>
            <span className="text-gray-300">→</span>
            <span className="font-medium text-gray-900 dark:text-white">{t.to}</span>
          </div>
        ))}
      </div>

      {/* 转写文字 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
        <p className="text-sm text-gray-900 dark:text-white font-medium">
          Hello, how are you today?
        </p>
        <p className="text-xs text-gray-400 mt-1">Speaker A · 00:03</p>
      </div>
    </div>
  );
}

function Features() {
  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      ),
      title: "Transcribe in Seconds",
      description:
        "Upload any audio file and get accurate transcriptions in seconds. Support for MP3, WAV, M4A, and more.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Real-time Low Latency",
      description:
        "Experience lightning-fast transcription with our optimized AI pipeline. No more waiting for results.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      title: "Speaker Diarization",
      description:
        "Automatically identify and label different speakers in your recordings. Perfect for meetings and interviews.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      ),
      title: "Preserving Voice Quality",
      description:
        "Our AI preserves the unique characteristics of your voice across all translations and transcriptions.",
    },
  ];

  return (
    <section className="py-24 px-6 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Voice that scales with your vision
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Everything you need to transcribe, translate, and manage your audio content
            at scale.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function InterfaceShowcase() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Built for creators and professionals
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            From podcasters to researchers, VoiceNote adapts to your workflow.
          </p>
        </div>

        {/* 界面截图占位 — 样式参考 Soundtype */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* 模拟浏览器顶栏 */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="flex-1 mx-4">
              <div className="bg-white dark:bg-gray-700 rounded px-3 py-1 text-xs text-gray-400">
                app.voicenote.ai
              </div>
            </div>
          </div>

          {/* 模拟面板界面 */}
          <DashboardMock />
        </div>
      </div>
    </section>
  );
}

function DashboardMock() {
  // 固定波形高度，避免 SSR/CSR hydration 不匹配
  const waveHeights = [30, 55, 40, 70, 45, 60, 35, 80, 50, 65, 75, 40, 55, 45, 30, 65, 50, 75, 40, 60, 35, 70, 55, 45, 80, 30, 65, 50, 75, 40, 60, 35, 70, 45, 55, 30, 65, 50, 75, 40];

  return (
    <div className="flex h-96">
      {/* 左侧边栏 */}
      <div className="w-16 flex flex-col items-center py-4 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center mb-6">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <rect x="2" y="3" width="12" height="2" rx="1" />
            <rect x="2" y="7" width="12" height="2" rx="1" />
            <rect x="2" y="11" width="12" height="2" rx="1" />
          </svg>
        </div>
        {["Microphone", "Folder", "Star", "Trash"].map((icon, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {i === 0 && <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-6.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />}
              {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />}
              {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />}
              {i === 3 && <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />}
            </svg>
          </div>
        ))}
      </div>

      {/* 中间内容区 */}
      <div className="flex-1 p-6">
        {/* 顶部搜索/筛选 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-500">All</div>
            <div className="text-xs text-gray-400">Newest first</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-500">
              Select language
            </div>
          </div>
        </div>

        {/* 项目列表 */}
        {[
          { name: "Podcast Episode 1.mp3", time: "2 min ago", lang: "EN", starred: true },
          { name: "Interview with Sarah.mp3", time: "1 hour ago", lang: "EN", starred: false },
          { name: "Meeting Notes.wav", time: "3 hours ago", lang: "ZH", starred: false },
          { name: "Tutorial Recording.m4a", time: "1 day ago", lang: "JA", starred: true },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer mb-2"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-6.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {item.name}
              </p>
              <p className="text-xs text-gray-400">{item.time} · {item.lang}</p>
            </div>
            {item.starred && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* 右侧预览区 */}
      <div className="w-72 border-l border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-900/50">
        {/* 波形条 */}
        <div className="flex items-center gap-0.5 h-16 mb-4">
          {waveHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-indigo-300 dark:bg-indigo-600"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>

        {/* 时间轴 */}
        <div className="text-xs text-gray-400 mb-4">00:00 ───────────────── 03:24</div>

        {/* 转写文字 */}
        <div className="space-y-3">
          {[
            { speaker: "A", text: "Hey Sarah, great to have you on the show today." },
            { speaker: "B", text: "Thanks for having me! I'm really excited to be here." },
            { speaker: "A", text: "Let's dive right in. Can you tell us about your background?" },
          ].map((line, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-xs font-bold text-indigo-500 w-4 shrink-0">{line.speaker}</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">{line.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <WaveIcon />
            <span className="text-lg font-bold">VoiceNote</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Contact
            </a>
          </div>

          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} VoiceNote. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
