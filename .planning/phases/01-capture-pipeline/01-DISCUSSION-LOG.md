# Phase 1: Capture Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 1 — Capture Pipeline
**Areas discussed:** Audio Recording UX, Input Method Priority, Knowledge Confirmation Flow, Knowledge Item Structure

---

## Audio Recording UX (deferred to Phase 2)

| Option | Description | Selected |
|--------|-------------|----------|
| 导航栏固定按钮 | 随时可录，像 Google Assistant | ✓ |
| 首页大录音按钮 | 醒目，但离学习场景较远 | |
| 专用「学习」页面 | 录制 + 历史 + 知识库在一起 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 简单的倒计时 + 波形动画 | 轻量，不打断学习流 | ✓ |
| 完整控制面板 | 功能完整，但会分散注意力 | |
| 悬浮小球 | 像微信语音，沉浸感最强 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 按钮切换 | 开始录音 → 停止录音 | ✓ |
| 独立停止按钮 | 防止误触 | |
| 按住录音 | 松手即停（像微信） | |

| Option | Description | Selected |
|--------|-------------|----------|
| 支持暂停，生成一个文件 | 适合长教程 | ✓ |
| 不支持，一次录完 | 简单，适合短视频 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 录完直接上传 | 停止后自动处理 | ✓ |
| 录制中展开卡片 | 显示波形、计时、控制按钮 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 支持后台录制 | 切换 Tab 录音继续 | ✓ |
| 切换 Tab 自动暂停 | 简单，但打断学习流 | |

**Notes:** 录音按钮放导航栏，录制时显示倒计时和波形，支持暂停/继续，录完直接上传，支持后台录制。

---

## Input Method Priority

| Option | Description | Selected |
|--------|-------------|----------|
| 先做文字粘贴 | 验证 AI 提取质量，风险低 | ✓ |
| 先做音频录制 | MVP 核心，但复杂度最高 | |
| 同时做 | 技术风险高，但学习曲线完整 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 只粘贴内容 | AI 自动提取标题和来源 | ✓ |
| 粘贴 + 输入来源 | 简单询问内容来源 | |
| 粘贴 + 输入标题 + 来源 | 完整元数据 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 长内容 | 适合整篇文章，需分块处理 | ✓ |
| 短内容 | 适合笔记、段落 | |
| 无限制 | 前端不限制，后端按 Token 截断 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 下一阶段再扩展 | Phase 1 只做文字，Phase 2 加音频 | ✓ |
| 同一阶段后续 | 文字验证后直接加音频 | |

**Notes:** Phase 1 只做文字粘贴，AI 提取标题和来源，支持长内容（整篇文章）。音频录制推迟到 Phase 2。

---

## Knowledge Confirmation Flow

| Option | Description | Selected |
|--------|-------------|----------|
| 卡片式预览 | 每条知识用卡片展示，视觉清晰 | ✓ |
| 列表逐项确认 | 一行一条，单独确认/拒绝 | |
| 批量操作 | 先全部显示，用户选择保留的 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 支持编辑 | 修改标题、内容、标签 | ✓ |
| 只能确认/拒绝 | 不支持编辑 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 先预览，再编辑 | 预览发现问题，编辑修正 | ✓ |
| 先全存，再整理 | 保存后统一编辑 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 每张卡片独立确认/拒绝 | 灵活，用户有控制权 | ✓ |
| 全部保留或全部拒绝 | 简单，但可能保留无关内容 | |

**Notes:** 卡片式预览，支持编辑，先预览再编辑，每张卡片独立确认/拒绝。

---

## Knowledge Item Structure

| Option | Description | Selected |
|--------|-------------|----------|
| 标题 | 知识的核心概括，显示在卡片上 | ✓ |
| 内容 | 知识的具体内容 | ✓ |
| 来源 | 内容的来源，如文章链接 | ✓ |
| 领域标签 | AI 分类，如 "React", "SEO" | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| 短篇 | 100-200 字摘要，适合快速复习 | ✓ |
| 中篇 | 300-500 字，保留更多细节 | |
| 原文 | 不做摘要，保留完整原文 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 两者都有 | 树形分类 + 扁平标签 | ✓ |
| 树形分类 | 层层嵌套 | |
| 扁平标签 | 打标签，不限数量，可交叉 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 可以多个，不限数量 | 多选标签 | ✓ |
| 只能选一个 | 最相关的领域 | |
| 完全让用户选择 | 用户决定打什么标签 | |

**Notes:** 四个必需字段（标题、内容、来源、领域标签），短篇摘要（100-200 字），树形分类 + 扁平标签，标签可多选。

---

## Claude's Discretion

- 录制界面的具体配色和动画细节
- 卡片预览的精确布局（网格/列表切换）
- 编辑表单的具体字段排列
- 标签输入的交互方式（标签云 vs 输入框）
- 错误状态的具体提示文案

## Deferred Ideas

- 音频录制功能（MediaRecorder + 直接 Supabase Storage 上传）→ Phase 2
- Whisper 转写 API 集成 → Phase 2
- 转写后知识提取流程 → Phase 2
- 音频文件上传（非实时录制）→ 未来考虑
- 客户端音频预处理（降噪、静音去除）→ 未来考虑
- 实时转写（流式处理）→ 未来考虑
