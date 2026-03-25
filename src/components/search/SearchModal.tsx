// src/components/search/SearchModal.tsx
// Global search modal with cmdk (D-04, D-13, D-14)

"use client";

import { useState, useEffect, useCallback } from "react";
import { Command } from "cmdk";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/navigation";
import { Search, Clock, X, Loader2 } from "lucide-react";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useCommandMenu } from "@/hooks/useCommandMenu";
import { SearchResult } from "@/lib/search";

interface SearchModalProps {
  onSelectResult?: (result: SearchResult) => void;
}

export function SearchModal({ onSelectResult }: SearchModalProps) {
  const { open, setOpen } = useCommandMenu();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { history, addToHistory, removeFromHistory } = useSearchHistory();

  // Debounce search input (300ms per D-14)
  const [debouncedQuery] = useDebounce(query, 300);

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Search failed");
        }
        return res.json();
      })
      .then((data) => {
        setResults(data.results || []);
      })
      .catch((err) => {
        setError(err.message);
        setResults([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [debouncedQuery]);

  // Handle result selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      addToHistory(debouncedQuery);
      setOpen(false);

      if (onSelectResult) {
        onSelectResult(result);
      } else {
        // Default: navigate to library with highlight
        router.push(`/library?highlight=${result.id}`);
      }
    },
    [addToHistory, debouncedQuery, onSelectResult, router, setOpen]
  );

  // Handle "view all" selection
  const handleViewAll = useCallback(() => {
    addToHistory(debouncedQuery);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(debouncedQuery)}`);
  }, [addToHistory, debouncedQuery, router, setOpen]);

  // Handle history item selection
  const handleHistorySelect = useCallback(
    (historyQuery: string) => {
      setQuery(historyQuery);
    },
    [setQuery]
  );

  // Show history when query is empty and there is history
  const showHistory = query.length === 0 && history.length > 0;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
    >
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
        {/* Search input */}
        <div className="flex items-center border-b border-gray-100 px-4">
          <Search className="h-5 w-5 text-gray-400" />
          <Command.Input
            placeholder="搜索知识库... (Cmd+K)"
            value={query}
            onValueChange={setQuery}
            className="flex-1 border-0 bg-transparent px-4 py-4 text-base outline-none placeholder:text-gray-400"
          />
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          ) : null}
          <kbd className="ml-2 hidden rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results area */}
        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              搜索中...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">
              <p>{error}</p>
            </div>
          ) : showHistory ? (
            <Command.Group heading="搜索历史">
              {history.map((item) => (
                <Command.Item
                  key={item}
                  value={`history:${item}`}
                  onSelect={() => handleHistorySelect(item)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <Clock className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item);
                    }}
                    className="rounded p-1 opacity-0 hover:bg-gray-200 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                </Command.Item>
              ))}
            </Command.Group>
          ) : query.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p>输入关键词开始搜索</p>
              <p className="mt-1 text-sm text-gray-400">
                支持标题、内容、标签、来源搜索
              </p>
            </div>
          ) : results.length === 0 ? (
            <Command.Empty>
              <div className="py-8 text-center">
                <p className="text-gray-600">
                  没找到关于 &quot;{debouncedQuery}&quot; 的确切匹配
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  试试更简单的关键词，或检查拼写
                </p>
              </div>
            </Command.Empty>
          ) : (
            <Command.Group heading="搜索结果">
              {results.map((result) => (
                <Command.Item
                  key={result.id}
                  value={result.id}
                  onSelect={() => handleSelect(result)}
                  className="group rounded-lg px-3 py-3 hover:bg-gray-100"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {result.title}
                      </h4>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        {result.domain}
                      </span>
                    </div>
                    <p
                      className="line-clamp-2 text-sm text-gray-600"
                      dangerouslySetInnerHTML={{ __html: result.excerpt }}
                    />
                    {result.tags.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {result.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-gray-500"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* View all results link */}
          {results.length > 0 && !loading ? (
            <Command.Item
              value="view-all"
              onSelect={handleViewAll}
              className="mt-2 rounded-lg border-t border-gray-100 px-3 py-3 text-center text-blue-600 hover:bg-blue-50"
            >
              查看全部 {results.length >= 5 ? "结果" : `${results.length} 条结果`} →
            </Command.Item>
          ) : null}
        </Command.List>

        {/* Footer with keyboard shortcuts */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5">
                ↑↓
              </kbd>
              导航
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5">
                ↵
              </kbd>
              打开
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5">
              ESC
            </kbd>
            关闭
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}
