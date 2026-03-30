"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useKnowledge, useStarred } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

type SortOption = "newest" | "oldest" | "alpha";

export default function StarredPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, loading } = useKnowledge();
  const { starredIds, starItem, unstarItem, isStarred } = useStarred();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [sortOpen, setSortOpen] = useState(false);

  // Filter items to only show starred ones
  const starredItems = items.filter((item) => starredIds.includes(item.id));

  const filteredItems = starredItems
    .filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.title?.toLowerCase() ?? "").includes(q) ||
        (item.contentPreview?.toLowerCase() ?? "").includes(q)
      );
    });

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-[#6B5B4F]">Please sign in to continue.</p>
          <Link
            href="/login?redirect_to=/dashboard/starred"
            className="px-6 py-3 rounded-xl bg-[#2C2C2C] hover:bg-[#1C1C1C] text-white text-sm font-medium transition-colors"
          >
            Sign in
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full bg-white">
        {/* Header with Search and Transcribe Button */}
        <div className="sticky top-0 z-10 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-md relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8E80]"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search starred audios and notes"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#E8E0D5] text-[#1C1C1C] text-sm placeholder-[#9C8E80] focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-all"
              />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF7F2] border border-[#E8E0D5] text-[#6B5B4F] text-sm hover:border-[#B8860B] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                {sortBy === "newest" ? "Newest first" : sortBy === "oldest" ? "Older first" : "Title A-Z"}
              </button>

              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-[#E8E0D5] py-1 z-20">
                  {(["newest", "oldest", "alpha"] as SortOption[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setSortBy(s); setSortOpen(false); }}
                      className={[
                        "w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors",
                        sortBy === s
                          ? "text-[#B8860B] font-medium bg-[#B8860B]/5"
                          : "text-[#6B5B4F] hover:bg-[#FAF7F2]",
                      ].join(" ")}
                    >
                      {sortBy === s && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 20A8 8 0 0 1 4 12A8 8 0 0 1 12 4A8 8 0 0 1 20 12A8 8 0 0 1 12 20M12 2A10 10 0 0 0 2 12A10 10 0 0 0 12 22A10 10 0 0 0 22 12A10 10 0 0 0 12 2M12 7A5 5 0 0 0 7 12A5 5 0 0 0 12 17A5 5 0 0 0 17 12A5 5 0 0 0 12 7Z" />
                        </svg>
                      )}
                      {s === "newest" ? "Newest first" : s === "oldest" ? "Older first" : "Title A-Z"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 py-4">
          {/* Audio Table */}
          <div className="bg-white rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="1.5">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                </div>
                <p className="text-[#6B5B4F] mb-2 text-sm">
                  {searchQuery ? "No results found" : "No starred items yet"}
                </p>
                {!searchQuery && (
                  <p className="text-sm text-[#9C8E80]">Star items from your library to see them here</p>
                )}
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FAF7F2]">
                      <th className="px-4 py-3 text-left">
                        <input type="checkbox" className="rounded border-[#D4C4B0]" />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <span className="text-xs font-medium text-[#6B5B4F] tracking-wider">NAME</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5B4F] tracking-wider w-16">
                        STAR
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5B4F] tracking-wider w-24">
                        SPEAKERS
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5B4F] tracking-wider w-24">
                        DURATION
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5B4F] tracking-wider w-32">
                        CREATED AT
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5B4F] tracking-wider w-20">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#FAF7F2] cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/transcribe/${encodeURIComponent(item.id)}`)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="rounded border-[#D4C4B0]" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#FAF7F2] flex items-center justify-center">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2">
                                <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-6.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#1C1C1C]">{item.title}</p>
                              <p className="text-xs text-[#9C8E80] truncate max-w-xs">{item.contentPreview}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#6B5B4F]">-</td>
                        <td className="px-4 py-3 text-sm text-[#6B5B4F]">-</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={async () => {
                              if (isStarred(item.id)) {
                                await unstarItem(item.id);
                              } else {
                                await starItem(item.id);
                              }
                            }}
                            className="p-1.5 rounded-full hover:bg-[#E8E0D5] transition-colors"
                            title={isStarred(item.id) ? "Unstar" : "Star"}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill={isStarred(item.id) ? "#B8860B" : "none"}
                              stroke={isStarred(item.id) ? "#B8860B" : "#9C8E80"}
                              strokeWidth="2"
                            >
                              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#9C8E80]">
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => unstarItem(item.id)}
                            className="p-1.5 rounded-full hover:bg-[#E8E0D5] text-[#B8860B] hover:text-[#8B6914] transition-colors"
                            title="Unstar"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Table Footer */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#FAF7F2]">
                  <p className="text-xs text-[#9C8E80]">
                    {filteredItems.length} starred item{filteredItems.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
