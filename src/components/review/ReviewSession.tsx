"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/components/auth/AuthProvider";
import { ReviewCard } from "@/components/review/ReviewCard";
import { RatingButtons } from "@/components/review/RatingButtons";
import Link from "next/link";
import type { ReviewItem } from "@/components/review/ReviewCard";

export function ReviewSession() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consecutiveEasyCount, setConsecutiveEasyCount] = useState(0);
  const [lastRatedItem, setLastRatedItem] = useState<{ itemId: string; rating: number } | null>(
    null
  );
  const [undoTimeoutId, setUndoTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showUndoBar, setShowUndoBar] = useState(false);
  const [showEasyNudge, setShowEasyNudge] = useState(false);
  const tokenRef = useRef<string | undefined>(undefined);

  // 获取 access token 并加载待复习条目
  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        tokenRef.current = session?.access_token;
        await fetchDueItems(session?.access_token);
      } catch (err) {
        console.error("初始化复习会话失败:", err);
        setError("加载失败，请刷新重试。");
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchDueItems = async (token: string | undefined) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/review/today", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "加载失败，请刷新重试。");
        return;
      }
      const data = await response.json();
      setItems(data.items ?? []);
      setCurrentIndex(0);
    } catch (err) {
      console.error("加载待复习条目失败:", err);
      setError("加载失败，请检查网络后重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (itemId: string, rating: 1 | 2 | 3 | 4) => {
    // 步骤 1: 乐观更新 UI（先移除卡片，避免等待 API）
    setCurrentIndex((prev) => prev + 1);

    // 步骤 2: Anti-cheat nudge（FSRS-03 decision）
    if (rating === 4) {
      const newCount = consecutiveEasyCount + 1;
      setConsecutiveEasyCount(newCount);
      if (newCount > 0 && newCount % 5 === 0) {
        setShowEasyNudge(true);
        setTimeout(() => setShowEasyNudge(false), 4000);
      }
    } else {
      setConsecutiveEasyCount(0);
    }

    // 步骤 3: 设置撤销窗口（FSRS-04 decision，1 分钟）
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
    }
    setLastRatedItem({ itemId, rating });
    setShowUndoBar(true);
    const tid = setTimeout(() => {
      setShowUndoBar(false);
      setLastRatedItem(null);
    }, 60000); // 1 minute
    setUndoTimeoutId(tid);

    // 步骤 4: POST to API
    try {
      await fetch("/api/review/rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
        },
        body: JSON.stringify({ knowledgeItemId: itemId, rating }),
      });
    } catch (err) {
      console.error("评分提交失败:", err);
    }
  };

  const handleUndo = async (correctedRating: 1 | 2 | 3 | 4) => {
    if (!lastRatedItem) return;

    const { itemId } = lastRatedItem;

    // 清除撤销状态
    setShowUndoBar(false);
    setLastRatedItem(null);
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
      setUndoTimeoutId(null);
    }

    // 用修正后的评分重新提交
    try {
      await fetch("/api/review/rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
        },
        body: JSON.stringify({ knowledgeItemId: itemId, rating: correctedRating }),
      });
    } catch (err) {
      console.error("撤销评分失败:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => fetchDueItems(tokenRef.current)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  // 所有卡片已复习 — 完成界面
  if (items.length === 0 || currentIndex >= items.length) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">今日复习完成！</h2>
        <p className="text-gray-600 mb-6">
          {items.length > 0
            ? `已完成 ${items.length} 个知识条目的复习`
            : "今日暂无待复习的知识条目"}
        </p>
        <Link
          href="/library"
          className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          返回知识库
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh]">
      {/* 撤销栏 — 浮层顶部 */}
      {showUndoBar && lastRatedItem && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white rounded-lg p-3 flex flex-col gap-2 z-50 max-w-xs shadow-xl">
          <span className="text-sm font-medium">刚才评错了？选择正确评分：</span>
          <RatingButtons onRate={handleUndo} disabled={false} />
        </div>
      )}

      {/* Anti-cheat nudge */}
      {showEasyNudge && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800 z-50 max-w-xs shadow-md">
          真的这么轻松吗？如果下次忘了，进度会重置哦。
        </div>
      )}

      {/* 进度指示器 */}
      <p className="text-gray-500 text-sm mb-4">
        {currentIndex} / {items.length} 已完成
      </p>

      {/* 卡片堆叠 — 渲染顶部最多 3 张 */}
      <div className="relative w-full max-w-md h-[400px]">
        {items
          .slice(currentIndex, currentIndex + 3)
          .reverse()
          .map((item, i) => {
            const visibleCount = Math.min(3, items.length - currentIndex);
            const isTopCard = i === visibleCount - 1;
            const cardStackIndex = visibleCount - 1 - i;
            return (
              <ReviewCard
                key={item.itemId}
                item={item}
                isTop={isTopCard}
                onRate={handleRate}
                stackIndex={cardStackIndex}
              />
            );
          })}
      </div>
    </div>
  );
}
