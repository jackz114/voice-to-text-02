"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth, useFolders, Folder } from "@/components/auth/AuthProvider";
import { useState, useEffect } from "react";
import { RenameModal } from "./RenameModal";
import { supabase } from "@/lib/supabase";

interface UserBalance {
  totalMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  subscriptionStatus: "none" | "active" | "expired";
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 5.69L17 10.19V18H15V12H9V18H7V10.19L12 5.69M12 3L2 12H5V20H11V14H13V20H19V12H22L12 3Z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22,4A2,2 0 0,1 24,6V16A2,2 0 0,1 22,18H6A2,2 0 0,1 4,16V4A2,2 0 0,1 6,2H12L14,4H22M2,6V20H20V22H2A2,2 0 0,1 0,20V11H0V6H2M6,6V16H22V6H6Z" />
    </svg>
  );
}

function FolderPlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 19C13 19.34 13.04 19.67 13.09 20H4C2.9 20 2 19.11 2 18V6C2 4.89 2.89 4 4 4H10L12 6H20C21.1 6 22 6.89 22 8V13.81C21.39 13.46 20.72 13.22 20 13.09V8H4V18H13.09C13.04 18.33 13 18.66 13 19M20 18V15H18V18H15V20H18V23H20V20H23V18H20Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,15.39L8.24,17.66L9.23,13.38L5.91,10.5L10.29,10.13L12,6.09L13.71,10.13L18.09,10.5L14.77,13.38L15.76,17.66M22,9.24L14.81,8.63L12,2L9.19,8.63L2,9.24L7.45,13.97L5.82,21L12,17.27L18.18,21L16.54,13.97L22,9.24Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z" />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`transition-transform ${expanded ? "rotate-180" : ""}`}
      style={{ marginLeft: "auto" }}
    >
      <path d="M7 10L12 15L17 10H7Z" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 8L15 13.2L18 10.5L17.3 14H6.7L6 10.5L9 13.2L12 8M12 4L8.5 10L3 5L5 16H19L21 5L15.5 10L12 4M19 18H5V19C5 19.6 5.4 20 6 20H18C18.6 20 19 19.6 19 19V18Z" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: <HomeIcon /> },
  { label: "Library", href: "/dashboard/library", icon: <FolderIcon /> },
  { label: "Starred", href: "/dashboard/starred", icon: <StarIcon /> },
  { label: "Trash", href: "/dashboard/trash", icon: <TrashIcon /> },
  { label: "Review", href: "/dashboard/review", icon: <ReviewIcon /> },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { folders, createFolder, renameFolder, deleteFolder } = useFolders();
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [openFolderMenu, setOpenFolderMenu] = useState<string | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);

  const handleLogout = async () => {
    await signOut();
    setShowSettings(false);
    router.push("/login");
  };

  // Close folder menu when clicking outside
  useEffect(() => {
    if (!openFolderMenu) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside the dropdown
      if (target.closest(".folder-dropdown")) return;
      setOpenFolderMenu(null);
    };
    // Delay to avoid closing immediately on the same click that opened it
    setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => document.removeEventListener("click", handleClick);
  }, [openFolderMenu]);

  // Fetch user balance
  useEffect(() => {
    if (!user) return;

    const fetchBalance = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) return;

        const response = await fetch("/api/user/balance", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = (await response.json()) as UserBalance;
          setUserBalance(data);
        }
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };

    fetchBalance();
  }, [user]);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 shrink-0 bg-white flex flex-col">
        {/* Logo */}
        <div className="h-16 px-5 flex items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Recallmemo"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="text-[#1C1C1C] font-semibold text-sm">Recallmemo</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-2 overflow-y-auto">
          {/* Home */}
          <Link
            href="/dashboard"
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors",
              isActive("/dashboard") && pathname === "/dashboard"
                ? "bg-[#B8860B]/15 text-[#B8860B] font-medium"
                : "text-[#6B5B4F] hover:text-[#1C1C1C] hover:bg-[#FAF7F2]",
            ].join(" ")}
          >
            <span
              className={
                isActive("/dashboard") && pathname === "/dashboard"
                  ? "text-[#B8860B]"
                  : "text-[#9C8E80]"
              }
            >
              <HomeIcon />
            </span>
            Home
          </Link>

          {/* Library (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setFoldersExpanded(!foldersExpanded)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 text-[#6B5B4F] hover:text-[#1C1C1C] hover:bg-[#FAF7F2] transition-colors"
            >
              <span className="text-[#9C8E80]">
                <FolderIcon />
              </span>
              <span className="flex-1 text-left">Library</span>
              <ChevronIcon expanded={foldersExpanded} />
            </button>

            {foldersExpanded && (
              <div className="ml-4">
                {/* Default folder */}
                <Link
                  href="/dashboard/library/default"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 text-[#6B5B4F] hover:text-[#1C1C1C] hover:bg-[#FAF7F2] transition-colors"
                >
                  <span className="text-[#9C8E80]">
                    <FolderIcon />
                  </span>
                  default
                </Link>
                {/* Dynamic folders */}
                {folders.map((folder) => (
                  <div key={folder.id} className="relative group">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/dashboard/library/${folder.id}`}
                        className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 text-[#6B5B4F]"
                      >
                        <span className="text-[#9C8E80]">
                          <FolderIcon />
                        </span>
                        {folder.name}
                      </Link>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenFolderMenu(openFolderMenu === folder.id ? null : folder.id);
                          }}
                          className="p-1 rounded-full hover:bg-[#E8E0D5] hover:shadow-md text-[#9C8E80] hover:text-[#6B5B4F] transition-all opacity-0 group-hover:opacity-100"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {openFolderMenu === folder.id && (
                          <div className="folder-dropdown absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-[#E8E0D5] py-1 z-20">
                            <button
                              type="button"
                              onClick={() => {
                                setFolderToRename(folder);
                                setRenameModalOpen(true);
                                setOpenFolderMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-[#FAF7F2] transition-colors"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Rename
                            </button>
                            <button
                              type="button"
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-[#FAF7F2] transition-colors"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                              </svg>
                              Star
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Delete folder "${folder.name}"?`)) {
                                  await deleteFolder(folder.id);
                                }
                                setOpenFolderMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Create folder */}
                <Link
                  href="/dashboard/library/default?action=create-folder"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 text-[#6B5B4F] hover:text-[#1C1C1C] hover:bg-[#FAF7F2] transition-colors"
                >
                  <span className="text-[#9C8E80]">
                    <FolderPlusIcon />
                  </span>
                  Create folder
                </Link>
              </div>
            )}
          </div>

          {/* Starred */}
          <Link
            href="/dashboard/starred"
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors",
              isActive("/dashboard/starred")
                ? "bg-[#B8860B]/15 text-[#B8860B] font-medium"
                : "text-[#6B5B4F] hover:text-[#1C1C1C] hover:bg-[#FAF7F2]",
            ].join(" ")}
          >
            <span className={isActive("/dashboard/starred") ? "text-[#B8860B]" : "text-[#9C8E80]"}>
              <StarIcon />
            </span>
            Starred
          </Link>

          {/* Trash */}
          <Link
            href="/dashboard/trash"
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors",
              isActive("/dashboard/trash")
                ? "bg-[#B8860B]/15 text-[#B8860B] font-medium"
                : "text-[#6B5B4F] hover:text-[#1C1C1C] hover:bg-[#FAF7F2]",
            ].join(" ")}
          >
            <span className={isActive("/dashboard/trash") ? "text-[#B8860B]" : "text-[#9C8E80]"}>
              <TrashIcon />
            </span>
            Trash
          </Link>

          {/* Review */}
          <Link
            href="/dashboard/review"
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors",
              isActive("/dashboard/review")
                ? "bg-[#B8860B]/15 text-[#B8860B] font-medium"
                : "text-[#6B5B4F] hover:text-[#1C1C1C] hover:bg-[#FAF7F2]",
            ].join(" ")}
          >
            <span className={isActive("/dashboard/review") ? "text-[#B8860B]" : "text-[#9C8E80]"}>
              <ReviewIcon />
            </span>
            Review
          </Link>
        </nav>

        {/* Upgrade Banner */}
        <Link
          href="/payment"
          className="mx-3 mb-2 p-3 rounded-lg bg-gradient-to-r from-[#B8860B] to-[#D4A843] text-white hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-2 mb-1">
            <CrownIcon />
            <span className="text-xs font-medium">Get more minutes & AI features</span>
          </div>
          <div className="text-xs opacity-80">Upgrade now →</div>
        </Link>

        {/* Settings Panel */}
        {user && showSettings && (
          <div className="mx-3 mb-2 p-4 rounded-lg bg-[#FAF7F2] border border-[#E8E0D5]">
            {/* Account Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4A843] flex items-center justify-center text-white font-semibold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#1C1C1C] text-sm font-medium truncate">{user.email}</p>
                <p className="text-[#9C8E80] text-xs">
                  Member since{" "}
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Settings Links */}
            <div className="space-y-1">
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#1C1C1C] hover:bg-[#E8E0D5] transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Settings
              </Link>
              <Link
                href="/payment"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#1C1C1C] hover:bg-[#E8E0D5] transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                Pricing
              </Link>
              <Link
                href="/settings/billing"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#1C1C1C] hover:bg-[#E8E0D5] transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Billing
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}

        {/* User plan footer */}
        {user && (
          <div
            className="mx-3 mb-2 p-3 rounded-lg bg-[#FAF7F2] hover:bg-[#F5EFE6] transition-colors cursor-pointer"
            onClick={() => setShowSettings(!showSettings)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[#9C8E80]">
                  <AccountIcon />
                </span>
                <span className="text-[#1C1C1C] text-xs font-medium truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#B8860B]/10 text-[#B8860B] text-xs font-medium">
                {userBalance?.subscriptionStatus === "active" ? "Pro" : "Free"}
              </span>
            </div>
            <div className="h-1 bg-[#E8E0D5] rounded-full mb-2 overflow-hidden">
              <div
                className="h-full bg-[#B8860B] rounded-full"
                style={{
                  width: userBalance
                    ? `${Math.min((userBalance.usedMinutes / userBalance.totalMinutes) * 100, 100)}%`
                    : "0%",
                }}
              />
            </div>
            <p className="text-[#9C8E80] text-xs">
              {userBalance
                ? `${userBalance.usedMinutes} of ${userBalance.totalMinutes} minutes used`
                : "Loading..."}
            </p>
          </div>
        )}

        {/* Rename Modal */}
        <RenameModal
          open={renameModalOpen}
          currentName={folderToRename?.name ?? ""}
          onClose={() => {
            setRenameModalOpen(false);
            setFolderToRename(null);
          }}
          onRename={(newName) => {
            if (folderToRename) {
              renameFolder(folderToRename.id, newName);
            }
            setRenameModalOpen(false);
            setFolderToRename(null);
          }}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-white">{children}</main>
    </div>
  );
}
