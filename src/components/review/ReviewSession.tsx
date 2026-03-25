"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/components/auth/AuthProvider";
import { ReviewCard } from "@/components/review/ReviewCard";
import { RatingButtons } from "@/components/review/RatingButtons";
import Link from "next/link";
import type { ReviewItem } from "@/components/review/ReviewCard";

type ReviewMode = "scheduled" | "browse";

interface BrowseItem {
  id: string;
  title: string;
  content: string;
  domain: string;
  source: string | null;
  tags: string[];
  nextReviewAt: string;
  reviewCount: number;
}

export function ReviewSession() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [browseItems, setBrowseItems] = useState<BrowseItem[]>([]);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("scheduled");
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
  // Browse mode domain filter
  const [browseDomains, setBrowseDomains] = useState<string[]>([]);
  const [selectedBrowseDomain, setSelectedBrowseDomain] = useState<string | null>(null);
  const tokenRef = useRef<string | undefined>(undefined);

  // 获取 access token 并加载待复习条目
  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        tokenRef.current = session?.access_token;
        await fetchItems(session?.access_token);
        // Browse 模式下获取领域列表
        if (reviewMode === "browse") {
          await fetchBrowseDomains(session?.access_token);
        }
      } catch (err) {
        console.error("初始化复习会话失败:", err);
        setError("加载失败，请刷新重试。");
        setLoading(false);
      }
    };
    init();
  }, [reviewMode]);

  const fetchItems = async (token: string | undefined, domain?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      if (reviewMode === "scheduled") {
        const response = await fetch("/api/review/today", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({})) as { error?: string };
          setError(data.error ?? "加载失败，请刷新重试。");
          return;
        }
        const data = await response.json() as { items?: ReviewItem[] };
        setItems(data.items ?? []);
      } else {
        // Browse mode: fetch all items from library with optional domain filter
        const url = domain
          ? `/api/library/list?domain=${encodeURIComponent(domain)}`
          : "/api/library/list";
        const response = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({})) as { error?: string };
          setError(data.error ?? "加载失败，请刷新重试。");
          return;
        }
        const data = await response.json() as { items?: BrowseItem[] };
        setBrowseItems(data.items ?? []);
      }
      setCurrentIndex(0);
    } catch (err) {
      console.error("加载待复习条目失败:", err);
      setError("加载失败，请检查网络后重试。");
    } finally {
      setLoading(false);
    }
  };

  // Browse mode: fetch all domains for filter dropdown
  const fetchBrowseDomains = async (token: string | undefined) => {
    try {
      const response = await fetch("/api/library/domains", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        console.error("获取领域列表失败");
        return;
      }
      const data = await response.json() as { domains?: string[] };
      setBrowseDomains(data.domains ?? []);
    } catch (err) {
      console.error("获取领域列表失败:", err);
    }
  };

  // Handle domain selection in browse mode
  const handleDomainChange = async (domain: string | null) => {
    setSelectedBrowseDomain(domain);
    await fetchItems(tokenRef.current, domain);
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

  // Browse mode: simple next card without rating
  const handleBrowseNext = () => {
    setCurrentIndex((prev) => prev + 1);
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
          onClick={() => fetchItems(tokenRef.current)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  // Empty state for scheduled mode - with browse mode option
  if (reviewMode === "scheduled" && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold">今日复习已完成！</h2>
        <p className="text-gray-500">
          今天没有需要复习的知识条目，明天再来吧～
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setReviewMode("browse")}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            📚 主动复习（浏览全部）
          </button>
          <Link
            href="/library"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            去知识库
          </Link>
        </div>
      </div>
    );
  }

  // All cards reviewed in scheduled mode
  if (reviewMode === "scheduled" && currentIndex >= items.length) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">今日复习完成！</h2>
        <p className="text-gray-600 mb-6">
          {`已完成 ${items.length} 个知识条目的复习`}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setReviewMode("browse")}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            📚 继续主动复习
          </button>
          <Link
            href="/library"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            返回知识库
          </Link>
        </div>
      </div>
    );
  }

  // All cards browsed in browse mode
  if (reviewMode === "browse" && currentIndex >= browseItems.length) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">📚</div>
        <h2 className="text-2xl font-bold mb-2">已浏览全部知识！</h2>
        <p className="text-gray-600 mb-6">
          {`已完成 ${browseItems.length} 个知识条目的浏览`}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setCurrentIndex(0);
              fetchItems(tokenRef.current);
            }}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            🔄 重新浏览
          </button>
          <button
            onClick={() => setReviewMode("scheduled")}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            返回今日复习
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh]">
      {/* Browse mode indicator */}
      {reviewMode === "browse" && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex flex-col gap-3 w-full max-w-md">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-800 dark:text-blue-300">
              📚 主动复习模式
            </span>
            <button
              onClick={() => setReviewMode("scheduled")}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              返回今日复习
            </button>
          </div>
          {/* Domain filter dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-blue-700 dark:text-blue-400 whitespace-nowrap">
              选择领域:
            </label>
            <select
              value={selectedBrowseDomain ?? ""}
              onChange={(e) => handleDomainChange(e.target.value || null)}
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部领域</option>
              {browseDomains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 撤销栏 — 浮层顶部 */}
      {showUndoBar && lastRatedItem && reviewMode === "scheduled" && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white rounded-lg p-3 flex flex-col gap-2 z-50 max-w-xs shadow-xl">
          <span className="text-sm font-medium">刚才评错了？选择正确评分：</span>
          <RatingButtons onRate={handleUndo} disabled={false} />
        </div>
      )}

      {/* Anti-cheat nudge */}
      {showEasyNudge && reviewMode === "scheduled" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800 z-50 max-w-xs shadow-md">
          真的这么轻松吗？如果下次忘了，进度会重置哦。
        </div>
      )}

      {/* 进度指示器 */}
      <p className="text-gray-500 text-sm mb-4">
        {currentIndex} / {reviewMode === "scheduled" ? items.length : browseItems.length} 已完成
      </p>

      {/* 卡片区域 */}
      <div className="relative w-full max-w-md h-[400px]">
        {reviewMode === "scheduled" ? (
          // Scheduled mode: use ReviewCard with swipe and rating
          items
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
            })
        ) : (
          // Browse mode: simplified card without FSRS rating
          browseItems
            .slice(currentIndex, currentIndex + 3)
            .reverse()
            .map((item, i) => {
              const visibleCount = Math.min(3, browseItems.length - currentIndex);
              const isTopCard = i === visibleCount - 1;
              const cardStackIndex = visibleCount - 1 - i;
              return (
                <BrowseCard
                  key={item.id}
                  item={item}
                  isTop={isTopCard}
                  onNext={handleBrowseNext}
                  onRate={handleRate}
                  stackIndex={cardStackIndex}
                />
              );
            })
        )}
      </div>
    </div>
  );
}

