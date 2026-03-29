"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1C1C] font-sans">
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E8E0D5]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="VoiceNote" width={32} height={32} className="object-contain" />
          <span className="text-xl font-bold tracking-tight text-[#1C1C1C]">VoiceNote</span>
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
            className="text-sm font-medium text-[#6B5B4F] hover:text-[#1C1C1C] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="h-9 px-4 flex items-center justify-center rounded-full bg-[#2C2C2C] hover:bg-[#1C1C1C] text-white text-sm font-medium transition-colors"
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
      className="text-sm font-medium text-[#6B5B4F] hover:text-[#1C1C1C] transition-colors"
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
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6 text-[#1C1C1C]">
              Your voice, in{" "}
              <span className="text-[#B8860B]">any language.</span>
            </h1>
            <p className="text-lg text-[#6B5B4F] leading-relaxed mb-8 max-w-lg">
              Experience the future of communication with AI-powered voice synthesis and
              transcription. Transcribe, translate, and preserve your voice across any
              language — in real time.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="h-11 px-6 flex items-center justify-center rounded-full bg-[#2C2C2C] hover:bg-[#1C1C1C] text-white font-medium transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="h-11 px-6 flex items-center justify-center rounded-full border border-[#D4C4B0] text-[#6B5B4F] hover:border-[#B8860B] hover:text-[#1C1C1C] font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* 右侧波形翻译演示 */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8E0D5] shadow-sm">
            <WaveformDemo />
          </div>
        </div>
      </div>
    </section>
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

      // 金色/琥珀色系波形
      const colors = ["#D4A843", "#B8860B", "#D4A84380", "#B8860B80"];
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#E8E0D5] text-xs"
          >
            <span className="text-[#6B5B4F]">{t.from}</span>
            <span className="text-[#D4C4B0]">→</span>
            <span className="font-medium text-[#1C1C1C]">{t.to}</span>
          </div>
        ))}
      </div>

      {/* 转写文字 */}
      <div className="bg-[#FAF7F2] rounded-lg p-4 border border-[#E8E0D5]">
        <p className="text-sm text-[#1C1C1C] font-medium">
          Hello, how are you today?
        </p>
        <p className="text-xs text-[#9C8E80] mt-1">Speaker A · 00:03</p>
      </div>
    </div>
  );
}

function Features() {
  const features = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      title: "Transcribe in Seconds",
      description:
        "Upload any audio file and get accurate transcriptions in seconds. Support for MP3, WAV, M4A, and more.",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Real-time Low Latency",
      description:
        "Experience lightning-fast transcription with our optimized AI pipeline. No more waiting for results.",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      title: "Speaker Diarization",
      description:
        "Automatically identify and label different speakers in your recordings. Perfect for meetings and interviews.",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      ),
      title: "Preserving Voice Quality",
      description:
        "Our AI preserves the unique characteristics of your voice across all translations and transcriptions.",
    },
  ];

  return (
    <section className="py-24 px-6 bg-[#F5EFE6]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#1C1C1C]">
            Voice that scales with your vision
          </h2>
          <p className="text-[#6B5B4F] max-w-xl mx-auto">
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
    <div className="p-6 rounded-2xl bg-white border border-[#E8E0D5] hover:border-[#D4A843] transition-colors shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] text-[#B8860B] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-[#1C1C1C] mb-2">{title}</h3>
      <p className="text-sm text-[#6B5B4F] leading-relaxed">
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
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-[#1C1C1C]">
            Built for creators and professionals
          </h2>
          <p className="text-[#6B5B4F] max-w-lg mx-auto">
            From podcasters to researchers, VoiceNote adapts to your workflow.
          </p>
        </div>

        {/* 界面截图占位 — 样式参考 Soundtype */}
        <div className="bg-[#F5EFE6] rounded-2xl overflow-hidden border border-[#E8E0D5] shadow-sm">
          {/* 模拟浏览器顶栏 */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#E8E0D5] border-b border-[#D4C4B0]">
            <div className="w-3 h-3 rounded-full bg-[#D4A843]" />
            <div className="w-3 h-3 rounded-full bg-[#B8860B]" />
            <div className="w-3 h-3 rounded-full bg-[#C4A07A]" />
            <div className="flex-1 mx-4">
              <div className="bg-white rounded px-3 py-1 text-xs text-[#9C8E80]">
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
  // 固定波形高度
  const waveHeights = [30, 55, 40, 70, 45, 60, 35, 80, 50, 65, 75, 40, 55, 45, 30, 65, 50, 75, 40, 60, 35, 70, 55, 45, 80, 30, 65, 50, 75, 40, 60, 35, 70, 45, 55, 30, 65, 50, 75, 40];

  return (
    <div className="flex h-96">
      {/* 左侧边栏 */}
      <div className="w-16 flex flex-col items-center py-4 bg-white border-r border-[#E8E0D5]">
        <div className="w-8 h-8 rounded-lg bg-[#2C2C2C] flex items-center justify-center mb-6">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="white">
            <rect x="2" y="3" width="12" height="2" rx="1" />
            <rect x="2" y="7" width="12" height="2" rx="1" />
            <rect x="2" y="11" width="12" height="2" rx="1" />
          </svg>
        </div>
        {["Microphone", "Folder", "Star", "Trash"].map((icon, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 text-[#9C8E80] hover:text-[#1C1C1C]"
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
      <div className="flex-1 p-6 bg-white">
        {/* 顶部搜索/筛选 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-[#FAF7F2] rounded-lg px-3 py-1.5 text-xs text-[#6B5B4F] border border-[#E8E0D5]">All</div>
            <div className="text-xs text-[#9C8E80]">Newest first</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#FAF7F2] rounded-lg px-3 py-1.5 text-xs text-[#6B5B4F] border border-[#E8E0D5]">
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
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAF7F2] cursor-pointer mb-2"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2">
                <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-6.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1C1C1C] truncate">
                {item.name}
              </p>
              <p className="text-xs text-[#9C8E80]">{item.time} · {item.lang}</p>
            </div>
            {item.starred && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#D4A843" stroke="#D4A843">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* 右侧预览区 */}
      <div className="w-72 border-l border-[#E8E0D5] p-4 bg-[#FAF7F2]">
        {/* 波形条 */}
        <div className="flex items-center gap-0.5 h-16 mb-4">
          {waveHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-[#D4A843]/40"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>

        {/* 时间轴 */}
        <div className="text-xs text-[#9C8E80] mb-4">00:00 ───────────────── 03:24</div>

        {/* 转写文字 */}
        <div className="space-y-3">
          {[
            { speaker: "A", text: "Hey Sarah, great to have you on the show today." },
            { speaker: "B", text: "Thanks for having me! I'm really excited to be here." },
            { speaker: "A", text: "Let's dive right in. Can you tell us about your background?" },
          ].map((line, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-xs font-bold text-[#B8860B] w-4 shrink-0">{line.speaker}</span>
              <p className="text-xs text-[#6B5B4F]">{line.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#E8E0D5] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="VoiceNote" width={28} height={28} className="object-contain" />
            <span className="text-lg font-bold text-[#1C1C1C]">VoiceNote</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-[#9C8E80]">
            <a href="#" className="hover:text-[#1C1C1C] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-[#1C1C1C] transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-[#1C1C1C] transition-colors">
              Contact
            </a>
          </div>

          <p className="text-xs text-[#9C8E80]">
            © {new Date().getFullYear()} VoiceNote. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
