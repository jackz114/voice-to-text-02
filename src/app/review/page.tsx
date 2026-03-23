"use client";

import { ReviewSession } from "@/components/review/ReviewSession";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

export default function ReviewPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400 text-sm">加载中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-gray-600">请先登录</p>
        <Link href="/login" className="text-blue-600 hover:underline">
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">今日复习</h1>
          <Link href="/library" className="text-sm text-gray-500 hover:text-gray-700">
            返回知识库
          </Link>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-8">
        <ReviewSession />
      </div>
    </div>
  );
}
