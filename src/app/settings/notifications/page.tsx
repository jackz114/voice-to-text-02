// src/app/settings/notifications/page.tsx
// Notification settings page

import { Metadata } from "next";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "通知设置 - 笔记助手",
  description: "管理你的邮件提醒和通知偏好",
};

async function getUserDomains(userId: string): Promise<string[]> {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch distinct domains from user's knowledge items
    const { data } = await supabase
      .from("knowledge_items")
      .select("domain")
      .eq("user_id", userId);

    if (!data) return [];

    // Extract unique domains
    const domains = [...new Set(data.map((item: { domain: string }) => item.domain))];
    return domains.sort();
  } catch {
    return [];
  }
}

export default async function NotificationsSettingsPage() {
  // Check authentication with server-side client
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect_to=/settings/notifications");
  }

  const domains = await getUserDomains(user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">通知设置</h1>
          <p className="mt-1 text-gray-600">
            管理你的邮件提醒偏好和复习计划
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <NotificationPreferences availableDomains={domains} />
      </main>
    </div>
  );
}
