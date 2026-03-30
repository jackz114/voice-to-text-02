// src/components/dashboard/ReviewSession.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ReviewCard } from "./ReviewCard";

interface ReviewItem {
  itemId: string;
  title: string;
  content: string;
  reviewStateId: string;
}

interface ReviewSessionProps {
  folderId?: string;
  onComplete: () => void;
  onExit: () => void;
}

export function ReviewSession({ folderId, onComplete, onExit }: ReviewSessionProps) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDueItems();
  }, [folderId]);

  const fetchDueItems = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const url = folderId
        ? `/api/review/due?folder=${folderId}`
        : "/api/review/due";

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("获取失败");

      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("获取待复习笔记失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (rating: 1 | 2 | 3 | 4) => {
    if (currentIndex >= items.length) return;

    const currentItem = items[currentIndex];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const response = await fetch("/api/review/rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          knowledgeItemId: currentItem.itemId,
          rating,
        }),
      });

      if (!response.ok) throw new Error("评分失败");

      // Move to next item
      if (currentIndex + 1 >= items.length) {
        onComplete();
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error("提交评分失败:", error);
      alert("提交评分失败，请重试");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="1.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-[#1C1C1C] text-xl font-semibold mb-2">今日复习完成！</h2>
        <p className="text-[#6B5B4F] mb-6">没有更多待复习的笔记了</p>
        <button
          onClick={onExit}
          className="px-6 py-3 bg-[#B8860B] hover:bg-[#8B6914] text-white rounded-full font-medium transition-colors"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <ReviewCard
      item={items[currentIndex]}
      currentIndex={currentIndex}
      total={items.length}
      onRate={handleRate}
      onExit={onExit}
    />
  );
}