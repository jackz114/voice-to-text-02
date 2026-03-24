# Phase 2: Review Loop - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

用户可以浏览已保存的知识库、完成每日 FSRS 复习会话，并通过音频录制捕获新知识。包含四个核心能力：知识库浏览、复习工作流、音频录制/转写、FSRS 评分调度。

**范围调整**：音频录制从 Phase 1 推迟到此 Phase（D-06 决策）。

</domain>

<decisions>
## Implementation Decisions

### 知识库浏览

- **LIB-01:** 布局采用**混合模式**——默认列表视图，支持一键切换为网格卡片
- **LIB-02:** 导航采用**左侧边栏领域导航**——类似邮箱文件夹列表，点击领域筛选
- **LIB-03:** 信息显示：**标题 + 领域 + 下次复习时间 + 内容前50字预览**
- **LIB-04:** 双模式设计：
  - **浏览模式**（默认）：移动端左滑删除/操作，Web 端悬停显示操作按钮
  - **选择模式**（批量）：长按/点击选择按钮进入，Shift+Click 范围选择，显示批量操作栏

### 复习界面

- **REVIEW-01:** 布局采用**横向滑动卡片堆**（Tinder 风格）——滑动或点击评分按钮切换卡片
- **REVIEW-02:** 揭示模式采用**点击揭示**——初始只显示标题，点击后揭示完整内容（主动回忆）
- **REVIEW-03:** 返回路径：**复习完成后回到知识库列表**

### 音频录制

- **AUDIO-01:** 录音按钮位置：**仅在 /capture 页面**
- **AUDIO-02:** 切换方式：**并列显示**——文字粘贴区域和音频录制同时显示，用户任意选择
- **AUDIO-03:** 录制状态显示：**页面内嵌**——非全屏，显示倒计时和波形动画
- **AUDIO-04:** 支持暂停/继续（后台录制继续，用户可切换 Tab）

### FSRS 评分

- **FSRS-01:** 评分按钮排列：**横向四按钮**（标准 Anki 风格）
- **FSRS-02:** 4 级评分维度（带表情符号）：
  - 😵 完全忘记（重设间隔）= Again
  - 😐 模糊记得（短期复习）= Hard
  - 🙂 准确回忆（正常间隔）= Good
  - 🚀 秒答且轻松（拉长间隔）= Easy
- **FSRS-03:** 防作弊机制：连续多次选择"🚀 秒答"时，偶尔（每 5 次）弹出轻提示："真的这么轻松吗？如果下次忘了，进度会重置哦。"
- **FSRS-04:** 事后修正：复习完成后提供"刚才评错了"入口，限时 1 分钟内可修改评分

### Claude's Discretion

- 滑动卡片的动画细节和过渡效果
- 波形动画的视觉样式和颜色
- 领域边栏的折叠/展开交互
- 轻提示弹出的具体文案和样式
- 评分按钮上是否显示"下次复习时间"预览
- 录音文件上传的进度指示方式

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Requirements
- `.planning/REQUIREMENTS.md` § LIB-01~03 — 知识库浏览要求
- `.planning/REQUIREMENTS.md` § FSRS-01~04 — FSRS 调度要求
- `.planning/REQUIREMENTS.md` § REVIEW-01~04 — 每日复习要求
- `.planning/REQUIREMENTS.md` § AUDIO-01~03 — 音频录制要求
- `.planning/REQUIREMENTS.md` § TRANS-01~03 — 转写要求

### Prior Phase Context
- `.planning/phases/01-capture-pipeline/01-CONTEXT.md` § Audio Recording UX — Phase 1 推迟的音频录制决策
- `.planning/phases/01-capture-pipeline/01-CONTEXT.md` § Knowledge Item Structure — 知识条目字段定义

### Existing Codebase
- `.planning/codebase/CONVENTIONS.md` — 代码风格、命名规范、错误处理模式
- `.planning/codebase/ARCHITECTURE.md` — 系统架构和集成点
- `.planning/codebase/STRUCTURE.md` — 目录结构和新增代码位置指南

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/capture/ConfirmationCards.tsx` — 卡片 UI 可作为复习卡片基础
- `AuthProvider.tsx` / `useAuth()` — 认证状态管理，所有新页面需要
- `src/db/schema.ts` — 数据库 schema 已包含 review_state 和 transcriptions 表
- `src/lib/supabase.ts` — Supabase 客户端单例

### Established Patterns
- **API 路由结构**: `src/app/api/[domain]/[action]/route.ts`
- **错误处理**: 自定义 Error 类 + try/catch + 特定 HTTP 状态码映射
- **Client 组件**: 使用 `"use client"` 指令
- **State 管理**: React `useState` + Context（无 Redux/Zustand）
- **Comments**: 简体中文

### Integration Points
- **Database**: review_state 表已包含 FSRS 字段（stability, difficulty, retrievability, next_review_at）
- **Storage**: Supabase Storage 直接上传（绕过 Workers 内存限制）
- **Auth**: 所有功能需在 `AuthProvider` 树下

### Technical Constraints
- **Cloudflare Workers 内存**: 128MB — 音频字节必须通过 signed URL 直接上传到 Supabase
- **Whisper API**: 25MB 文件大小上限
- **Next.js**: 部署到 Cloudflare Workers  via @opennextjs/cloudflare
- **FSRS**: 使用 `ts-fsrs` 库，服务器端计算

</code_context>

<specifics>
## Specific Ideas

- 滑动卡片要像 Tinder 一样流畅，有视觉反馈
- 复习按钮要带表情符号，降低心理压力
- 录音波形动画要简单轻量，不打断学习流
- 领域导航要像邮箱文件夹一样直观
- "事后修正"功能让用户敢于诚实评分

</specifics>

<deferred>
## Deferred Ideas

### Future Phases
- 复习统计仪表板（复习次数趋势、记忆曲线图）— Phase 3
- 音频文件上传（非实时录制）— v2
- 客户端音频预处理（降噪）— v2
- 实时转写（流式处理）— v2+

### Not In Scope
- 移动端原生录音控件
- 离线复习模式
- 复习提醒推送（Phase 3 的通知邮件不同）

</deferred>

---

*Phase: 02-review-loop*
*Context gathered: 2026-03-23*
