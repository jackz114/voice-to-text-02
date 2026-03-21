"use client";

import { useAuth } from "./AuthProvider";

export function UserNav() {
  const { user, loading, signOut } = useAuth();

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
      <div className="hidden sm:block">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {userName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
      </div>
      <button
        onClick={signOut}
        className="ml-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        退出
      </button>
    </div>
  );
}
