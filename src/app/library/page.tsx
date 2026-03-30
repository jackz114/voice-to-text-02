"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth, useKnowledge, supabase } from "@/components/auth/AuthProvider";
import { KnowledgeItemCard, type KnowledgeItem } from "@/components/library/KnowledgeItemCard";

type Tab = "transcribe" | "starred" | "trash";

interface KnowledgeItemDetail extends KnowledgeItem {
  content?: string;
}

// Fixed waveform data for SSR stable rendering
const waveHeights = [
  0.3, 0.5, 0.4, 0.6, 0.8, 0.7, 0.9, 0.6, 0.5, 0.7, 0.4, 0.6, 0.8, 0.5, 0.3, 0.6, 0.7, 0.9, 0.5,
  0.4, 0.6, 0.8, 0.5, 0.7, 0.4, 0.6, 0.8, 0.3, 0.5, 0.7, 0.9, 0.6, 0.4, 0.8, 0.5, 0.6, 0.7, 0.3,
  0.5, 0.4,
];

function WaveformCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 40;
      const barWidth = 3;
      const gap = 2;
      const totalWidth = barCount * (barWidth + gap);
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < barCount; i++) {
        const x = startX + i * (barWidth + gap);
        const baseH = waveHeights[i] * height * 0.8;
        const h = baseH * (0.6 + Math.random() * 0.4);
        const y = (height - h) / 2;

        ctx.fillStyle = i % 2 === 0 ? "#B8860B" : "#D4A843";
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    // Set canvas size
    const resize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = 80;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-20" style={{ display: "block" }} />;
}

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading } = useKnowledge();
  const [activeTab, setActiveTab] = useState<Tab>("transcribe");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "alpha">("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<KnowledgeItemDetail | null>(null);

  const filteredItems = items
    .filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.contentPreview.toLowerCase().includes(q) ||
        item.domain.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest")
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return a.title.localeCompare(b.title);
    });

  const handleItemClick = async (item: KnowledgeItem) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const response = await fetch(`/api/library/item?id=${encodeURIComponent(item.id)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;
      const detail = (await response.json()) as KnowledgeItemDetail;
      setViewingItem(detail);
    } catch (err) {
      console.error("Failed to fetch item detail:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center gap-4">
        <p className="text-[#6B5B4F]">Please sign in to view your library.</p>
        <Link
          href="/login?redirect_to=/library"
          className="px-6 py-3 rounded-xl bg-[#2C2C2C] hover:bg-[#1C1C1C] text-white text-sm font-medium transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Top Navbar - dark */}
      <nav className="sticky top-0 z-30 w-full bg-[#1C1C1C] px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Recallmemo"
            width={28}
            height={28}
            className="object-contain"
          />
          <span className="text-white font-semibold">Recallmemo</span>
        </div>

        {/* Center: Create Transcribe button */}
        <Link
          href="/capture"
          className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full bg-[#B8860B] hover:bg-[#8B6914] text-white text-sm font-medium transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Transcribe
        </Link>

        {/* Right: Settings + Avatar */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#9C8E80] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Settings"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-[#B8860B] text-white text-xs font-medium flex items-center justify-center overflow-hidden"
            aria-label="User menu"
          >
            {user.email?.[0]?.toUpperCase() ?? "U"}
          </button>
        </div>
      </nav>

      {/* Hero Waveform Section */}
      <section className="bg-[#1C1C1C] px-6 pb-8">
        <div className="max-w-3xl mx-auto text-center pt-8 pb-2">
          <h1 className="text-2xl font-semibold text-white mb-2">Create Transcribe</h1>
          <p className="text-sm text-[#9C8E80]">Transform your voice into organized knowledge</p>
        </div>
        <WaveformCanvas />
      </section>

      {/* Mobile Create button */}
      <div className="sm:hidden bg-[#1C1C1C] px-6 pb-4">
        <Link
          href="/capture"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#B8860B] hover:bg-[#8B6914] text-white text-sm font-medium transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Transcribe
        </Link>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-[#E8E0D5] mb-6">
          {(["transcribe", "starred", "trash"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "pb-3 text-sm font-medium capitalize transition-colors relative",
                activeTab === tab ? "text-[#B8860B]" : "text-[#9C8E80] hover:text-[#6B5B4F]",
              ].join(" ")}
            >
              {tab === "transcribe" ? "Transcribe" : tab === "starred" ? "Starred" : "Trash"}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8860B] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Search + Sort bar */}
        <div className="flex items-center gap-3 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8E80]"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5] text-[#1C1C1C] text-sm placeholder-[#9C8E80] focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-all"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-[#E8E0D5] text-[#6B5B4F] text-sm hover:border-[#B8860B] transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "A–Z"}
            </button>

            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-[#E8E0D5] py-1 z-10">
                {(["newest", "oldest", "alpha"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSortBy(s);
                      setSortOpen(false);
                    }}
                    className={[
                      "w-full px-3 py-2 text-left text-sm transition-colors",
                      sortBy === s
                        ? "text-[#B8860B] font-medium bg-[#B8860B]/5"
                        : "text-[#6B5B4F] hover:bg-[#FAF7F2]",
                    ].join(" ")}
                  >
                    {s === "newest" ? "Newest" : s === "oldest" ? "Oldest" : "A–Z"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Items list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F5EFE6] flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B8860B"
                strokeWidth="1.5"
              >
                <path d="M9 12h6M9 16h6M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
              </svg>
            </div>
            <p className="text-[#6B5B4F] mb-2 text-sm">
              {activeTab === "transcribe"
                ? searchQuery
                  ? "No results found"
                  : "No transcribes yet"
                : activeTab === "starred"
                  ? "No starred items"
                  : "Trash is empty"}
            </p>
            {activeTab === "transcribe" && !searchQuery && (
              <Link
                href="/capture"
                className="mt-2 text-sm text-[#B8860B] hover:underline font-medium"
              >
                Create your first transcribe
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <KnowledgeItemCard key={item.id} item={item} onClick={handleItemClick} />
            ))}
          </div>
        )}
      </main>

      {/* Detail modal */}
      {viewingItem && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingItem(null)}
        >
          <div
            className="bg-[#FAF7F2] rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between p-6 border-b border-[#E8E0D5]">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg font-semibold text-[#1C1C1C] mb-2 leading-snug">
                  {viewingItem.title}
                </h2>
                <span className="inline-block text-xs text-[#B8860B] bg-[#B8860B]/10 px-2 py-0.5 rounded-full">
                  {viewingItem.domain}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[#9C8E80] hover:text-[#1C1C1C] hover:bg-[#F5EFE6] transition-colors"
                aria-label="Close"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p
                className="text-sm text-[#6B5B4F] leading-relaxed mb-4"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {viewingItem.content ?? viewingItem.contentPreview}
              </p>

              {/* Tags */}
              {viewingItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {viewingItem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-[#F5EFE6] text-[#6B5B4F] px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Dates */}
              <div className="flex flex-wrap gap-4 text-xs text-[#9C8E80] border-t border-[#E8E0D5] pt-4">
                <span>
                  Created{" "}
                  {new Date(viewingItem.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>
                  Next review{" "}
                  {new Date(viewingItem.nextReviewAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span>{viewingItem.reviewCount} reviews</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-[#E8E0D5] flex gap-3">
              <Link
                href="/review"
                className="flex-1 py-2.5 rounded-xl bg-[#2C2C2C] hover:bg-[#1C1C1C] text-white text-sm font-medium text-center transition-colors"
              >
                Start Review
              </Link>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-4 py-2.5 rounded-xl border border-[#D4C4B0] text-[#6B5B4F] text-sm hover:bg-[#F5EFE6] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
