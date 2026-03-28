# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指引。

---

## 常用命令

```bash
# 启动开发服务器（端口 3000）
npm run dev

# Next.js 生产构建
npm run build

# Cloudflare Workers 构建（执行 opennextjs-cloudflare build）
npm run build:cloudflare

# 构建并部署到 Cloudflare 生产环境
npm run deploy

# 构建并部署到 Cloudflare staging 环境
npm run deploy:staging

# ESLint 代码检查（v9 flat config，配置文件为 eslint.config.mjs）
npm run lint

# 通过 wrangler 在本地运行 Cloudflare Workers 开发环境
npm run cf:dev

# 实时查看 Workers 日志
npm run cf:logs

# 管理 Workers Secrets
npm run cf:secret:list
npm run cf:secret:put <SECRET_NAME>
```

项目目前没有自动化测试。手动测试使用 PayPal Sandbox 环境（测试卡号：4111111111111111 | 12/25 | 123）。
本项目所在环境是Windows，所以当被要求部署到cloudflare上时，请直接推送代码到github上，由GitHub Actions自动构建并部署。

---

## 架构概述

**技术栈**：Next.js 16 App Router + React 19 + TypeScript（严格模式）+ Tailwind CSS v4，通过 `@opennextjs/cloudflare` 部署到 **Cloudflare Workers**。生产域名：`bijiassistant.shop`。

**后端**：Supabase（Auth + Postgres）+ Cloudflare R2（音频存储）。数据库表结构以 TypeScript interface 的形式定义在 `business_logic.md` 中，使用 Supabase 客户端直接操作数据库。

**当前开发进度**：Auth UI 和 PayPal 支付 UI 已完成。支付 API 路由中的数据库写入操作均已注释（TODO 占位符）。音频存储使用 Cloudflare R2，转录功能尚未实现。

---

## 认证系统

`AuthProvider`（`src/components/auth/AuthProvider.tsx`）是认证状态的唯一数据来源。它在 `layout.tsx` 中包裹整个应用，通过 React Context 暴露 `{ user, loading, signOut, refreshUser }`。使用导出的 `useAuth()` hook 来消费认证状态。

**已知重复问题**：`LoginForm`、`GoogleAuthButton`、`AuthCallbackHandler` 三个组件各自在内部直接创建 `supabase` 客户端实例，而未从 `src/lib/supabase.ts` 导入单例。这是一个已知的代码不一致问题。

**Google OAuth 登录流程**：

1. `GoogleAuthButton` 调用 `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "${origin}/auth/callback?redirect_to=..." } })`
2. Google 重定向回来后，`AuthCallbackHandler` 调用 `supabase.auth.exchangeCodeForSession(window.location.hash)` 交换 session
3. 成功后跳转到 `redirect_to` 参数指定的路径，若无则跳转至 `/`

**邮箱/密码流程**：`LoginForm` 同时处理登录（`signInWithPassword`）和注册（`signUp`）。注册时需要通过 Cloudflare Turnstile 人机验证——`LoginForm.tsx:127` 中的 sitekey `1x00000000000000000000AA` 是**测试密钥**，上生产前必须替换为真实密钥。

---

## 支付系统

### 组件架构

`PayPalButton` 和 `PayPalSubscriptionButton` 均从 `src/components/payment/PayPalButton.tsx` 导出。两者各自包裹独立的 `PayPalScriptProvider`（分别独立加载 PayPal SDK）。内部的 `PayPalButtonWrapper` / `PayPalSubscriptionWrapper` 子组件通过 `usePayPalScriptReducer` 处理 SDK 的加载与错误状态。

- `PayPalButton`：一次性购买。Props：`amount`（string）、`currency`（默认 `"USD"`）、`description`、`customId`、`onSuccess/onError/onCancel`。
- `PayPalSubscriptionButton`：周期性订阅。需要 `planId`（来自 `NEXT_PUBLIC_PAYPAL_PLAN_ID`）。`/payment` 页面的订阅 Tab 仅在该环境变量存在时才渲染此按钮。

### API 路由（`src/app/api/paypal/`）

