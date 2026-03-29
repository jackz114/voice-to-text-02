# 间隔重复复习系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的间隔重复复习系统，包括复习流程页面、学习进度页面、导航入口

**Architecture:** 基于已有的 ts-fsrs 算法和 API（`/api/review/today`, `/api/review/rate`），新建前端页面和组件。后端 API 已存在。

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4

---

## 文件结构

```
src/
├── app/
│   ├── dashboard/
│   │   ├── review/
│   │   │   └── page.tsx          # 复习流程页面
│   │   └── progress/
│   │       └── page.tsx          # 学习进度页面
│   ├── api/review/
│   │   ├── activate/route.ts     # 新建：激活笔记API
│   │   ├── due/route.ts          # 新建：获取待复习笔记API
│   │   └── progress/route.ts     # 新建：获取学习进度API
├── components/
│   └── dashboard/
│       ├── ReviewCard.tsx        # 新建：复习卡片组件
│       ├── ReviewSession.tsx     # 新建：复习会话管理组件
│       └── ProgressCard.tsx      # 新建：进度条卡片组件
└── lib/
    └── review.ts                 # 新建：复习相关工具函数
```

---

## Phase 1: API 路由实现

### Task 1: 创建激活笔记 API

**Files:**
- Create: `src/app/api/review/activate/route.ts`

- [ ] **Step 1: 创建 activate API 路由**

```typescript
// src/app/api/review/activate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token ?? undefined);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json() as { folder_id?: string };
    const folderId = body.folder_id;

    // 获取该用户指定文件夹下还没有 review_state 的笔记
    let query = supabase
      .from("knowledge_items")
      .select("id")
      .eq("user_id", user.id);

    if (folderId && folderId !== "default") {
      query = query.eq("folder_id", folderId);
    } else {
      query = query.is("folder_id", null);
    }

    const { data: items, error: itemsError } = await query;
    if (itemsError) throw itemsError;

    // 为每张笔记创建 review_state 记录
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const reviewStates = (items || []).map(item => ({
      knowledge_item_id: item.id,
      user_id: user.id,
      stability: 0,
      difficulty: 0,
      retrievability: 0,
      review_count: 0,
      next_review_at: tomorrow.toISOString(),
      last_reviewed_at: null,
    }));

    if (reviewStates.length > 0) {
      const { error: insertError } = await supabase
        .from("review_state")
        .insert(reviewStates);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ activated_count: reviewStates.length });
  } catch (error) {
    console.error("激活笔记失败:", error);
    return NextResponse.json({ error: "激活失败" }, { status: 500 });
  }
}
```

- [ ] **Step 2: 测试激活 API**

Run: `curl -X POST http://localhost:3000/api/review/activate -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{"folder_id": "xxx"}'`
Expected: `{"activated_count": 5}` 或类似

- [ ] **Step 3: Commit**

```bash
git add src/app/api/review/activate/route.ts
git commit -m "feat: add review activate API"
```

---

### Task 2: 创建获取待复习笔记 API

**Files:**
- Create: `src/app/api/review/due/route.ts`

- [ ] **Step 1: 创建 due API 路由**

```typescript
// src/app/api/review/due/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token ?? undefined);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folder");

    const now = new Date().toISOString();

    let query = supabase
      .from("review_state")
      .select(`
        id,
        next_review_at,
        stability,
        difficulty,
        review_count,
        last_reviewed_at,
        knowledge_items!inner(
          id,
          title,
          content,
          folder_id,
          domain,
          source,
          tags
        )
      `)
      .lte("next_review_at", now)
      .eq("knowledge_items.user_id", user.id);

    if (folderId && folderId !== "default") {
      query = query.eq("knowledge_items.folder_id", folderId);
    } else {
      query = query.is("knowledge_items.folder_id", null);
    }

    query = query.order("next_review_at", { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    const items = (data || []).map((item: any) => ({
      itemId: item.knowledge_items[0]?.id,
      title: item.knowledge_items[0]?.title,
      content: item.knowledge_items[0]?.content,
      folder_id: item.knowledge_items[0]?.folder_id,
      domain: item.knowledge_items[0]?.domain,
      source: item.knowledge_items[0]?.source,
      tags: item.knowledge_items[0]?.tags,
      reviewStateId: item.id,
      nextReviewAt: item.next_review_at,
      stability: item.stability,
      difficulty: item.difficulty,
      reviewCount: item.review_count,
      lastReviewedAt: item.last_reviewed_at,
    }));

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error("获取待复习笔记失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
```

- [ ] **Step 2: 测试 due API**

