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
  viewMode: "list" | "grid";
  onDelete: (id: string) => void;
  onClick: (item: KnowledgeItem) => void;
}

export function KnowledgeItemCard({ item, viewMode, onDelete, onClick }: KnowledgeItemCardProps) {
  const [hovered, setHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("确定要删除这条知识吗？")) {
      onDelete(item.id);
    }
  };

  const formattedNextReview = new Date(item.nextReviewAt).toLocaleDateString("zh-CN");

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 group"
        onClick={() => onClick(item)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Left side */}
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {item.title}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
              {item.domain}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {item.contentPreview}
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">下次复习</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formattedNextReview}</p>
          </div>
          {item.reviewCount > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded-full">
              ×{item.reviewCount}
            </span>
          )}
          {/* Delete button — visible on hover (web) or always visible on touch */}
          <button
            type="button"
            onClick={handleDelete}
            className={[
              "text-red-600 hover:text-red-800 text-sm transition-opacity",
              hovered ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            ].join(" ")}
            aria-label="删除"
          >
            删除
          </button>
        </div>
      </div>
    );
  }

  // Grid mode
  return (
    <div
      className="relative p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
      onClick={() => onClick(item)}
    >
      {/* Delete button in top-right corner for grid mode */}
      <button
        type="button"
        onClick={handleDelete}
        className="absolute top-2 right-2 text-xs text-red-600 hover:text-red-800 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
        aria-label="删除"
      >
        删除
      </button>

      {/* Domain badge */}
      <div className="mb-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          {item.domain}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 leading-snug">
        {item.title}
      </h3>

      {/* Content preview */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {item.contentPreview}
      </p>

      {/* Bottom: review date and count */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formattedNextReview}</span>
        {item.reviewCount > 0 && (
          <span className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded-full">
            ×{item.reviewCount}
          </span>
        )}
      </div>
    </div>
  );
}
