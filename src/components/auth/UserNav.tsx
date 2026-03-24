"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { Bell, Settings, LogOut, ChevronDown } from "lucide-react";

export function UserNav() {
  const { user, loading, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (loading) {
    return (
      <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
    );
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        登录
      </a>
    );
  }

  const userEmail = user.email;
  const userName = user.user_metadata?.name || userEmail?.split("@")[0] || "用户";
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={userName}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
          {userName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* User info + dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors"
        >
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {userName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-20 py-1">
              <a
                href="/settings/notifications"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <Bell className="h-4 w-4" />
                通知设置
              </a>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  signOut();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                退出
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