Run: `curl http://localhost:3000/api/review/due -H "Authorization: Bearer <token>"`
Expected: `{"items": [...], "count": 3}` 或类似

- [ ] **Step 3: Commit**

```bash
git add src/app/api/review/due/route.ts
git commit -m "feat: add review due API"
```

---

### Task 3: 创建获取学习进度 API

**Files:**
- Create: `src/app/api/review/progress/route.ts`

- [ ] **Step 1: 创建 progress API 路由**

```typescript
// src/app/api/review/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token ?? undefined);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 获取所有文件夹及其笔记统计
    const { data: folders, error: foldersError } = await supabase
      .from("folders")
      .select("id, name")
      .eq("user_id", user.id);
    if (foldersError) throw foldersError;

    // 获取所有笔记数量（按文件夹分组）
    const { data: allItems, error: itemsError } = await supabase
      .from("knowledge_items")
      .select("folder_id")
      .eq("user_id", user.id);
    if (itemsError) throw itemsError;

    // 获取所有已激活的复习状态
    const { data: allReviewStates, error: reviewError } = await supabase
      .from("review_state")
      .select("knowledge_item_id")
      .eq("user_id", user.id);
    if (reviewError) throw reviewError;

    const activatedItemIds = new Set((allReviewStates || []).map((s: any) => s.knowledge_item_id));

    // 按文件夹统计
    const folderStats = (folders || []).map(folder => {
      const total = (allItems || []).filter(i => i.folder_id === folder.id).length;
      const activated = (allItems || []).filter(i => i.folder_id === folder.id && activatedItemIds.has(i.id)).length;
      return { id: folder.id, name: folder.name, total, activated };
    });

    // default 文件夹
    const defaultTotal = (allItems || []).filter(i => i.folder_id === null).length;
    const defaultActivated = (allItems || []).filter(i => i.folder_id === null && activatedItemIds.has(i.id)).length;
    folderStats.unshift({ id: "default", name: "default", total: defaultTotal, activated: defaultActivated });

    // 全局统计
    const totalItems = (allItems || []).length;
    const activatedCount = activatedItemIds.size;

    return NextResponse.json({
      folders: folderStats,
      stats: { total: totalItems, activated: activatedCount }
    });
  } catch (error) {
    console.error("获取学习进度失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
```

- [ ] **Step 2: 测试 progress API**

Run: `curl http://localhost:3000/api/review/progress -H "Authorization: Bearer <token>"`
Expected: `{"folders": [...], "stats": {"total": 50, "activated": 23}}`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/review/progress/route.ts
git commit -m "feat: add review progress API"
```

---

## Phase 2: 前端组件

### Task 4: 创建复习卡片组件

**Files:**
- Create: `src/components/dashboard/ReviewCard.tsx`

- [ ] **Step 1: 创建 ReviewCard 组件**

```tsx
// src/components/dashboard/ReviewCard.tsx
"use client";

import { useState } from "react";

interface ReviewCardProps {
  item: {
    itemId: string;
    title: string;
    content: string;
  };
  currentIndex: number;
  total: number;
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  onExit: () => void;
}

