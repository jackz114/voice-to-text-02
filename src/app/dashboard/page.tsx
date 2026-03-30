"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { TranscribeModal } from "@/components/dashboard/TranscribeModal";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [transcribeOpen, setTranscribeOpen] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    const fetchDueCount = async () => {
      if (!user) return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token ?? "";
        const response = await fetch("/api/review/due", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = (await response.json()) as { count?: number };
          setDueCount(data.count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch due count:", error);
      }
    };

    fetchDueCount();
  }, [user]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-[#6B5B4F]">Please sign in to continue.</p>
          <Link
            href="/login?redirect_to=/dashboard"
            className="px-6 py-3 rounded-xl bg-[#2C2C2C] hover:bg-[#1C1C1C] text-white text-sm font-medium transition-colors"
          >
            Sign in
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center mx-auto mb-6">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B8860B"
              strokeWidth="1.5"
            >
              <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-6.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#1C1C1C] mb-2">Welcome to Recallmemo</h1>
          <p className="text-sm text-[#6B5B4F] mb-6">
            Your AI-powered learning assistant. Start by creating a transcribe or browsing your
            library.
          </p>
          {dueCount > 0 && (
            <Link
              href="/dashboard/review"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#B8860B]/10 hover:bg-[#B8860B]/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#B8860B] flex items-center justify-center text-white font-semibold">
                {dueCount}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1C1C1C]">Due for Review</p>
                <p className="text-xs text-[#6B5B4F]">Click to start</p>
              </div>
            </Link>
          )}
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard/library"
              className="px-5 py-2.5 rounded-full bg-[#FAF7F2] hover:bg-[#F5EFE6] text-[#6B5B4F] text-sm font-medium transition-colors border border-[#E8E0D5]"
            >
              Browse Library
            </Link>
            <button
              type="button"
              onClick={() => setTranscribeOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#B8860B] hover:bg-[#8B6914] text-white text-sm font-medium transition-colors shadow-sm"
            >
              New Transcribe
            </button>
          </div>
        </div>
      </div>

      <TranscribeModal isOpen={transcribeOpen} onClose={() => setTranscribeOpen(false)} />
    </DashboardLayout>
  );
}
