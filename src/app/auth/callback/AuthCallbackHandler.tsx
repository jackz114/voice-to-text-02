"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

export default function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 处理 OAuth 回调
        const { error } = await getSupabaseClient().auth.exchangeCodeForSession(
          window.location.search
        );

        if (error) {
          console.error("Auth callback error:", error);
          router.push("/login?error=auth_failed");
          return;
        }

        // 获取重定向地址
        const redirectTo = searchParams.get("redirect_to") || "/";
        router.push(redirectTo);
      } catch (error) {
        console.error("Callback handling error:", error);
        router.push("/login?error=unknown");
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

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