export function ReviewCard({ item, currentIndex, total, onRate, onExit }: ReviewCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    setShowAnswer(false);
    onRate(rating);
  };

  return (
    <div className="min-h-screen bg-[#1C1C1C] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-[#B8860B] text-sm flex items-center gap-1 hover:underline"
        >
          ← 返回
        </button>
        <span className="text-[#888] text-sm">
          {currentIndex + 1}/{total}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6">
        <div className="max-w-lg w-full text-center">
          {/* Question */}
          <div className="mb-8">
            <p className="text-white text-2xl font-medium leading-relaxed">
              {item.title}
            </p>
          </div>

          {/* Answer or Show Answer Button */}
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="px-8 py-3 bg-[#B8860B] hover:bg-[#8B6914] text-white rounded-full font-medium transition-colors"
            >
              显示答案
            </button>
          ) : (
            <div className="bg-[#2A2A2A] rounded-xl p-6 text-left">
              <p className="text-[#E0E0E0] text-lg leading-relaxed whitespace-pre-wrap">
                {item.content}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rating Buttons */}
      {showAnswer && (
        <div className="px-6 py-8">
          <div className="flex justify-center gap-3">
            <button
              onClick={() => handleRate(1)}
              className="px-6 py-3 rounded-full bg-[#fee] text-[#c00] font-medium hover:opacity-80 transition-opacity"
            >
              Again
            </button>
            <button
              onClick={() => handleRate(2)}
              className="px-6 py-3 rounded-full bg-[#ffd] text-[#a70] font-medium hover:opacity-80 transition-opacity"
            >
              Hard
            </button>
            <button
              onClick={() => handleRate(3)}
              className="px-6 py-3 rounded-full bg-[#dfd] text-[#060] font-medium hover:opacity-80 transition-opacity"
            >
              Good
            </button>
            <button
              onClick={() => handleRate(4)}
              className="px-6 py-3 rounded-full bg-[#dff] text-[#069] font-medium hover:opacity-80 transition-opacity"
            >
              Easy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ReviewCard.tsx
git commit -m "feat: add ReviewCard component"
```

---

### Task 5: 创建复习会话组件

**Files:**
- Create: `src/components/dashboard/ReviewSession.tsx`

- [ ] **Step 1: 创建 ReviewSession 组件**

```tsx
// src/components/dashboard/ReviewSession.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ReviewCard } from "./ReviewCard";

interface ReviewItem {
  itemId: string;
  title: string;
  content: string;
  reviewStateId: string;
}

interface ReviewSessionProps {
  folderId?: string;
  onComplete: () => void;
  onExit: () => void;
}

export function ReviewSession({ folderId, onComplete, onExit }: ReviewSessionProps) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDueItems();
  }, [folderId]);

  const fetchDueItems = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const url = folderId
        ? `/api/review/due?folder=${folderId}`
        : "/api/review/due";

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("获取失败");

      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("获取待复习笔记失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (rating: 1 | 2 | 3 | 4) => {
    if (currentIndex >= items.length) return;

    const currentItem = items[currentIndex];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const response = await fetch("/api/review/rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          knowledgeItemId: currentItem.itemId,
          rating,
        }),
      });

      if (!response.ok) throw new Error("评分失败");

      // Move to next item
      if (currentIndex + 1 >= items.length) {
        onComplete();
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error("提交评分失败:", error);
      alert("提交评分失败，请重试");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] flex flex-col items-center justify-center">
        <div className="text-6xl mb-6">✓</div>
        <h2 className="text-white text-xl font-semibold mb-2">今日复习完成！</h2>
        <p className="text-[#888] mb-6">没有更多待复习的笔记了</p>
        <button
          onClick={onExit}
          className="px-6 py-3 bg-[#B8860B] hover:bg-[#8B6914] text-white rounded-full font-medium transition-colors"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <ReviewCard
      item={items[currentIndex]}
      currentIndex={currentIndex}
      total={items.length}
      onRate={handleRate}
      onExit={onExit}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ReviewSession.tsx
git commit -m "feat: add ReviewSession component"
```

---

### Task 6: 创建进度条卡片组件

**Files:**
- Create: `src/components/dashboard/ProgressCard.tsx`

- [ ] **Step 1: 创建 ProgressCard 组件**

```tsx
// src/components/dashboard/ProgressCard.tsx
"use client";

interface ProgressCardProps {
  name: string;
  activated: number;
  total: number;
}

