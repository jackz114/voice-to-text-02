# 间隔重复复习系统设计

> 本文档描述 bijiassistant 项目的复习功能设计方案。

---

## 1. 概述

### 1.1 背景

用户可以创建笔记（Front/Back 闪卡格式），但缺乏复习机制来帮助记忆。本设计实现基于 SM-2 算法的间隔重复复习系统。

### 1.2 核心价值

- 学习时零负担记录，AI 替你管理遗忘曲线
- 让用户知道自己学过什么，并在遗忘前精准唤醒它

---

## 2. 设计决策

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 复习入口 | Dashboard 到期数量 + 导航栏复习入口 | 混合方式，既能首页提醒，也能直接进入 |
| 激活方式 | 文件夹级别 — "开始学习这个文件夹" | 用户批量激活文件夹下所有笔记 |
| 学习状态查看 | 单独的"学习进度"页面 | 导航有独立入口 |
| 闪卡界面 | 全屏沉浸（深色背景） | 版本 B，聚焦内容 |
| 复习流程 | Front → 显示 Back → Again/Hard/Good/Easy → 下一张 | 紧凑快速 |
| 完成后反馈 | "今日复习完成 ✓" + 下次复习时间 | 简洁明了 |
| 笔记抽取顺序 | 到期优先 + 偶尔穿插即将到期笔记 | 主要按紧急程度，偶尔穿插 |
| 算法方案 | 混合 — SM-2 参数存前端，计算在前端，记录同步后端 | 兼顾离线体验和数据持久 |

---

## 3. 数据模型

### 3.1 review_state 表

每张激活的笔记对应一条复习状态记录：

```typescript
interface ReviewState {
  id: string;              // UUID，主键
  user_id: string;         // 外键 -> users.id
  item_id: string;         // 外键 -> knowledge_items.id
  ease_factor: number;     // 难度系数，初始 2.5
  interval: number;         // 当前间隔天数
  repetitions: number;      // 连续正确次数
  status: "learning" | "reviewing" | "mastered"; // 学习状态
  next_review_at: string;  // 下次复习时间（ISO string）
  last_reviewed_at: string | null; // 最后复习时间
  created_at: string;      // 激活时间
  updated_at: string;      // 更新时间
}
```

### 3.2 状态说明

- **learning（学习中）**：刚激活，间隔为 1 天
- **reviewing（复习中）**：已经过初始学习阶段，进入正常复习周期
- **mastered（已掌握）**：连续正确次数达到阈值（如 5 次），可标记为已掌握

---

## 4. SM-2 算法实现

### 4.1 复习后计算

用户选择难度后，计算新的间隔和下次复习时间：

```
if (rating === "again") {
  // 重置为初始状态
  interval = 1;
  repetitions = 0;
  ease_factor = max(1.3, ease_factor - 0.2);
} else if (rating === "hard") {
  interval = Math.round(interval * 1.2);
  ease_factor = max(1.3, ease_factor - 0.15);
} else if (rating === "good") {
  interval = Math.round(interval * ease_factor);
} else if (rating === "easy") {
  interval = Math.round(interval * ease_factor * 1.3);
  ease_factor = ease_factor + 0.15;
}

repetitions += 1;
next_review_at = now + interval * 24 * 60 * 60 * 1000;
```

### 4.2 初始值

笔记被激活时：

```typescript
{
  ease_factor: 2.5,
  interval: 1,        // 1天后复习
  repetitions: 0,
  status: "learning",
  next_review_at: now + 1 * 24 * 60 * 60 * 1000
}
```

### 4.3 抽取逻辑

复习时按以下规则抽取笔记：

1. 获取所有 `next_review_at <= now` 的笔记
2. 按 `next_review_at` 升序排列（最紧急的在前）
3. 每第 5 张笔记时，穿插一张 `next_review_at` 在未来 1-2 天内的笔记

---

## 5. 页面结构

### 5.1 复习入口

**Dashboard (`/dashboard`)**

- 显示"今日待复习：X 张"提醒
- 点击进入复习流程

**导航栏**

- 添加"复习"入口
- 显示当前到期数量 badge

**学习进度页面 (`/dashboard/progress`)**

- 独立页面，查看所有文件夹的学习进度
- 每个文件夹显示进度条：已激活数 / 总数

### 5.2 文件夹视图增强

在 `/dashboard/library/[folderId]` 的 FolderContent 组件中添加：