所有服务端 PayPal 逻辑均使用 `paypal-client.ts` 中封装的函数，该文件负责 OAuth token 获取（`getPayPalAccessToken`）和 PayPal REST API 调用。

| 路由                  | 方法 | 功能说明                                                                                                                                                 |
| --------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create-order`        | POST | 验证金额和币种，调用 PayPal Orders v2 API，返回 `orderId`。支持的币种：`USD EUR GBP CNY JPY AUD CAD`。                                                   |
| `capture-order`       | POST | 捕获前先检查订单状态是否为 `APPROVED`（幂等处理：若已为 `COMPLETED` 则提前返回）。提取 `captureId`、`netAmount`、`paypalFee`。数据库写入为 TODO 占位符。 |
| `verify-subscription` | POST | 从 PayPal 获取订阅详情，校验状态为 `ACTIVE` 或 `APPROVAL_PENDING`。数据库写入为 TODO 占位符。                                                            |
| `webhook`             | POST | 通过回调 `POST /v1/notifications/verify-webhook-signature` 验证 PayPal webhook 签名。处理 8 种事件类型。所有 `handle*` 函数均为仅打印日志的占位存根。    |

**注意**：webhook 路由在内部重复实现了 `getPayPalAccessToken`，而未从 `paypal-client.ts` 导入——这是一个重复代码 Bug。

### 一次性支付流程

前端：`createOrder` → `POST /api/paypal/create-order` → 获取 `orderId` → 弹出 PayPal 支付窗口 → 用户授权 → `onApprove` → `POST /api/paypal/capture-order` → 触发 `onSuccess`。

### 订阅流程

前端：PayPal SDK `actions.subscription.create({ plan_id })` → 用户授权 → `onApprove` → `POST /api/paypal/verify-subscription` → 触发 `onSuccess`。

---

## 数据库 Schema（规划中，尚未实现）

目前仅以 TypeScript interface 定义在 `business_logic.md` 中，尚无 Drizzle schema 文件。各表说明：

- **`users`** — id、email、provider（email/google）、avatar_url、full_name
- **`transcriptions`** — user_id 外键、audio_url、text、status（pending/processing/completed/failed）、language、duration_seconds、cost_minutes
- **`payments`** — user_id 外键、paypal_order_id、amount、currency、status、payment_type（onetime/subscription）
- **`subscriptions`** — user_id 外键、paypal_subscription_id、paypal_plan_id、status（active/cancelled/expired/suspended）、current_period_end
- **`user_balances`** — user_id 主键/外键、total_minutes、used_minutes、remaining_minutes、subscription_status

所有表均需启用 Supabase RLS，每位用户只能通过 `auth.uid() = user_id` 条件访问自己的数据行（SELECT/INSERT/UPDATE/DELETE）。

---

## 代码风格

**Prettier**（`.prettierrc`）：双引号、使用分号、2 个空格缩进、100 字符行宽、LF 换行符、ES5 尾随逗号、箭头函数始终加括号。

**TypeScript**：已启用严格模式，路径别名 `@/*` 映射至 `src/*`。

**ESLint v9 flat config**（`eslint.config.mjs`）：`@typescript-eslint/no-unused-vars` 为警告级别（以下划线开头的变量豁免）；`react/react-in-jsx-scope` 和 `react/prop-types` 已关闭；`no-console` 已关闭。

**`"use client"` 指令**：凡使用 hooks、浏览器 API、事件处理器或 PayPal SDK 组件的组件，均须在文件顶部声明此指令。Server Component 是默认模式。

**环境变量访问**：服务端（API 路由、Server Components）可直接使用 `process.env.ANY_VAR`；客户端组件只能访问 `process.env.NEXT_PUBLIC_*` 前缀的变量。

---

## 环境变量

在项目根目录创建 `.env.local`（已加入 `.gitignore`，切勿提交）：

```env
# Supabase（从 Dashboard → Project Settings → API 获取）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # 仅服务端使用，请勿泄露

# PayPal（从 developer.paypal.com/dashboard 获取）
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...           # 仅服务端使用，请勿泄露
PAYPAL_WEBHOOK_ID=...              # 用于验证 webhook 签名
PAYPAL_API_URL=https://api-m.sandbox.paypal.com   # sandbox 环境；生产环境改为 api-m.paypal.com

# 可选——设置后才会显示 /payment 页面的订阅 Tab
NEXT_PUBLIC_PAYPAL_PLAN_ID=...

# 应用 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Cloudflare Workers 部署时，服务端 Secret 需通过 `wrangler secret put` 设置（不使用 `.env.local`）。CI/CD 所需的 `CLOUDFLARE_API_TOKEN` 也需在 GitHub 仓库 Settings 中配置。

---

## 部署

**Cloudflare Workers 配置**：`wrangler.toml`。入口文件：`.open-next/worker.js`。兼容日期：`2026-03-21`，兼容标志：`nodejs_compat_v2`。自定义域名路由：`bijiassistant.shop/*`。

**CI/CD**（`.github/workflows/deploy.yml`）：push 到 main/master 分支时触发。步骤：`npm ci` → `npm run build` → `opennextjs-cloudflare build` → `wrangler deploy`。

**`next.config.ts`**：已允许来自 `*.supabase.co` 和 `bijiassistant.shop` 的远程图片。

---

## 上线前待办清单（未完成项）

- [ ] 替换 `LoginForm.tsx:127` 中的 Turnstile 测试 sitekey
- [ ] 将 `PAYPAL_API_URL` 切换为 `https://api-m.paypal.com`
- [ ] 创建数据库 schema 并为全部 5 张表执行数据库迁移
- [ ] 为所有数据库表启用 Supabase RLS 策略
- [ ] 在 `capture-order`、`verify-subscription` 及 webhook 处理函数中实现数据库写入逻辑
- [ ] 在 PayPal Dashboard 中配置 Webhook 回调 URL
- [ ] 修复 webhook 路由中重复实现的 `getPayPalAccessToken`（应改为从 `paypal-client.ts` 导入）
- [ ] 实现语音录制/上传与转录 API（MediaRecorder、Supabase Storage、Whisper）

<!-- GSD:project-start source:PROJECT.md -->

## Project

**笔记助手 (bijiassistant)**

一款面向独立开发者的 AI 学习助手，帮助用户捕获、组织、并在正确的时间复习所学知识。用户可以在学习时录制音频（例如观看教程视频时）或粘贴文章，AI 自动提取知识点并按领域归类，基于艾宾浩斯遗忘曲线自动安排复习节点，主动提醒用户在最佳时间复习，解决"学了就忘、忘了再学"的核心痛点。

**Core Value:** 学习时零负担记录，AI 替你管理遗忘曲线——让你知道自己学过什么，并在遗忘前精准唤醒它。

### Constraints

- **技术栈**：Next.js 16 + React 19 + TypeScript + Tailwind CSS v4，部署到 Cloudflare Workers — 保持一致，不引入不兼容的运行时
- **数据库**：Supabase Postgres — 使用 Supabase 客户端直接操作，不引入 ORM 以减少 Cloudflare Workers 兼容性问题
- **音频存储**：Supabase Storage — 已有账号和集成基础
- **转写 API**：优先 OpenAI Whisper API — 成熟稳定，Cloudflare Workers AI 作为备选
- **依赖**：现有 Auth 系统必须先打通（数据库层），才能关联用户数据
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5.x - All source files under `src/`, config files (`next.config.ts`, `tailwind.config.ts`, `eslint.config.mjs`)
- CSS - Global styles at `src/app/globals.css` (Tailwind utility classes)

## Runtime

- Node.js 22.22.1 (detected via `node --version`)
- npm
- Lockfile: `package-lock.json` (lockfileVersion 3) - present and committed

## Frameworks

- Next.js 16.2.0 - Full-stack React framework; App Router pattern used throughout `src/app/`
- React 19.2.4 - UI library; React DOM 19.2.4
- Tailwind CSS 4.x - Utility-first CSS; configured in `tailwind.config.ts`, PostCSS via `postcss.config.mjs`
- `@tailwindcss/postcss` 4.x - PostCSS integration for Tailwind v4
- Zustand 5.0.12 - Client-side global state (declared dependency, usage not yet found in explored source)
- React Context API - Auth state via `src/components/auth/AuthProvider.tsx`
- react-hook-form 7.71.2 - Form management (declared dependency)
- Zod 4.3.6 - Schema validation (declared dependency, used for API input validation)
- `@opennextjs/cloudflare` 1.17.1 - Adapts Next.js for Cloudflare Workers deployment
- Wrangler 4.76.0 - Cloudflare Workers CLI for dev, deploy, secrets, and logs
- ESLint 9.x - Linting with flat config (`eslint.config.mjs`)
- `eslint-config-next` 16.2.0 - Next.js-specific ESLint rules
- `eslint-config-prettier` 10.1.8 - Disables ESLint rules that conflict with Prettier

## Key Dependencies

- `@supabase/supabase-js` 2.99.3 - Database client and auth SDK; used in `src/lib/supabase.ts`, `src/components/auth/AuthProvider.tsx`, `src/components/auth/LoginForm.tsx`, `src/components/auth/GoogleAuthButton.tsx`, `src/app/auth/callback/AuthCallbackHandler.tsx`
- `@paypal/react-paypal-js` 9.0.2 - PayPal React SDK; used in `src/components/payment/PayPalButton.tsx`
- `react-turnstile` 1.1.5 - Cloudflare Turnstile CAPTCHA widget; used in `src/components/auth/LoginForm.tsx`
- `@radix-ui/react-slot` 1.2.4 - Primitive slot component for composable UI
- `class-variance-authority` 0.7.1 - Variant-based className management
- `clsx` 2.1.1 - Conditional className merging
- `tailwind-merge` 3.5.0 - Merges conflicting Tailwind classes
- Geist Sans and Geist Mono - Google Fonts loaded via Next.js font optimization in `src/app/layout.tsx`

## Configuration

- `tsconfig.json` - `strict: true`, target `ES2017`, `@/*` path alias mapping to `./src/*`
- Module resolution: `bundler` mode
- `next.config.ts` - Remote image patterns for `*.supabase.co` and `bijiassistant.shop`; exposes `NEXT_PUBLIC_APP_URL`
- `tailwind.config.ts` - Content scoped to `src/app/**` and `src/components/**`
- `wrangler.toml` - Worker named `voice-to-text-02`, entry `".open-next/worker.js"`, compatibility date `2026-03-21`, `nodejs_compat_v2` flag, custom domain `bijiassistant.shop/*`, observability enabled
- `.env` and `.env.local` files present (contents not read)
- Required public vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_PAYPAL_PLAN_ID`
- Required secret vars: `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_API_URL`
- `eslint.config.mjs` - ESLint v9 flat config; TypeScript + React + Hooks + Prettier compatibility; `no-console: off`

## Platform Requirements

- Node.js 22.x
- `npm run dev` - Next.js dev server
- `npm run cf:dev` - Wrangler local dev (Cloudflare Workers emulation)
- Cloudflare Workers via OpenNext adapter
- `npm run deploy` - Builds with `opennextjs-cloudflare` then deploys via Wrangler
- `npm run deploy:staging` - Same but targets staging environment
- Custom domain: `bijiassistant.shop`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- React components: PascalCase `.tsx` — e.g., `AuthProvider.tsx`, `LoginForm.tsx`, `GoogleAuthButton.tsx`
- Next.js routes: lowercase `page.tsx`, `route.ts`, `layout.tsx`
- Utility/client modules: camelCase `.ts` — e.g., `paypal-client.ts`, `supabase.ts`
- API route handlers live in `src/app/api/<domain>/<action>/route.ts`
- React components: PascalCase named exports — `export function AuthProvider(...)`, `export function LoginForm(...)`
- Hooks: `use` prefix camelCase — `export function useAuth()`
- API handlers: named exports matching HTTP method — `export async function POST(...)`
- Private utilities: camelCase — `function generateInvoiceId()`, `function generateRequestId()`
- Async event handlers: `handle` prefix — `const handleSubmit = async (e) => ...`
- camelCase throughout
- Boolean state: descriptive noun — `loading`, `turnstileToken`
- Union literal state: typed string unions — `"login" | "register"`, `User | null`
- Prefix `_` for intentionally unused parameters (enforced by ESLint rule `argsIgnorePattern: "^_"`)
- PascalCase with `interface` keyword preferred over `type` for object shapes
- Interfaces named after domain concept — `AuthContextType`, `PayPalOrder`, `PayPalPurchaseUnit`, `LoginFormProps`
- Internal API-shape interfaces are file-private (not exported): `PayPalOrderAmount`, `PayPalPaymentCapture`
- Public types re-exported via `export type { PayPalOrder, PayPalPurchaseUnit }` at file bottom
- SCREAMING_SNAKE_CASE for module-level config — `PAYPAL_CLIENT_ID`, `PAYPAL_API_URL`

## Code Style

- Config: `.prettierrc`
- Double quotes (`"`) for strings
- Semicolons on
- 2-space indentation, no tabs
- Print width 100
- Trailing commas `es5`
- Arrow function parens always: `(x) => x`
- LF line endings
- Config: `eslint.config.mjs`
- TypeScript parser (`@typescript-eslint/parser`) with `projectService: true`
- Rules: `@typescript-eslint/recommended` + `react/recommended` + `react-hooks/recommended`
- `@typescript-eslint/no-unused-vars` is `warn` (not error); prefix `_` to suppress
- `no-console` is `off` — `console.log` and `console.error` are used freely
- `react/react-in-jsx-scope` is `off` (no `import React` needed)
- `react/prop-types` is `off` (TypeScript handles type checking)
- Prettier compat layer applied last, disabling format-conflicting ESLint rules

## Import Organization

- `@/` maps to `src/` (Next.js default, used in page files)

## Directive Patterns

- `src/app/page.tsx` — `"use client"` (uses client-side rendering)
- `src/components/auth/LoginForm.tsx` — `"use client"` (uses `useState`)
- `src/components/auth/AuthProvider.tsx` — `"use client"` (uses `useContext`, `useEffect`)
- `src/app/layout.tsx` — no directive (server component)
- `src/app/api/*/route.ts` — no directive (server-only API routes)

## Error Handling

- Wrap entire handler body in `try/catch`
- Validate input first; return `400` with `{ error, code }` shape before processing
- Check for domain-specific custom error classes (`instanceof PayPalError`) before generic catch
- Map known error codes to specific HTTP status codes (e.g., 422 for uncapturable orders)
- Generic fallback: `500` with `{ error: "...", code: "INTERNAL_ERROR" }`
- Log errors with `console.error("context:", error)` in catch block
- `try/catch/finally` inside async handlers
- `finally` always resets loading state: `setLoading(false)`
- Error messages extracted with: `error instanceof Error ? error.message : "fallback"`
- User-facing errors via `alert()` (simple approach, no toast library yet)
- Domain-specific errors extend `Error` with extra fields
- Pattern from `src/app/api/paypal/paypal-client.ts`:
- Check `response.ok` after every `fetch` call
- Parse error body with `.catch(() => ({}))` fallback to avoid double-throw
- Immediately throw domain error: `throw new PayPalError(..., response.status, errorData)`

## Logging

- `console.log(label, data)` for success/info events in API routes
- `console.error(label, error)` in catch blocks
- Verbose object logging in success path (e.g., logging payment capture summary)
- `no-console` ESLint rule is disabled — console usage is unrestricted

## Comments

- Multi-step procedures get numbered step comments: `// 步骤 1: 验证订单状态`
- Section dividers for logical blocks: `// 接口定义`, `// 错误类`, `// 获取 PayPal 访问令牌`
- Explanatory notes for non-obvious decisions: `// 官方推荐的最佳实践`
- No JSDoc/TSDoc annotations on functions (not used in this codebase)