export function ProgressCard({ name, activated, total }: ProgressCardProps) {
  const percentage = total > 0 ? (activated / total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl p-4 border border-[#E8E0D5]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#1C1C1C]">{name}</span>
        <span className="text-sm text-[#6B5B4F]">
          {activated}/{total}
        </span>
      </div>
      <div className="h-2 bg-[#FAF7F2] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#B8860B] rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ProgressCard.tsx
git commit -m "feat: add ProgressCard component"
```

---

## Phase 3: 页面实现

### Task 7: 创建复习页面

**Files:**
- Create: `src/app/dashboard/review/page.tsx`

- [ ] **Step 1: 创建复习页面**

```tsx
// src/app/dashboard/review/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ReviewSession } from "@/components/dashboard/ReviewSession";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder") ?? undefined;

  return (
    <DashboardLayout>
      <ReviewSession
        folderId={folderId}
        onComplete={() => {
          // 复习完成后可以做一些处理
        }}
        onExit={() => router.push("/dashboard")}
      />
    </DashboardLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/review/page.tsx
git commit -m "feat: add review page"
```

---

### Task 8: 创建学习进度页面

**Files:**
- Create: `src/app/dashboard/progress/page.tsx`

- [ ] **Step 1: 创建学习进度页面**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/progress/page.tsx
git commit -m "feat: add progress page"
```

---

## Phase 4: 导航和入口

### Task 9: 添加导航栏复习入口

**Files:**
- Modify: `src/components/dashboard/DashboardLayout.tsx`

- [ ] **Step 1: 添加复习导航项和相关图标**

在 DashboardLayout.tsx 中添加 ReviewIcon 和 navItems 中的复习入口：

```tsx
// 添加 ReviewIcon 函数（在现有图标函数附近）
function ReviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  );
}
```

在 navItems 数组中添加（添加在 Trash 之前）：

```tsx
{ label: "Review", href: "/dashboard/review", icon: <ReviewIcon /> },
```

在 JSX 中添加导航链接：

```tsx
{/* Review */}
<Link
  href="/dashboard/review"
  className={[
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors",
    isActive("/dashboard/review")
      ? "bg-[#B8860B]/15 text-[#B8860B] font-medium"
      : "text-[#6B5B4F] hover:text-[#1C1C1C] hover:bg-[#FAF7F2]",
  ].join(" ")}
>
  <span className={isActive("/dashboard/review") ? "text-[#B8860B]" : "text-[#9C8E80]"}>
    <ReviewIcon />
  </span>
  Review
</Link>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/DashboardLayout.tsx
git commit -m "feat: add review nav item"
```

---

### Task 10: 在 Dashboard 添加复习提醒

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: 添加复习提醒和链接**

在 Dashboard 页面中添加复习提醒区域。首先添加 state 和 API 调用：

```tsx
const [dueCount, setDueCount] = useState(0);

// 在 useEffect 中获取到期数量
useEffect(() => {
  const fetchDueCount = async () => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const response = await fetch("/api/review/due", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDueCount(data.count || 0);
      }
    } catch (error) {
      console.error("获取待复习数量失败:", error);
    }
  };

  fetchDueCount();
}, [user]);
```

在欢迎区域后添加入口：

```tsx
{dueCount > 0 && (
  <Link
    href="/dashboard/review"
    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#B8860B]/10 hover:bg-[#B8860B]/20 transition-colors"
  >
    <div className="w-10 h-10 rounded-full bg-[#B8860B] flex items-center justify-center text-white font-semibold">
      {dueCount}
    </div>
    <div>
      <p className="text-sm font-medium text-[#1C1C1C]">今日待复习</p>
      <p className="text-xs text-[#6B5B4F]">点击开始复习</p>
    </div>
  </Link>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add review reminder on dashboard"
```

---

### Task 11: 在文件夹视图添加"开始学习"按钮

**Files:**
- Modify: `src/app/dashboard/library/[folderId]/FolderContent.tsx`

- [ ] **Step 1: 添加"开始学习"按钮**

在 FolderContent.tsx 中添加激活笔记的函数和状态：

```tsx
const [activating, setActivating] = useState(false);
const [activatedCount, setActivatedCount] = useState<number | null>(null);

const handleStartLearning = async () => {
  setActivating(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? "";
    const response = await fetch("/api/review/activate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ folder_id: folderId }),
    });
    if (response.ok) {
      const data = await response.json();
      setActivatedCount(data.activated_count || 0);
      // 刷新笔记列表
      await refreshItems();
    }
  } catch (error) {
    console.error("激活笔记失败:", error);
  } finally {
    setActivating(false);
  }
};
```

在页面头部（搜索栏上方）添按钮：

```tsx
{/* 开始学习按钮 */}
{items.length > 0 && (
  <button
    onClick={handleStartLearning}
    disabled={activating}
    className="px-4 py-2 rounded-full bg-[#B8860B] hover:bg-[#8B6914] text-white text-sm font-medium transition-colors disabled:opacity-50"
  >
    {activating ? "激活中..." : "开始学习"}
  </button>
)}

{/* 激活提示 */}
{activatedCount !== null && activatedCount > 0 && (
  <p className="text-sm text-[#B8860B]">
    已激活 {activatedCount} 张笔记，开始复习吧！
  </p>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/library/[folderId]/FolderContent.tsx
git commit -m "feat: add start learning button in folder view"
```

---

## 实施检查清单

在完成所有任务后，验证以下功能：

1. **复习页面** (`/dashboard/review`)
   - [ ] 显示待复习的笔记
   - [ ] 点击"显示答案"显示答案
   - [ ] 点击 Again/Hard/Good/Easy 评分
   - [ ] 评分后自动进入下一张
   - [ ] 全部完成后显示完成页面

2. **学习进度页面** (`/dashboard/progress`)
   - [ ] 显示所有文件夹的进度条
   - [ ] 显示总笔记数和已激活数

3. **导航栏**
   - [ ] 侧边栏有 Review 入口

4. **Dashboard**
   - [ ] 显示"今日待复习"提醒（如有待复习）
   - [ ] 点击进入复习流程

5. **文件夹视图**
   - [ ] 有"开始学习"按钮
   - [ ] 点击后激活该文件夹下所有笔记
