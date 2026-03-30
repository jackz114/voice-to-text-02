"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useKnowledge, useFolders, useStarred, useTrash } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { TranscribeModal } from "@/components/dashboard/TranscribeModal";

type SortOption = "newest" | "oldest" | "alpha";

function CreateFolderModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const { createFolder } = useFolders();

  const handleCreate = async () => {
    if (!folderName.trim()) return;
    setCreating(true);

    try {
      await createFolder(folderName.trim());
      setFolderName("");
      onClose();
    } catch (err) {
      console.error("Failed to create folder:", err);
      alert("Failed to create folder. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1C1C1C] px-6 py-4">
          <h2 className="text-white font-semibold text-lg">Create new folder</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
            className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-[#1C1C1C] text-sm placeholder-[#9C8E80] focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E0D5] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-[#FAF7F2] hover:bg-[#F5EFE6] text-[#6B5B4F] text-sm font-medium transition-colors border border-[#E8E0D5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!folderName.trim() || creating}
            className="px-5 py-2.5 rounded-full bg-[#B8860B] hover:bg-[#8B6914] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { items, loading } = useKnowledge();
  const { starItem, unstarItem, isStarred } = useStarred();
  const { trashItem } = useTrash();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [transcribeOpen, setTranscribeOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Check for action query param - show modal based on URL
  const action = searchParams.get("action");
  useEffect(() => {
    if (action === "create-folder") {
      setShowCreateFolder(true);
      // Clean the URL without triggering re-render
      router.replace("/dashboard/library/default");
    }
  }, [action, router]);

  const filteredItems = items
    .filter((item) => item.folder_id === null) // Only show uncategorized items
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
            href="/login?redirect_to=/dashboard/library/default"
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
                placeholder="Search audios and notes"
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

            {/* Transcribe Button */}
            <button
              type="button"
              onClick={() => setTranscribeOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B8860B] hover:bg-[#8B6914] text-white text-sm font-medium transition-colors shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
              Transcribe
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 py-4">
          {/* Audio Table */}
          <div className="bg-white rounded-lg overflow-visible">
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center mb-4">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="1.5">
                            <path d="M9 12h6M9 16h6M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                          </svg>
                        </div>
                        <p className="text-[#6B5B4F] mb-2 text-sm">
                          {searchQuery ? "No results found" : "No records yet"}
                        </p>
                        {!searchQuery && (
                          <p className="text-sm text-[#9C8E80]">Click Transcribe to create your first recording</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#FAF7F2] cursor-pointer transition-colors group"
                        onClick={() => router.push(`/dashboard/transcribe/${encodeURIComponent(item.id)}`)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="rounded border-[#D4C4B0]" />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-[#1C1C1C]">{item.title}</p>
                            <p className="text-xs text-[#9C8E80] truncate max-w-xs">{item.contentPreview}</p>
                          </div>
                        </td>
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
                        <td className="px-4 py-3 text-sm text-[#6B5B4F]">-</td>
                        <td className="px-4 py-3 text-sm text-[#6B5B4F]">-</td>
                        <td className="px-4 py-3 text-sm text-[#9C8E80]">
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3" style={{ overflow: 'visible' }} onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
                              className="p-1.5 rounded-full hover:bg-[#E8E0D5] text-[#9C8E80] hover:text-[#6B5B4F] transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="5" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="12" cy="19" r="2" />
                              </svg>
                            </button>

                            {openMenu === item.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-[#E8E0D5] py-1 z-20">
                                <button
                                  type="button"
                                  onClick={() => {
                                    router.push(`/dashboard/transcribe/${encodeURIComponent(item.id)}`);
                                    setOpenMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-[#FAF7F2] transition-colors"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                  View
                                </button>
                                <div className="border-t border-[#E8E0D5] my-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingId(item.id);
                                    setOpenMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#FAF7F2]">
              <p className="text-xs text-[#9C8E80]">
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
              </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      className="w-8 h-8 rounded-full text-xs text-[#9C8E80] hover:text-[#6B5B4F] disabled:opacity-50 flex items-center justify-center"
                    >
                      «
                    </button>
                    <button
                      type="button"
                      disabled
                      className="w-8 h-8 rounded-full text-xs text-[#9C8E80] hover:text-[#6B5B4F] disabled:opacity-50 flex items-center justify-center"
                    >
                      ‹
                    </button>
                    <span className="w-8 h-8 rounded-full text-xs font-medium text-[#B8860B] bg-[#B8860B]/10 flex items-center justify-center">1</span>
                    <button
                      type="button"
                      disabled
                      className="w-8 h-8 rounded-full text-xs text-[#9C8E80] hover:text-[#6B5B4F] disabled:opacity-50 flex items-center justify-center"
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      disabled
                      className="w-8 h-8 rounded-full text-xs text-[#9C8E80] hover:text-[#6B5B4F] disabled:opacity-50 flex items-center justify-center"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

      {/* Create Folder Modal */}
      <CreateFolderModal
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
      />

      {/* Transcribe Modal */}
      <TranscribeModal
        isOpen={transcribeOpen}
        onClose={() => setTranscribeOpen(false)}
      />

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-[#E8E0D5] p-4 z-50 flex items-center gap-4">
          <p className="text-sm text-[#1C1C1C]">
            Delete this item? This action cannot be undone.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDeletingId(null)}
              className="px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#F5EFE6] text-[#6B5B4F] text-sm font-medium transition-colors border border-[#E8E0D5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                await trashItem(deletingId);
                setDeletingId(null);
              }}
              className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function LibraryDefaultPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    }>
      <LibraryContent />
    </Suspense>
  );
}
