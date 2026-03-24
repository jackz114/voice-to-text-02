"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { RatingButtons } from "@/components/review/RatingButtons";

interface ReviewItem {
  itemId: string;
  title: string;
  content: string;
  domain: string;
  source: string | null;
  tags: string[];
  reviewStateId: string;
  nextReviewAt: string;
  stability: number;
  difficulty: number;
  reviewCount: number;
}

interface ReviewCardProps {
  item: ReviewItem;
  isTop: boolean; // only the top card is interactive
  onRate: (itemId: string, rating: 1 | 2 | 3 | 4) => void;
  stackIndex: number; // 0=top, 1=second, etc. Used for visual stacking offset
}

export function ReviewCard({ item, isTop, onRate, stackIndex }: ReviewCardProps) {
  const [revealed, setRevealed] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const controls = useAnimation();

  // 视觉堆叠效果（非顶部卡片轻微偏移和缩放）
  const stackOffset = stackIndex * 4; // px offset per card in stack
  const stackScale = 1 - stackIndex * 0.02; // slight scale reduction

  const handleDragEnd = (_event: unknown, info: { offset: { x: number; y: number } }) => {
    if (!isTop) return;
    if (info.offset.x > 100) {
      // 右滑 = Easy
      controls.start({ x: 500, opacity: 0 }).then(() => onRate(item.itemId, 4));
    } else if (info.offset.x < -100) {
      // 左滑 = Again
      controls.start({ x: -500, opacity: 0 }).then(() => onRate(item.itemId, 1));
    } else {
      controls.start({ x: 0 }); // 弹回中心
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, scale: stackScale, translateY: -stackOffset }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="absolute w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-6 cursor-grab active:cursor-grabbing select-none"
    >
      {/* 卡片头部：领域徽章 + 复习次数 */}
      <div className="flex items-center justify-between mb-2">
        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">
          {item.domain}
        </span>
        <span className="text-xs text-gray-400">第 {item.reviewCount} 次复习</span>
      </div>

      {/* 标题 */}
      <h2 className="text-xl font-bold text-center mt-4 mb-6">{item.title}</h2>

      {/* 内容区域 */}
      {!revealed ? (
        /* 未揭示状态 — 点击揭示内容按钮 */
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-gray-400 text-sm mb-2">先尝试回忆内容，再点击揭示</p>
          <p className="text-gray-400 text-xs mb-4">揭示后可评分</p>
          <button
            onClick={() => setRevealed(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            点击揭示内容
          </button>
        </div>
      ) : (
        /* 揭示状态 — 完整内容 + 评分按钮 */
        <div>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">{item.content}</p>

          {/* 标签 */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 来源链接 */}
          {item.source && (
            <p className="text-xs text-gray-400 mb-4 truncate">
              来源:{" "}
              <a
                href={item.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {item.source}
              </a>
            </p>
          )}

          {/* 评分按钮 */}
          <RatingButtons onRate={(r) => onRate(item.itemId, r)} disabled={!isTop} />

          {/* 滑动提示 */}
          {isTop && (
            <p className="text-xs text-gray-400 text-center mt-3">
              左滑 = 完全忘记 &nbsp;|&nbsp; 右滑 = 秒答且轻松
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export type { ReviewItem };
