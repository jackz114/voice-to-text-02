"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { Bell, LogOut, ChevronDown } from "lucide-react";

export function UserNav() {
  const { user, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
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
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {userName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg z-20 dark:border-gray-700 dark:bg-gray-800">
            <a
              href="/settings/notifications"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <Bell className="h-4 w-4" />
              通知设置
            </a>
            <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <LogOut className="h-4 w-4" />
              退出
            </button>
          </div>
        </>
      )}
    </div>
  );
}
