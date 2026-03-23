"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { KnowledgeLibrary } from "@/components/library/KnowledgeLibrary";

export default function LibraryPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400 text-sm">加载中…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-gray-600 dark:text-gray-400">请先登录后查看知识库。</p>
        <Link
          href="/login?redirect_to=/library"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Top nav */}
      <nav className="w-full border-b px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-gray-900 dark:text-white">
          笔记助手
        </a>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <Link href="/capture" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            捕获
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="font-medium text-gray-900 dark:text-white">知识库</span>
        </div>
      </nav>

      <KnowledgeLibrary />
    </div>
  );
}
