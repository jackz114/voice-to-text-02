// src/app/dashboard/progress/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { supabase } from "@/lib/supabase";

interface FolderStats {
  id: string;
  name: string;
  total: number;
  activated: number;
}

interface Stats {
  total: number;
  activated: number;
}

export default function ProgressPage() {
  const [folders, setFolders] = useState<FolderStats[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, activated: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const response = await fetch("/api/review/progress", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("获取失败");

      const data = await response.json();
      setFolders(data.folders || []);
      setStats(data.stats || { total: 0, activated: 0 });
    } catch (error) {
      console.error("获取学习进度失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-full bg-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-[#E8E0D5]">
          <h1 className="text-lg font-semibold text-[#1C1C1C]">学习进度</h1>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="mb-6 p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E0D5]">
                <div className="flex gap-8">
                  <div>
                    <p className="text-2xl font-semibold text-[#1C1C1C]">{stats.total}</p>
                    <p className="text-sm text-[#6B5B4F]">总笔记数</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-[#1C1C1C]">{stats.activated}</p>
                    <p className="text-sm text-[#6B5B4F]">已激活</p>
                  </div>
                </div>
              </div>

              {/* Folder Progress */}
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-[#6B5B4F] mb-3">文件夹进度</h2>
                {folders.map(folder => (
                  <ProgressCard
                    key={folder.id}
                    name={folder.name}
                    activated={folder.activated}
                    total={folder.total}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}