// Simplified browse card with optional FSRS rating
interface BrowseCardProps {
  item: BrowseItem;
  isTop: boolean;
  onNext: () => void;
  onRate: (itemId: string, rating: 1 | 2 | 3 | 4) => void;
  stackIndex: number;
}

function BrowseCard({ item, isTop, onNext, onRate, stackIndex }: BrowseCardProps) {
  const [revealed, setRevealed] = useState(false);

  const stackOffset = stackIndex * 4;
  const stackScale = 1 - stackIndex * 0.02;

  // 处理评分并进入下一张
  const handleRateAndNext = (rating: 1 | 2 | 3 | 4) => {
    onRate(item.id, rating);
    // 注意：onRate 内部会处理卡片切换，不需要再调用 onNext
  };

  return (
    <div
      className="absolute w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 select-none transition-transform"
      style={{
        transform: `scale(${stackScale}) translateY(${-stackOffset}px)`,
        zIndex: 10 - stackIndex,
        opacity: isTop ? 1 : 0.7,
      }}
    >
      {/* 卡片头部：领域徽章 + 复习次数 */}
      <div className="flex items-center justify-between mb-2">
        <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium px-2 py-1 rounded-full">
          {item.domain}
        </span>
        <span className="text-xs text-gray-400">第 {item.reviewCount} 次复习</span>
      </div>

      {/* 标题 */}
      <h2 className="text-xl font-bold text-center mt-4 mb-6 text-gray-900 dark:text-white">
        {item.title}
      </h2>

      {/* 内容区域 */}
      {!revealed ? (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">先尝试回忆内容，再点击揭示</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mb-4">揭示后可评分</p>
          <button
            onClick={() => setRevealed(true)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            点击揭示内容
          </button>
        </div>
      ) : (
        <div>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mb-4">
            {item.content}
          </p>

          {/* 标签 */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full"
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
                className="text-blue-500 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {item.source}
              </a>
            </p>
          )}

          {/* 评分按钮 - Browse 模式下也可以评分 */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 text-center">掌握程度如何？</p>
            <RatingButtons onRate={handleRateAndNext} disabled={!isTop} />
          </div>

          {/* 或者仅浏览下一张 */}
          <button
            onClick={onNext}
            disabled={!isTop}
            className="w-full mt-3 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            仅浏览，不评分 →
          </button>
        </div>
      )}
    </div>
  );
}