## Function Design

## Module Design

- Named exports preferred over default exports for components and utilities
- Exception: Next.js page/layout files use `export default` (framework requirement)
- Types re-exported explicitly at file end: `export type { PayPalOrder, PayPalPurchaseUnit }`
- React context created with `createContext<Type | undefined>(undefined)`
- Custom hook (`useAuth`) throws descriptive error if used outside provider
- Provider and hook co-located in the same file (`AuthProvider.tsx`)

## State Management

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## Pattern Overview

- File-system based routing via Next.js App Router (`src/app/`)
- Client components use React Context for auth state propagation
- API routes are thin controllers delegating to a shared client module
- Deployed to Cloudflare Workers via `@opennextjs/cloudflare` adapter

## Layers

- Purpose: Render user-facing pages, trigger user interactions
- Location: `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/payment/page.tsx`, `src/app/auth/callback/page.tsx`
- Contains: React Server/Client components, page-level layout
- Depends on: Components layer, AuthProvider context
- Used by: End users via browser
- Purpose: Reusable UI and logic components grouped by domain
- Location: `src/components/auth/`, `src/components/payment/`
- Contains: `AuthProvider.tsx`, `GoogleAuthButton.tsx`, `LoginForm.tsx`, `UserNav.tsx`, `PayPalButton.tsx`
- Depends on: `src/lib/supabase.ts`, React Context
- Used by: Pages layer
- Purpose: Server-side endpoints handling payment operations with PayPal
- Location: `src/app/api/paypal/`
- Contains: `create-order/route.ts`, `capture-order/route.ts`, `verify-subscription/route.ts`, `webhook/route.ts`
- Depends on: `src/app/api/paypal/paypal-client.ts`
- Used by: Client components and external PayPal webhook calls
- Purpose: Centralized SDK initialization and typed helper functions
- Location: `src/app/api/paypal/paypal-client.ts`, `src/lib/supabase.ts`
- Contains: PayPal REST API helpers (`getPayPalAccessToken`, `createPayPalOrder`, `capturePayPalOrder`, `getSubscriptionDetails`), Supabase singleton client
- Depends on: Environment variables
- Used by: API routes, AuthProvider

