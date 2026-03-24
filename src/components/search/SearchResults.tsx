// src/components/search/SearchResults.tsx
// Search results list with result cards

"use client";

import { useRouter } from "next/navigation";
import { SearchResult } from "@/app/api/search/route";
import { Calendar, Tag, ExternalLink } from "lucide-react";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  onSelectResult?: (result: SearchResult) => void;
}

export function SearchResults({
  results,
  query,
  onSelectResult,
}: SearchResultsProps) {
  const router = useRouter();

  const handleClick = (result: SearchResult) => {
    if (onSelectResult) {
      onSelectResult(result);
    } else {
      router.push(`/library?highlight=${result.id}`);
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <SearchResultCard
          key={result.id}
          result={result}
          query={query}
          onClick={() => handleClick(result)}
        />
      ))}
    </div>
  );
}

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  onClick: () => void;
}

function SearchResultCard({ result, query: _query, onClick }: SearchResultCardProps) {
  const formattedDate = new Date(result.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      {/* Header: Title and Domain */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
          {result.title}
        </h3>
        <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
          {result.domain}
        </span>
      </div>

      {/* Excerpt with highlights */}
      <p
        className="mb-4 line-clamp-3 text-gray-600"
        dangerouslySetInnerHTML={{ __html: result.excerpt }}
      />

      {/* Footer: Meta information */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
        {/* Tags */}
        {result.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="h-4 w-4" />
            <div className="flex gap-2">
              {result.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
              {result.tags.length > 3 && (
                <span className="text-xs">+{result.tags.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {/* Source */}
        {result.source && (
          <div className="flex items-center gap-1">
            <ExternalLink className="h-4 w-4" />
            <span className="truncate max-w-[200px]" title={result.source}>
              {result.source}
            </span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>

        {/* Relevance score (subtle) */}
        <div className="ml-auto text-xs text-gray-400">
          相关度: {(result.rank * 100).toFixed(1)}%
        </div>
      </div>
    </article>
  );
}