- **"开始学习"按钮**：激活该文件夹下所有未激活的笔记
- **开始学习后显示**：该文件夹下笔记的复习状态

### 5.3 复习流程页面 (`/dashboard/review`)

**路由参数**：`/dashboard/review?folder=xxx`（可选，指定文件夹）

**界面**：全屏沉浸风格（版本 B）

```
┌────────────────────────────────────┐
│  ← 返回                    3/20    │
│                                    │
│                                    │
│                                    │
│         什么是闭包？                │
│                                    │
│                                    │
│    ┌──────────────────────────┐   │
│    │      显示答案             │   │
│    └──────────────────────────┘   │
│                                    │
└────────────────────────────────────┘
```

点击"显示答案"后：

```
┌────────────────────────────────────┐
│  ← 返回                    3/20    │
│                                    │
│                                    │
│         什么是闭包？                │
│                                    │
│    ┌──────────────────────────┐   │
│    │ 闭包是指...              │   │
│    └──────────────────────────┘   │
│                                    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│  │Again│ │Hard│ │Good│ │Easy│    │
│  └────┘ └────┘ └────┘ └────┘    │
└────────────────────────────────────┘
```

### 5.4 复习完成页面

```
┌────────────────────────────────────┐
│                                    │
│                                    │
│            ✓                       │
│                                    │
│      今日复习完成！                 │
│                                    │
│      下次复习：明天                 │
│                                    │
│       ┌──────────┐                │
│       │  返回首页  │                │
│       └──────────┘                │
│                                    │
└────────────────────────────────────┘
```

### 5.5 学习进度页面 (`/dashboard/progress`)

```
┌────────────────────────────────────┐
│  学习进度                          │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ default                      │ │
│  │ ████████░░░░░░░░  8/20      │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 测试文件夹1                   │ │
│  │ ██████████████░░  15/20     │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ JavaScript                   │ │
│  │ ░░░░░░░░░░░░░░░░░  0/10     │ │
│  └──────────────────────────────┘ │
│                                    │
│  统计：                             │
│  • 总笔记数：50                     │
│  • 学习中：23                       │
│  • 复习中：15                       │
│  • 已掌握：12                       │
│                                    │
└────────────────────────────────────┘
```

---

## 6. API 设计

### 6.1 激活笔记（批量）

```
POST /api/review/activate
Body: { folder_id: string | null }  // null 表示激活所有未激活的笔记
Response: { activated_count: number, items: ReviewState[] }
```

### 6.2 获取今日待复习

```
GET /api/review/due?folder=xxx  // 可选参数
Response: { items: KnowledgeItemWithReview[], count: number }
```

### 6.3 提交复习结果

```
POST /api/review/submit
Body: {
  item_id: string,
  rating: "again" | "hard" | "good" | "easy",
  // 计算后的新状态（前端计算好一起传）
  interval: number,
  ease_factor: number,
  repetitions: number,
  next_review_at: string
}
Response: { success: boolean, next_item?: KnowledgeItem }
```

### 6.4 获取复习进度

```
GET /api/review/progress
Response: {
  folders: {
    id: string,
    name: string,
    total: number,
    activated: number,
    mastered: number
  }[],
  stats: {
    total: number,
    learning: number,
    reviewing: number,
    mastered: number
  }
}
```

---

## 7. 实现计划

### Phase 1: 数据层
- [ ] 创建 review_state 表（如果不存在）
- [ ] 添加必要的 RLS 策略
- [ ] 实现 API 路由

### Phase 2: 前端界面
- [ ] 创建复习流程页面 `/dashboard/review`
- [ ] 创建学习进度页面 `/dashboard/progress`
- [ ] 在 Dashboard 添加复习入口
- [ ] 在导航栏添加复习入口
- [ ] 在文件夹视图添加"开始学习"按钮

### Phase 3: 核心逻辑
- [ ] 实现 SM-2 算法
- [ ] 实现笔记抽取逻辑
- [ ] 实现复习完成反馈

### Phase 4: 完善
- [ ] 添加连续学习天数统计
- [ ] 复习历史记录

---

## 8. 后续可扩展功能

- **推送提醒**：到期时浏览器通知
- **每日目标**：设置每天复习多少张
- **已掌握笔记**：用户可手动标记为"已掌握"不再复习
- **导出/导入**：导出复习数据到 Anki 格式
