"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { Turnstile } from "react-turnstile";

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = "/" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "register" && !turnstileToken) {
      alert("请完成人机验证");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await getSupabaseClient().auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          alert(error.message);
        } else {
          window.location.href = redirectTo;
        }
      } else {
        // 注册模式
        const { error } = await getSupabaseClient().auth.signUp({
          email,
          password,
          options: {
            data: {
              turnstile_token: turnstileToken,
            },
          },
        });

        if (error) {
          alert(error.message);
        } else {
          alert("注册成功！请检查邮箱验证邮件。");
          setMode("login");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 pb-2 text-center border-b-2 transition-colors ${
            mode === "login"
              ? "border-blue-500 text-blue-600"
              : "border-gray-200 text-gray-500"
          }`}
        >
          登录
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 pb-2 text-center border-b-2 transition-colors ${
            mode === "register"
              ? "border-blue-500 text-blue-600"
              : "border-gray-200 text-gray-500"
          }`}
        >
          注册
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            邮箱
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {mode === "register" && (
          <div className="py-4">
            <Turnstile
              sitekey="1x00000000000000000000AA"
              onVerify={(token) => setTurnstileToken(token)}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (mode === "register" && !turnstileToken)}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "处理中..."
            : mode === "login"
            ? "登录"
            : "注册"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">或使用</span>
        </div>
      </div>

      <GoogleAuthButton redirectTo={redirectTo} />
    </div>
  );
}
