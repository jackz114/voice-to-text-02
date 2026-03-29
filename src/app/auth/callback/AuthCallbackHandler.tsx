"use client";

// OAuth 回调由 middleware 处理（见 middleware.ts）
// 此组件仅作为 fallback 展示加载状态
export default function AuthCallbackHandler() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          正在完成登录...
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">请稍候</p>
      </div>
    </div>
  );
}
