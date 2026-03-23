"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/components/auth/AuthProvider";
import { DomainSidebar } from "@/components/library/DomainSidebar";
import { KnowledgeItemCard } from "@/components/library/KnowledgeItemCard";
import type { KnowledgeItem } from "@/components/library/KnowledgeItemCard";
import Link from "next/link";

// Re-export for consumers
export type { KnowledgeItem };

// Full item returned when viewing detail — extends KnowledgeItem with full content
interface KnowledgeItemDetail extends KnowledgeItem {
  content?: string;
}

export function KnowledgeLibrary() {
  const { user } = useAuth();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [viewingItem, setViewingItem] = useState<KnowledgeItemDetail | null>(null);

  const fetchItems = async (domain?: string) => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const url = `/api/library/list${domain ? `?domain=${encodeURIComponent(domain)}` : ""}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError("请先登录");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError("加载失败，请重试");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setItems(data.items ?? []);
    } catch {
      setError("加载失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchItems(selectedDomain ?? undefined);
    }
  }, [selectedDomain, user]);

  const handleDelete = async (id: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const response = await fetch("/api/library/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        alert("删除失败");
        return;
      }

      // Refetch items after successful delete
      await fetchItems(selectedDomain ?? undefined);
    } catch {
      alert("删除失败");
    }
  };

  const handleItemClick = (item: KnowledgeItem) => {
    setViewingItem(item);
  };

  // Compute domains and counts from all items (always from full list)
  const allDomains = Array.from(new Set(items.map((i) => i.domain)));
  const itemCounts: Record<string, number> = {};
  for (const item of items) {
    itemCounts[item.domain] = (itemCounts[item.domain] ?? 0) + 1;
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)]">
      {/* Left sidebar */}
      <aside className="w-64 border-r p-4 hidden md:block">
        <DomainSidebar
          domains={allDomains}
          selectedDomain={selectedDomain}
          onSelect={setSelectedDomain}
          itemCounts={itemCounts}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">知识库</h1>
            {!loading && (
              <span className="text-sm text-gray-500">{items.length} 条</span>
            )}
          </div>
          {/* View mode toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={[
                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                viewMode === "list"
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
              ].join(" ")}
            >
              列表
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={[
                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                viewMode === "grid"
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
              ].join(" ")}
            >
              卡片
            </button>
          </div>
        </div>

        {/* Content area */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div
              className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
              aria-hidden="true"
            />
            <span className="ml-3 text-gray-500 text-sm">加载中…</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-500 mb-4">暂无知识条目，去添加一些吧</p>
            <a
              href="/capture"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              去捕获知识
            </a>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {items.map((item) => (
              <KnowledgeItemCard
                key={item.id}
                item={item}
                viewMode={viewMode}
                onDelete={handleDelete}
                onClick={handleItemClick}
              />
            ))}
          </div>
        )}
      </main>

      {/* Detail modal */}
      {viewingItem && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => setViewingItem(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {viewingItem.title}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {viewingItem.domain}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none shrink-0"
                aria-label="关闭"
              >
                &times;
              </button>
            </div>

            {/* Full content */}
            <div className="mb-4">
              <p
                className="text-gray-700 dark:text-gray-300 leading-relaxed"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {viewingItem.content ?? viewingItem.contentPreview}
              </p>
            </div>

            {/* Tags */}
            {viewingItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {viewingItem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Source link */}
            {viewingItem.source && (
              <div className="mb-4">
                <a
                  href={viewingItem.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm break-all"
                >
                  {viewingItem.source}
                </a>
              </div>
            )}

            {/* Dates */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 border-t pt-4">
              <span>
                创建时间：{new Date(viewingItem.createdAt).toLocaleDateString("zh-CN")}
              </span>
              <span>
                下次复习：{new Date(viewingItem.nextReviewAt).toLocaleDateString("zh-CN")}
              </span>
              <span>已复习 {viewingItem.reviewCount} 次</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-6">
              <div className="flex gap-3">
                <Link
                  href="/review"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-center hover:bg-blue-600 transition-colors"
                >
                  🔄 去复习
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const {
                        data: { session },
                      } = await supabase.auth.getSession();
                      const token = session?.access_token ?? "";

                      const response = await fetch("/api/review/rate", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: token ? `Bearer ${token}` : "",
                        },
                        body: JSON.stringify({
                          knowledgeItemId: viewingItem.id,
                          rating: 3, // "Good" rating
                        }),
                      });

                      if (!response.ok) {
                        alert("标记失败，请重试");
                        return;
                      }

                      // Close modal and refresh items to show updated review count
                      setViewingItem(null);
                      await fetchItems(selectedDomain ?? undefined);
                    } catch {
                      alert("标记失败，请重试");
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  ✅ 标记为已复习
                </button>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
