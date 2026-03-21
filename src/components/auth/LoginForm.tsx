"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { Turnstile } from "react-turnstile";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = redirectTo;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            captchaToken: turnstileToken || undefined,
          },
        });
        if (error) throw error;
        alert("注册成功！请检查邮箱验证链接。");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "操作失败";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        {mode === "login" ? "登录" : "注册"}
      </h2>

      <GoogleAuthButton redirectTo={redirectTo} className="mb-6" />

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            或使用邮箱
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            邮箱
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       outline-none transition-colors"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       outline-none transition-colors"
            placeholder="••••••••"
          />
        </div>

        {mode === "register" && (
          <div className="flex justify-center">
            <Turnstile
              sitekey="1x00000000000000000000AA"
              onVerify={(token) => setTurnstileToken(token)}
              theme="auto"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (mode === "register" && !turnstileToken)}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        {mode === "login" ? "还没有账号？" : "已有账号？"}
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="ml-1 text-blue-600 hover:text-blue-500 font-medium"
        >
          {mode === "login" ? "立即注册" : "立即登录"}
        </button>
      </p>
    </div>
  );
}
