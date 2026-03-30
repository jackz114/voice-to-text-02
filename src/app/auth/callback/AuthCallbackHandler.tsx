"use client";

// OAuth callback handled by middleware (see middleware.ts)
// This component is only a fallback to show loading state
export default function AuthCallbackHandler() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Completing sign in...
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Please wait</p>
      </div>
    </div>
  );
}
