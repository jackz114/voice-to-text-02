"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register" && !turnstileToken) {
      setError("Please complete the verification");
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
          setError(error.message);
        } else {
          window.location.href = redirectTo;
        }
      } else {
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
          setError(error.message);
        } else {
          alert("Sign up successful! Please check your email to verify your account.");
          setMode("login");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* 标题 */}
      <h1 className="text-2xl font-semibold text-white text-center mb-8">
        {mode === "login" ? "Sign in to your account" : "Create your account"}
      </h1>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {mode === "register" && (
          <div className="py-2">
            <Turnstile
              sitekey="1x00000000000000000000AA"
              onVerify={(token) => setTurnstileToken(token)}
              theme="dark"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (mode === "register" && !turnstileToken)}
          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : mode === "login" ? (
            "Continue"
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* 分隔符 */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-xs text-gray-500">or continue with</span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      {/* Google 登录 */}
      <GoogleAuthButton redirectTo={redirectTo} />

      {/* 切换登录/注册 */}
      <p className="text-center text-sm text-gray-400 mt-6">
        {mode === "login" ? (
          <>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
