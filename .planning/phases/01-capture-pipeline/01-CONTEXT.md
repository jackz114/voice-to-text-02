# Phase 1: Capture Pipeline - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

用户可以通过**文字粘贴**捕获知识，AI 从粘贴内容中提取结构化知识条目，用户确认后存储到数据库。

**范围调整**：音频录制功能推迟到 Phase 2（从原定 Phase 1 中移除）。原因：先验证文字输入的 AI 提取质量，降低 Phase 1 复杂度。

</domain>

<decisions>
## Implementation Decisions

### Audio Recording UX (deferred to Phase 2)
- **D-01:** 录音按钮位置：导航栏固定（随时可录）
- **D-02:** 录制中显示：简单倒计时 + 波形动画（轻量，不打断学习流）
- **D-03:** 停止方式：按钮切换（开始录音 → 停止录音）
- **D-04:** 暂停/继续：支持暂停（后台状态），录完直接上传
- **D-05:** 后台录制：支持后台录制，录音继续（用户可切换到其他 Tab）

### Input Method Priority
- **D-06:** Phase 1 只做文字粘贴输入，音频录制推迟到 Phase 2
- **D-07:** 粘贴输入只需提供内容，AI 自动提取标题和来源（零负担）
- **D-08:** 支持长内容粘贴（整篇文章），后端需分块处理

### Knowledge Confirmation Flow
- **D-09:** 展示方式：卡片式预览（视觉上清晰）
- **D-10:** 编辑支持：支持编辑（修改标题、内容、标签）
- **D-11:** 时机：先预览，再编辑，确认后才写入数据库
- **D-12:** 筛选：每张卡片独立确认/拒绝（用户可选择只保留部分）

### Knowledge Item Structure
- **D-13:** 字段：标题、内容、来源、领域标签（四个必需字段）
- **D-14:** 内容长度：短篇（100-200 字摘要），适合 FSRS 复习
- **D-15:** 组织方式：两者都有——树形分类（层级）+ 扁平标签（交叉）
- **D-16:** 标签：可以多个，不限数量（AI 自动生成，用户可修改）

### Claude's Discretion
- 录制界面的具体配色和动画细节
- 卡片预览的精确布局（网格/列表切换）
- 编辑表单的具体字段排列
- 标签输入的交互方式（标签云 vs 输入框）
- 错误状态的具体提示文案

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Requirements
- `.planning/REQUIREMENTS.md` § v1 Requirements — Phase 1 涵盖的要求（AUDIO-* 和 TRANS-* 推迟到 Phase 2）
- `.planning/REQUIREMENTS.md` § TEXT-01~02 — 文字粘贴输入要求
- `.planning/REQUIREMENTS.md` § EXTRACT-01~05 — AI 知识提取要求
- `.planning/REQUIREMENTS.md` § LIB-01~03 — 知识库浏览要求（Phase 2 部分）

### Research Findings
- `.planning/research/FEATURES.md` § MVP Recommendation — 功能依赖树和阶段建议
- `.planning/research/ARCHITECTURE.md` § Build Order — 建议先文字后音频的技术原因
- `.planning/research/PITFALLS.md` § LLM hallucination — 用户确认步骤的必要性

### Existing Codebase
- `.planning/codebase/CONVENTIONS.md` — 代码风格、命名规范、错误处理模式
- `.planning/codebase/STRUCTURE.md` — 目录结构和新增代码位置指南

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AuthProvider.tsx` / `useAuth()` — 认证状态管理，所有新页面都需要
- `src/lib/supabase.ts` — Supabase 客户端单例，用于直接 Storage 上传
- PayPal 客户端模式 (`paypal-client.ts`) — API 路由错误处理参考模式

### Established Patterns
- **API 路由结构**: `src/app/api/[domain]/[action]/route.ts`，共享逻辑放 `[domain]-client.ts`
- **错误处理**: 自定义 Error 类 + try/catch + 特定 HTTP 状态码映射
- **Client 组件**: 使用 `"use client"` 指令，hooks 放在文件底部
- **注释语言**: 简体中文

### Integration Points
- **Auth**: 所有功能需在 `AuthProvider` 树下（已在 `layout.tsx` 包裹）
- **Storage**: Supabase Storage 直接上传（绕过 Cloudflare Workers 内存限制）
- **Database**: 需新建 Drizzle schema 文件（尚无）

### Technical Constraints
- **Cloudflare Workers 内存**: 128MB — 音频/文件字节不能通过 API 路由
- **Whisper API 限制**: 25MB 文件大小上限（音频分块或压缩）
- **Next.js body limit**: 默认 1MB — 大内容需用 Server Action 或流式上传

</code_context>

<specifics>
## Specific Ideas

- 录音按钮要像 Google Assistant 一样随时可用，不打断学习流
- 卡片预览要像 Linear 的 issue cards 一样干净、不杂乱
- 零负担输入——用户只需粘贴，AI 处理其余一切
- 短篇摘要（100-200 字）是 FSRS 复习的最佳长度

</specifics>

<deferred>
## Deferred Ideas

### Moved to Phase 2
- 音频录制功能（MediaRecorder + 直接 Supabase Storage 上传）
- Whisper 转写 API 集成
- 转写后知识提取流程

### Future Considerations
- 音频文件上传（非实时录制）
- 客户端音频预处理（降噪、静音去除）
- 实时转写（流式处理）

</deferred>

---

*Phase: 01-capture-pipeline*
*Context gathered: 2026-03-22*
