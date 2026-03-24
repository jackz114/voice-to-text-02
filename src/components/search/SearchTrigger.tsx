// src/components/search/SearchTrigger.tsx
// Visible search trigger button (D-04)

"use client";

import { Search } from "lucide-react";
import { useCommandMenu } from "@/hooks/useCommandMenu";

interface SearchTriggerProps {
  variant?: "icon" | "button" | "input";
  className?: string;
}

export function SearchTrigger({
  variant = "button",
  className = "",
}: SearchTriggerProps) {
  const { toggle } = useCommandMenu();

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        className={`rounded-lg p-2 text-gray-600 hover:bg-gray-100 ${className}`}
        aria-label="搜索"
      >
        <Search className="h-5 w-5" />
      </button>
    );
  }

  if (variant === "input") {
    return (
      <button
        onClick={toggle}
        className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-gray-500 hover:border-gray-300 hover:bg-gray-50 ${className}`}
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-sm">搜索...</span>
        <kbd className="hidden rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 sm:inline-block">
          Cmd+K
        </kbd>
      </button>
    );
  }

  // Default button variant
  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 ${className}`}
    >
      <Search className="h-4 w-4" />
      <span>搜索</span>
      <kbd className="ml-2 hidden rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-500 sm:inline-block">
        Cmd+K
      </kbd>
    </button>
  );
}