## Data Flow

- Auth state: React Context (`AuthContext`) provided by `AuthProvider`, consumed via `useAuth()` hook
- No global client-side state library (no Redux, Zustand, etc.)

## Key Abstractions

- Purpose: Global authentication state and session management
- Examples: `src/components/auth/AuthProvider.tsx`
- Pattern: React Context + `createClient` from `@supabase/supabase-js`; exports `useAuth()` hook and the `supabase` client instance
- Purpose: Typed wrapper over PayPal REST API v2
- Examples: `src/app/api/paypal/paypal-client.ts`
- Pattern: Named async functions (`getPayPalAccessToken`, `createPayPalOrder`, `capturePayPalOrder`, `getSubscriptionDetails`) + custom `PayPalError` class for structured error propagation
- Purpose: Server-side API endpoints
- Examples: `src/app/api/paypal/*/route.ts`
- Pattern: Named export `POST` (or `GET`) functions receiving `NextRequest`, returning `NextResponse.json()`

## Entry Points

- Location: `src/app/page.tsx`
- Triggers: HTTP GET `/`
- Responsibilities: Landing page with navigation to `/login` and `/payment`
- Location: `src/app/layout.tsx`
- Triggers: Wraps every page
- Responsibilities: Mounts `AuthProvider`, sets global fonts and metadata
- Location: `src/app/auth/callback/page.tsx` + `src/app/auth/callback/AuthCallbackHandler.tsx`
- Triggers: OAuth redirect from Supabase/Google to `/auth/callback`
- Responsibilities: Finalize OAuth session exchange, redirect user
- Location: `src/app/api/paypal/webhook/route.ts`
- Triggers: HTTP POST from PayPal servers
- Responsibilities: Verify signature, dispatch to event-type handlers

## Error Handling

- API routes catch all errors and return `NextResponse.json({ error: "..." }, { status: 500 })`
- `PayPalError` custom class carries `statusCode` and `responseData` for upstream context
- Webhook returns HTTP 400 on invalid signature, HTTP 200 on all successfully received events

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->
