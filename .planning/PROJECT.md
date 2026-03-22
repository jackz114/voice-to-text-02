# 笔记助手 (bijiassistant)

## What This Is

一款面向独立开发者的 AI 学习助手，帮助用户捕获、组织、并在正确的时间复习所学知识。用户可以在学习时录制音频（例如观看教程视频时）或粘贴文章，AI 自动提取知识点并按领域归类，基于艾宾浩斯遗忘曲线自动安排复习节点，主动提醒用户在最佳时间复习，解决"学了就忘、忘了再学"的核心痛点。

## Core Value

学习时零负担记录，AI 替你管理遗忘曲线——让你知道自己学过什么，并在遗忘前精准唤醒它。

## Requirements

### Validated

<!-- 现有代码库已实现的功能 -->

- ✓ 用户认证（Google OAuth + 邮箱/密码）— 已有 Supabase Auth
- ✓ PayPal 支付集成（一次性购买 + 订阅）— 已有 PayPal REST API
- ✓ 基础应用结构（Next.js App Router + Cloudflare Workers 部署）— 已有

### Active

<!-- 当前要构建的核心功能 -->

- [ ] 用户可以在学习时录制音频并上传到系统
- [ ] 系统自动将录音转写为文字（Whisper/AI 转写）
- [ ] 用户可以粘贴文章/笔记，让 AI 提取关键知识点
- [ ] AI 从转写文字或粘贴内容中提取结构化知识条目
- [ ] 知识条目按领域/主题自动归类（可人工调整）
- [ ] 每个知识条目基于艾宾浩斯遗忘曲线自动计算复习日期
- [ ] 系统在复习节点到达时主动提醒用户
- [ ] 用户可以查询自己的知识库（"我学过 XX 相关的什么？"）
- [ ] 用户可以标记复习完成，更新下一次复习时间
- [ ] 用户可以浏览自己的知识图谱（按领域分类的所有知识条目）

### Out of Scope

- 移动端 App — 先做 Web，后续再扩展
- 多人协作/知识分享 — 这是个人工具，不做社区功能
- 直接处理视频文件 — 用户录音即可，不需要上传视频
- 实时转写 — 先做录音后上传转写，控制复杂度

## Context

**用户画像**：独立开发者，学习内容横跨技术（编程、框架、工具）和商业运营（账号运营、营销、产品），学习来源多元（文章、视频、课程、实践）。

**核心洞察**：用户曾用 Xmind 做思维导图，学习时有效，但没有复习机制所以放弃了。艾宾浩斯遗忘曲线是用户认可的科学方法，但手动管理复习节点负担太重——这正是 AI 应该接管的部分。

**开发路径**：语音转写是 MVP 第一步（先解决"如何输入"），后续再叠加 AI 知识提取、分类、遗忘曲线调度等智能层。

**现有代码库状态**：Auth 和 Payment 已完成 UI 层，但数据库尚未接入（无 Drizzle schema 文件，DB 写入均为 TODO 占位符）。语音转写功能尚未实现。

## Constraints

- **技术栈**：Next.js 16 + React 19 + TypeScript + Tailwind CSS v4，部署到 Cloudflare Workers — 保持一致，不引入不兼容的运行时
- **数据库**：Supabase Postgres + Drizzle ORM — 需先建 schema 文件
- **音频存储**：Supabase Storage — 已有账号和集成基础
- **转写 API**：优先 OpenAI Whisper API — 成熟稳定，Cloudflare Workers AI 作为备选
- **依赖**：现有 Auth 系统必须先打通（数据库层），才能关联用户数据

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 语音录制作为 MVP 输入方式 | 用户学视频时最自然，不打断学习流 | — Pending |
| 艾宾浩斯曲线作为复习算法 | 用户熟悉且认可，有科学依据 | — Pending |
| Web 优先，不做移动端 | 降低复杂度，先跑通核心循环 | — Pending |
| 现有代码库继续迭代 | Auth + Payment 已有基础，不从零开始 | — Pending |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after initialization*
