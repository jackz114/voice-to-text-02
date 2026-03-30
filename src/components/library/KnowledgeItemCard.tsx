"use client";

import { useState } from "react";

export interface KnowledgeItem {
  id: string;
  title: string;
  domain: string;
  source: string | null;
  tags: string[];
  createdAt: string;
  nextReviewAt: string;
  reviewCount: number;
  contentPreview: string;
}

interface KnowledgeItemCardProps {
  item: KnowledgeItem;
  onClick: (item: KnowledgeItem) => void;
  onDelete?: (id: string) => void;
}

// 固定的波形数据，用于 SSR 稳定渲染
const waveHeights = [
  0.3, 0.5, 0.4, 0.6, 0.8, 0.7, 0.9, 0.6, 0.5, 0.7,
  0.4, 0.6, 0.8, 0.5, 0.3, 0.6, 0.7, 0.9, 0.5, 0.4,
  0.6, 0.8, 0.5, 0.7, 0.4, 0.6, 0.8, 0.3, 0.5, 0.7,
  0.9, 0.6, 0.4, 0.8, 0.5, 0.6, 0.7, 0.3, 0.5, 0.4,
];

export function KnowledgeItemCard({ item, onClick, onDelete }: KnowledgeItemCardProps) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  return (
    <div
      className="relative flex items-center gap-4 p-4 bg-[#2C2C2C] rounded-xl hover:bg-[#383838] transition-colors cursor-pointer group"
      onClick={() => onClick(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left: Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white text-sm truncate">{item.title}</span>
          <span className="shrink-0 text-xs text-[#B8860B] bg-[#B8860B]/10 px-2 py-0.5 rounded-full">
            {item.domain}
          </span>
        </div>
        <p className="text-xs text-[#9C8E80] truncate">{item.contentPreview}</p>
      </div>

      {/* Mini waveform visual */}
      <div className="hidden sm:flex items-center gap-px w-24 h-8 shrink-0">
        {waveHeights.slice(0, 20).map((h, i) => (
          <div
            key={i}
            className="w-1 bg-[#B8860B]/40 rounded-full"
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>

      {/* Right: Date + Menu */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-[#9C8E80] hidden sm:block">{formattedDate}</span>

        {/* 3-dot menu */}
        <div className="relative">
          <button
            type="button"
            onClick={handleMenuClick}
            className={[
              "w-8 h-8 flex items-center justify-center rounded-lg text-[#9C8E80] hover:text-white hover:bg-white/10 transition-colors",
              hovered ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            ].join(" ")}
            aria-label="更多操作"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-36 bg-[#3C3C3C] rounded-xl shadow-lg border border-[#4C4C4C] py-1 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                onClick={() => {
                  setMenuOpen(false);
                  onClick(item);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                查看
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-[#B8860B] hover:bg-white/10 flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                标为星标
              </button>
              <div className="border-t border-[#4C4C4C] my-1" />
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(item.id);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                删除
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
