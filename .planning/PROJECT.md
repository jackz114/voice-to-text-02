# 笔记助手 (bijiassistant)

## What This Is

一款面向独立开发者的 AI 学习助手，帮助用户捕获、组织、并在正确的时间复习所学知识。用户可以在学习时录制音频（例如观看教程视频时）或粘贴文章，AI 自动提取知识点并按领域归类，基于 FSRS 算法自动安排复习节点，主动提醒用户在最佳时间复习，解决"学了就忘、忘了再学"的核心痛点。

## Core Value

学习时零负担记录，AI 替你管理遗忘曲线——让你知道自己学过什么，并在遗忘前精准唤醒它。

---

## Current State (v1.0 Shipped)

**Shipped:** 2026-03-24
**Code:** ~8,146 lines TypeScript
**Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Supabase + Cloudflare Workers

### What Works

- **Audio Capture**: Browser recording with MediaRecorder, direct upload to Supabase Storage
- **Transcription**: OpenAI Whisper API (gpt-4o-mini-transcribe)
- **Text Input**: Paste articles, manual title/source editing
- **AI Extraction**: GPT-4o-mini extracts structured knowledge items with Zod validation
- **Confirmation Workflow**: User reviews/edits before DB write (mitigates hallucination)
- **Knowledge Library**: Domain-filtered browsing, grid/list views, delete with confirmation
- **FSRS Scheduling**: ts-fsrs algorithm, Again/Hard/Good/Easy ratings, automatic next-review calculation
- **Daily Review**: "Due today" queue with persistent session
- **Search**: PostgreSQL full-text search (tsvector), Cmd+K global modal, full search page with filters
- **Notifications**: Resend email service, Cloudflare Cron Trigger, timezone-aware daily digests
- **Preferences**: Email toggle, time picker, timezone selector, domain filters

### v1.0 Known Gaps

- Turnstile test sitekey (must replace before production)
- PayPal webhook implementation incomplete
- End-to-end integration testing (deferred until production deployment)

---

## Requirements

### Validated (v1.0)

- ✓ AUDIO-01~03: Audio capture with direct Storage upload
- ✓ TRANS-01~03: Whisper transcription
- ✓ TEXT-01~02: Text paste input
- ✓ EXTRACT-01~05: AI knowledge extraction with confirmation
- ✓ LIB-01~03: Knowledge library browsing
- ✓ FSRS-01~04: FSRS scheduling algorithm
- ✓ REVIEW-01~04: Daily review workflow
- ✓ NOTIFY-01~04: Email notifications with preferences
- ✓ SEARCH-01~03: Full-text search

### Active (Next Milestone)

- [ ] SEM-01: Semantic search with pgvector
- [ ] KNOW-01: Knowledge graph visualization
- [ ] KNOW-02: AI-generated quiz questions
- [ ] AUDIO-V2-01: Upload existing audio files
- [ ] MOBILE-01: PWA offline support

### Out of Scope

| Feature | Reason |
|---------|--------|
| 移动端 App | Web-first，PWA 足够；原生后续再考虑 |
| 多人协作/知识分享 | 个人工具定位，不做社交功能 |
| 视频文件处理 | 复杂度/存储成本过高，音频足够 |
| 实时转写 | 流式复杂度增加成本，上传后处理足够 |
| Gamification | 用户认可真实数据而非游戏化 |
| Obsidian 双向链接 | 维护成本过高，分类+搜索覆盖需求 |

---

## Context

**用户画像**：独立开发者，学习内容横跨技术（编程、框架、工具）和商业运营（账号运营、营销、产品）。

**核心洞察**：用户曾用 Xmind 做思维导图，学习时有效，但没有复习机制所以放弃了。FSRS 算法比艾宾浩斯更精确（相同记忆强度下 20-30% 更少复习）。

---

## Constraints

- **技术栈**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Cloudflare Workers
- **数据库**: Supabase Postgres + Drizzle ORM
- **音频存储**: Supabase Storage（直传，不经过 Worker）
- **转写**: OpenAI Whisper API
- **邮件**: Resend API

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FSRS over SM-2 | 20-30% fewer reviews for same retention | ✓ Validated — ts-fsrs stable |
| Direct Storage upload | Bypass Workers 128MB memory limit | ✓ Validated — audio never hits Worker |
| User confirmation step | LLM hallucination risk mitigation | ✓ Validated — users catch errors |
| tsvector full-text search | Native Postgres, no external service | ✓ Validated — fast, ranked results |
| Web-first, no mobile app | Lower complexity, validate core loop | ✓ Validated — desktop-first usage |

---

*Last updated: 2026-03-24 after v1.0 milestone*
