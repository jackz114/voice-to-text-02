"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, supabase } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import type { KnowledgeItem } from "@/components/library/KnowledgeItemCard";

interface KnowledgeItemDetail extends KnowledgeItem {
  content?: string;
}

// Static waveform heights for SSR stability
const waveHeights = [
  0.3, 0.5, 0.4, 0.6, 0.8, 0.7, 0.9, 0.6, 0.5, 0.7,
  0.4, 0.6, 0.8, 0.5, 0.3, 0.6, 0.7, 0.9, 0.5, 0.4,
  0.6, 0.8, 0.5, 0.7, 0.4, 0.6, 0.8, 0.3, 0.5, 0.7,
  0.9, 0.6, 0.4, 0.8, 0.5, 0.6, 0.7, 0.3, 0.5, 0.4,
];

function AudioWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      const barCount = 60;
      const barWidth = 2;
      const gap = 2;
      const totalWidth = barCount * (barWidth + gap);
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < barCount; i++) {
        const x = startX + i * (barWidth + gap);
        const baseH = waveHeights[i % waveHeights.length] * height * 0.85;
        const h = baseH * (0.5 + Math.random() * 0.5);
        const y = (height - h) / 2;
        ctx.fillStyle = i % 3 === 0 ? "#B8860B" : i % 3 === 1 ? "#D4A843" : "#E8C97A";
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, 1);
        ctx.fill();
      }

      requestAnimationFrame(draw);
    };

    const resize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = 64;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => window.removeEventListener("resize", resize);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-16" style={{ display: "block" }} />;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function TranscribeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [item, setItem] = useState<KnowledgeItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchItem = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token ?? "";
        const response = await fetch(
          `/api/library/item?id=${encodeURIComponent(params.id as string)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) return;
        const data = await response.json() as KnowledgeItemDetail;
        setItem(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [user, params.id]);

  const handleRate = async (rating: number) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      await fetch("/api/review/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ knowledgeItemId: params.id, rating }),
      });
      router.push("/dashboard");
    } catch {
      // silent
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !item) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-[#6B5B4F]">Item not found.</p>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-[#2C2C2C] hover:bg-[#1C1C1C] text-white text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full bg-[#FAF7F2] flex flex-col">
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-[#E8E0D5]">
          <h1 className="text-lg font-semibold text-[#1C1C1C]">Transcribe</h1>
          <Link
            href="/dashboard"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9C8E80] hover:text-[#1C1C1C] hover:bg-[#F5EFE6] transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Link>
        </div>

        {/* Audio player */}
        <div className="bg-[#1C1C1C] px-8 py-6">
          <div className="max-w-2xl mx-auto">
            {/* Waveform with play button */}
            <div className="flex items-center gap-4 mb-3">
              <button
                type="button"
                onClick={() => setPlaying(!playing)}
                className="w-10 h-10 rounded-full bg-[#B8860B] hover:bg-[#8B6914] flex items-center justify-center shrink-0 transition-colors"
              >
                {playing ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <AudioWaveform />
              </div>
            </div>

            {/* Title below player */}
            <div className="mt-4">
              <h2 className="text-white font-semibold text-base leading-snug">{item.title}</h2>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 max-w-2xl mx-auto w-full px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Transcribed text */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-5">
              <h3 className="text-xs font-semibold text-[#9C8E80] uppercase tracking-wider mb-3">Transcribed Text</h3>
              <p className="text-sm text-[#1C1C1C] leading-relaxed whitespace-pre-wrap">
                {item.content ?? item.contentPreview}
              </p>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#E8E0D5]">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-[#F5EFE6] text-[#6B5B4F] px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Review panel */}
          <div className="space-y-4">
            {/* Review card */}
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-5">
              <h3 className="text-xs font-semibold text-[#9C8E80] uppercase tracking-wider mb-4">Review</h3>

              {/* Rating buttons */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: "Again", color: "bg-red-500 hover:bg-red-600", rating: 0 },
                  { label: "Hard", color: "bg-orange-500 hover:bg-orange-600", rating: 1 },
                  { label: "Good", color: "bg-green-500 hover:bg-green-600", rating: 2 },
                  { label: "Easy", color: "bg-blue-500 hover:bg-blue-600", rating: 3 },
                ].map(({ label, color, rating }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleRate(rating)}
                    className={`py-2 rounded-lg text-white text-xs font-medium transition-colors ${color}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Dates */}
              <div className="space-y-2 text-xs text-[#9C8E80]">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="text-[#1C1C1C]">
                    {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Next Review</span>
                  <span className="text-[#1C1C1C]">
                    {new Date(item.nextReviewAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Reviews</span>
                  <span className="text-[#1C1C1C]">{item.reviewCount}</span>
                </div>
              </div>
            </div>

            {/* Star toggle */}
            <button
              type="button"
              onClick={() => setStarred(!starred)}
              className={[
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors",
                starred
                  ? "border-[#B8860B] bg-[#B8860B]/10 text-[#B8860B]"
                  : "border-[#E8E0D5] text-[#6B5B4F] hover:border-[#B8860B] hover:text-[#B8860B]",
              ].join(" ")}
            >
              <StarIcon filled={starred} />
              {starred ? "Starred" : "Add to Starred"}
            </button>

            {/* Domain badge */}
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-4 text-center">
              <span className="text-xs text-[#B8860B] bg-[#B8860B]/10 px-3 py-1 rounded-full">
                {item.domain}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
