"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import { useDebounce } from "use-debounce";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchEmptyState } from "@/components/search/SearchEmptyState";
import { DomainFilter } from "@/components/search/DomainFilter";
import { SearchResponse } from "@/app/api/search/route";

const RESULTS_PER_PAGE = 10;

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params
  const initialQuery = searchParams.get("q") || "";
  const initialDomain = searchParams.get("domain");
  const initialOffset = parseInt(searchParams.get("offset") || "0", 10);

  // State
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery] = useDebounce(query, 300);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(
    initialDomain
  );
  const [offset, setOffset] = useState(initialOffset);

  const [results, setResults] = useState<SearchResponse["results"]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch search results
  const performSearch = useCallback(async () => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        limit: RESULTS_PER_PAGE.toString(),
        offset: offset.toString(),
      });

      if (selectedDomain) {
        params.set("domain", selectedDomain);
      }

      const response = await fetch(`/api/search?${params}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Search failed");
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "搜索失败");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedDomain, offset]);

  // Trigger search when params change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (selectedDomain) params.set("domain", selectedDomain);
    if (offset > 0) params.set("offset", offset.toString());

    const newUrl = `/search${params.toString() ? `?${params}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }, [debouncedQuery, selectedDomain, offset]);

  const handleDomainChange = (domain: string | null) => {
    setSelectedDomain(domain);
    setOffset(0); // Reset to first page
  };

  const handleClearFilters = () => {
    setSelectedDomain(null);
    setOffset(0);
  };

  const hasMore = offset + results.length < total;
  const hasFilters = selectedDomain !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="mb-4 flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">搜索知识库</h1>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOffset(0);
                }}
                placeholder="输入关键词搜索..."
                className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-gray-400" />
              )}
            </div>

            <DomainFilter
              selectedDomain={selectedDomain}
              onDomainChange={handleDomainChange}
            />
          </div>

          {/* Results count */}
          {debouncedQuery.length >= 2 && !loading && (
            <div className="mt-3 text-sm text-gray-600">
              找到 {total} 个结果
              {selectedDomain && (
                <span className="ml-2">
                  (领域: <span className="font-medium">{selectedDomain}</span>)
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Results */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700">
            {error}
          </div>
        ) : debouncedQuery.length < 2 ? (
          <div className="py-12 text-center text-gray-500">
            <Search className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-lg">输入关键词开始搜索</p>
            <p className="mt-2 text-sm">支持标题、内容、标签、来源搜索</p>
          </div>
        ) : results.length === 0 && !loading ? (
          <SearchEmptyState
            query={debouncedQuery}
            onClearFilters={hasFilters ? handleClearFilters : undefined}
          />
        ) : (
          <>
            <SearchResults results={results} query={debouncedQuery} />

            {/* Pagination */}
            {(offset > 0 || hasMore) && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setOffset((prev) => Math.max(0, prev - RESULTS_PER_PAGE))}
                  disabled={offset === 0}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-600">
                  第 {Math.floor(offset / RESULTS_PER_PAGE) + 1} 页
                </span>
                <button
                  onClick={() => setOffset((prev) => prev + RESULTS_PER_PAGE)}
                  disabled={!hasMore}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">加载中...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
