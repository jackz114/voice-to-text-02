"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, supabase } from "@/components/auth/AuthProvider";
import { TextPasteInput } from "@/components/capture/TextPasteInput";
import { ConfirmationCards } from "@/components/capture/ConfirmationCards";

// 捕获流状态机类型
type CaptureState = "idle" | "extracting" | "confirming" | "saving";

// 知识条目候选项（提取 API 返回）
interface KnowledgeItemCandidate {
  title: string;
  content: string;
  source?: string;
  domain: string;
  tags: string[];
}

export default function CapturePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [extractedItems, setExtractedItems] = useState<KnowledgeItemCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 认证守卫 — 使用 useEffect 处理重定向（避免渲染时调用 setState）
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect_to=/capture");
    }
  }, [loading, user, router]);

  // 加载中显示空状态
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400 text-sm">加载中…</p>
      </div>
    );
  }

  // 未登录显示提示（useEffect 会处理跳转）
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400 text-sm">请先登录后使用捕获功能。</p>
      </div>
    );
  }

  // 确认保存处理函数 — 调用 /api/capture/confirm
  const handleConfirm = async (acceptedItems: KnowledgeItemCandidate[]) => {
    setCaptureState("saving");
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const response = await fetch("/api/capture/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: acceptedItems }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "保存失败，请重试。");
        setCaptureState("confirming");
        return;
      }
      setSuccessMessage(`已保存 ${data.savedCount} 条知识点。`);
      setCaptureState("idle");
      setExtractedItems([]);
    } catch {
      setError("保存失败，请重试。");
      setCaptureState("confirming");
    }
  };

  // 提取处理函数 — 调用 /api/capture/extract
  const handleExtract = async (text: string, sourceUrl?: string) => {
    setCaptureState("extracting");
    setError(null);

    try {
      // 步骤 1: 获取当前会话 token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      // 步骤 2: 调用提取 API
      const response = await fetch("/api/capture/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, sourceUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "提取失败，请检查网络后重试。");
        setCaptureState("idle");
        return;
      }

      if (!data.items || data.items.length === 0) {
        setError("AI 未能从该内容中提取到知识点。尝试粘贴更具体的学习材料。");
        setCaptureState("idle");
        return;
      }

      setExtractedItems(data.items);
      setCaptureState("confirming");
    } catch {
      setError("提取失败，请检查网络后重试。");
      setCaptureState("idle");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* 顶部导航 */}
      <nav className="w-full max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
        <a href="/" className="text-xl font-bold text-gray-900 dark:text-white">
          笔记助手
        </a>
        <span className="text-sm text-gray-500">{user.email}</span>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* 页面标题 */}
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-gray-900 dark:text-white mb-8">
          捕获知识
        </h1>

        {/* 粘贴输入区 — idle 或 extracting 状态可见 */}
        {(captureState === "idle" || captureState === "extracting") && (
          <section className="mb-12">
            {successMessage && captureState === "idle" && (
              <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <TextPasteInput
              onExtract={handleExtract}
              isExtracting={captureState === "extracting"}
            />
          </section>
        )}

        {/* 确认卡片区 — confirming 或 saving 状态 */}
        {(captureState === "confirming" || captureState === "saving") && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              提取结果（{extractedItems.length} 条）
            </h2>
            <ConfirmationCards
              items={extractedItems}
              onConfirm={handleConfirm}
              isSaving={captureState === "saving"}
            />
          </section>
        )}
      </main>
    </div>
  );
}
