"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase";

declare const google: {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        nonce?: string;
      }) => void;
      renderButton: (
        element: HTMLElement,
        config: {
          type?: "standard" | "icon";
          theme?: "outline" | "filled_blue" | "filled_black";
          size?: "large" | "medium" | "small";
          text?: "signin_with" | "signup_with" | "continue_with" | "signup_with";
          shape?: "rectangular" | "pill" | "circular";
          logo_alignment?: "left" | "center";
          width?: number;
          ux_mode?: "popup" | "redirect";
          redirect_url?: string;
        }
      ) => void;
    };
  };
};

interface CredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleAuthButtonProps {
  redirectTo?: string;
  className?: string;
}

// 生成随机的 nonce（用于 ID Token 安全验证）
function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

export function GoogleAuthButton({
  redirectTo = "/",
  className = "",
}: GoogleAuthButtonProps) {
  const [gisReady, setGisReady] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef<string>("");
  const redirectToRef = useRef<string>(redirectTo);

  // 同步 redirectTo ref，确保回调时能访问最新值
  useEffect(() => {
    redirectToRef.current = redirectTo;
  }, [redirectTo]);

  // 加载 Google Identity Services 库
  useEffect(() => {
    if (typeof google !== "undefined") {
      setGisReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGisReady(true);
    document.head.appendChild(script);
  }, []);

  // 初始化 Google Identity Services 并渲染按钮
  useEffect(() => {
    if (!gisReady || typeof google === "undefined" || !buttonRef.current) return;

    const nonce = generateNonce();
    nonceRef.current = nonce;

    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      callback: async (response: CredentialResponse) => {
        if (!response.credential) return;

        try {
          const { error } = await getSupabaseClient().auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
            nonce,
          });

          if (error) throw error;

          // ID Token 登录成功，Supabase 会自动设置 session cookie
          window.location.href = redirectToRef.current;
        } catch (error) {
          console.error("Google ID Token login error:", error);
          alert("Google 登录失败，请重试");
        }
      },
      nonce,
    });

    // 使用 popup 模式，不依赖 FedCM
    google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: 400,
      ux_mode: "popup",
    });
  }, [gisReady]);

  return (
    <div className="w-full">
      {/* 这个 div 会被 Google GIS 库替换为真实的按钮 */}
      <div
        ref={buttonRef}
        className={`
          flex items-center justify-center
          w-full px-4 py-3
          bg-white text-gray-700 font-medium
          border border-gray-300 rounded-lg
          hover:bg-gray-50 hover:border-gray-400
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          transition-colors
          ${className}
        `}
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
