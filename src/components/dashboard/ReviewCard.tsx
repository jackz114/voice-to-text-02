// src/components/dashboard/ReviewCard.tsx
"use client";

import { useState } from "react";

interface ReviewCardProps {
  item: {
    itemId: string;
    title: string;
    content: string;
  };
  currentIndex: number;
  total: number;
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  onExit: () => void;
}

export function ReviewCard({ item, currentIndex, total, onRate, onExit }: ReviewCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    setShowAnswer(false);
    onRate(rating);
  };

  return (
    <div className="min-h-screen bg-[#1C1C1C] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-[#B8860B] text-sm flex items-center gap-1 hover:underline"
        >
          ← 返回
        </button>
        <span className="text-[#888] text-sm">
          {currentIndex + 1}/{total}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6">
        <div className="max-w-lg w-full text-center">
          {/* Question */}
          <div className="mb-8">
            <p className="text-white text-2xl font-medium leading-relaxed">
              {item.title}
            </p>
          </div>

          {/* Answer or Show Answer Button */}
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="px-8 py-3 bg-[#B8860B] hover:bg-[#8B6914] text-white rounded-full font-medium transition-colors"
            >
              显示答案
            </button>
          ) : (
            <div className="bg-[#2A2A2A] rounded-xl p-6 text-left">
              <p className="text-[#E0E0E0] text-lg leading-relaxed whitespace-pre-wrap">
                {item.content}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rating Buttons */}
      {showAnswer && (
        <div className="px-6 py-8">
          <div className="flex justify-center gap-3">
            <button
              onClick={() => handleRate(1)}
              className="px-6 py-3 rounded-full bg-[#fee] text-[#c00] font-medium hover:opacity-80 transition-opacity"
            >
              Again
            </button>
            <button
              onClick={() => handleRate(2)}
              className="px-6 py-3 rounded-full bg-[#ffd] text-[#a70] font-medium hover:opacity-80 transition-opacity"
            >
              Hard
            </button>
            <button
              onClick={() => handleRate(3)}
              className="px-6 py-3 rounded-full bg-[#dfd] text-[#060] font-medium hover:opacity-80 transition-opacity"
            >
              Good
            </button>
            <button
              onClick={() => handleRate(4)}
              className="px-6 py-3 rounded-full bg-[#dff] text-[#069] font-medium hover:opacity-80 transition-opacity"
            >
              Easy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}