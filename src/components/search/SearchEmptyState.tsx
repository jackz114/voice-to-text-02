"use client";

import { useRouter } from "next/navigation";
import { Search, Lightbulb, Plus, Sparkles } from "lucide-react";

interface SearchEmptyStateProps {
  query: string;
  suggestions?: string[];
  onClearFilters?: () => void;
}

export function SearchEmptyState({
  query,
  suggestions = ["React", "TypeScript", "机器学习", "设计模式"],
  onClearFilters,
}: SearchEmptyStateProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center py-12 text-center">
      {/* Icon */}
      <div className="mb-6 rounded-full bg-gray-100 p-6">
        <Search className="h-10 w-10 text-gray-400" />
      </div>

      {/* Main message */}
      <h3 className="mb-2 text-xl font-semibold text-gray-900">
        没找到关于 &quot;{query}&quot; 的确切匹配
      </h3>

      {/* Sub message */}
      <p className="mb-8 max-w-md text-gray-600">
        试试调整搜索词，或探索以下建议
      </p>

      {/* Actionable suggestions */}
      <div className="mb-8 space-y-4">
        <div className="flex items-start gap-3 text-left">
          <Lightbulb className="mt-0.5 h-5 w-5 text-amber-500" />
          <div>
            <p className="font-medium text-gray-900">搜索建议</p>
            <ul className="mt-1 space-y-1 text-sm text-gray-600">
              <li>• 试试更简单的关键词</li>
              <li>• 检查拼写或尝试同义词</li>
              <li>• 使用更通用的术语</li>
            </ul>
          </div>
        </div>

        {onClearFilters && (
          <div className="flex items-start gap-3 text-left">
            <Sparkles className="mt-0.5 h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium text-gray-900">筛选条件</p>
              <button
                onClick={onClearFilters}
                className="mt-1 text-sm text-blue-600 hover:underline"
              >
                清除所有筛选条件
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alternative paths */}
      <div className="w-full max-w-md">
        <p className="mb-3 text-sm font-medium text-gray-700">热门标签</p>
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {suggestions.map((tag) => (
            <button
              key={tag}
              onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
