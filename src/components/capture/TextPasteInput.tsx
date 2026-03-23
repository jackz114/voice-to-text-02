"use client";

import { useState } from "react";

interface TextPasteInputProps {
  onExtract: (text: string, sourceUrl?: string) => Promise<void>;
  isExtracting: boolean;
  disabled?: boolean;
}

const MIN_CHARS = 50;
const MAX_CHARS = 100_000;

export function TextPasteInput({ onExtract, isExtracting, disabled = false }: TextPasteInputProps) {
  const [text, setText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const isOverLimit = text.length > MAX_CHARS;
  const isTooShort = text.trim().length < MIN_CHARS;
  const isDisabled = disabled || isExtracting || isOverLimit || isTooShort;

  // 字符计数颜色 — 参考 UI-SPEC.md Interaction Contracts: Character Counter
  const ratio = text.length / MAX_CHARS;
  const counterColor =
    ratio >= 1 ? "text-red-600" : ratio >= 0.9 ? "text-amber-600" : "text-gray-400";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    await onExtract(text.trim(), sourceUrl.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 文本输入区 */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isExtracting || disabled}
          placeholder="粘贴你正在学习的文章内容……"
          rows={8}
          className="w-full min-h-[200px] resize-y px-4 py-4 text-base leading-relaxed text-gray-900 dark:text-gray-100 placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        />
        {/* 字符计数 — 用户开始输入后显示 */}
        {text.length > 0 && (
          <p className={`mt-1 text-right text-sm ${counterColor}`}>
            {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} 字符
            {isTooShort && ` — 至少需要 ${MIN_CHARS} 字符`}
            {isOverLimit && " — 已超出 100,000 字符限制"}
          </p>
        )}
      </div>

      {/* 可选来源网址输入 */}
      <input
        type="url"
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
        disabled={isExtracting || disabled}
        placeholder="来源网址（可选）"
        className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:opacity-60"
      />

      {/* 提取中进度提示 */}
      {isExtracting && (
        <p className="text-sm text-gray-400">AI 正在分析内容，通常需要 5-15 秒……</p>
      )}

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={isDisabled}
        className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors flex items-center justify-center gap-2"
      >
        {isExtracting ? (
          <>
            {/* 16px 旋转动画 spinner */}
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              aria-hidden="true"
            />
            正在提取…
          </>
        ) : (
          "提取知识"
        )}
      </button>
    </form>
  );
}
