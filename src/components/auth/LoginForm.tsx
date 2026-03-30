"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { GoogleAuthButton } from "./GoogleAuthButton";

interface LoginFormProps {
  redirectTo?: string;
  defaultMode?: "login" | "register";
}

export function LoginForm({ redirectTo = "/", defaultMode = "login" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register" && !acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy");
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
      {/* Title */}
      <h1 className="text-2xl font-semibold text-[#1C1C1C] text-center mb-8">
        {mode === "login" ? "Sign in to your account" : "Create your account"}
      </h1>

      {/* Error message */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E0D5] text-[#1C1C1C] placeholder-[#9C8E80] text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-all"
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
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E0D5] text-[#1C1C1C] placeholder-[#9C8E80] text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-all"
          />
        </div>

        {mode === "register" && (
          <>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-[#D4C4B0] text-[#B8860B] focus:ring-[#B8860B]"
              />
              <span className="text-xs text-[#6B5B4F] leading-relaxed">
                I agree to the{" "}
                <a href="#" className="text-[#B8860B] hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-[#B8860B] hover:underline">Privacy Policy</a>
              </span>
            </label>
          </>
        )}

        <button
          type="submit"
          disabled={loading || (mode === "register" && !acceptedTerms)}
          className="w-full h-12 rounded-xl bg-[#2C2C2C] hover:bg-[#1C1C1C] text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[#E8E0D5]" />
        <span className="text-xs text-[#9C8E80]">or continue with</span>
        <div className="flex-1 h-px bg-[#E8E0D5]" />
      </div>

      {/* Google Sign in */}
      <GoogleAuthButton redirectTo={redirectTo} />

      {/* Toggle login/register */}
      <p className="text-center text-sm text-[#6B5B4F] mt-6">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className="text-[#B8860B] hover:text-[#8B6914] font-medium"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className="text-[#B8860B] hover:text-[#8B6914] font-medium"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
