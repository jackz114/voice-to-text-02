# AGENTS.md - AI Coding Agent Guide

> 本项目文档面向 AI 编程助手。阅读本文档以了解项目架构、技术栈和开发规范。

## 项目概述

**voice-to-txt-02** 是一个基于 Next.js 的现代 Web 应用项目，使用 React 19 和 TypeScript 构建。项目采用最新的 Next.js App Router 架构，集成了 Supabase 后端服务，并计划部署到 Cloudflare Workers。

### 核心功能方向
- 语音转文本 (Voice-to-Text) 应用
- 用户认证与数据存储（通过 Supabase）
- 表单处理与状态管理

## 技术栈

### 前端框架
- **Next.js**: 16.2.0 (App Router 模式)
- **React**: 19.2.4
- **React DOM**: 19.2.4
- **TypeScript**: 5.x

### 样式与 UI
- **Tailwind CSS**: v4 (使用 `@tailwindcss/postcss`)
- **Geist 字体**: Vercel 开源字体家族 (Sans + Mono)
- 支持暗黑模式 (`prefers-color-scheme: dark`)

### 后端与数据库
- **Supabase**: 后端即服务 (BaaS)
  - `@supabase/supabase-js`: JavaScript 客户端
  - 使用匿名密钥和服务角色密钥两种认证方式
- **Drizzle ORM**: 0.45.1 - TypeScript ORM
  - `drizzle-kit`: 数据库迁移和管理工具

### 状态管理与表单
- **Zustand**: 5.0.12 - 轻量级状态管理
- **React Hook Form**: 7.71.2 - 表单处理
- **Zod**: 4.3.6 - 运行时类型验证

### 其他依赖
- **Radix UI**: `@radix-ui/react-slot` - 无头 UI 组件基元
- **class-variance-authority (CVA)**: 组件变体管理
- **clsx + tailwind-merge**: 条件类名处理
- **react-turnstile**: Cloudflare Turnstile CAPTCHA 集成

### 部署
- **@opennextjs/cloudflare**: 1.17.1 - Cloudflare Workers 适配器
- **wrangler**: 4.76.0 - Cloudflare CLI 工具

## 项目结构

```
voice-to-txt-02/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── favicon.ico         # 网站图标
│   │   ├── globals.css         # 全局样式 (Tailwind 导入)
│   │   ├── layout.tsx          # 根布局组件
│   │   └── page.tsx            # 首页组件
│   └── lib/
│       └── supabase.ts         # Supabase 客户端初始化
├── public/                     # 静态资源
│   ├── next.svg
│   ├── vercel.svg
│   ├── file.svg
│   ├── globe.svg
│   └── window.svg
├── 官方文档/                   # 项目文档
│   └── supabase/
│       └── Data REST API/
│           └── Security/
│               └── How API Keys work.md
├── .env.local                  # 本地环境变量
├── .prettierrc                 # Prettier 配置
├── eslint.config.mjs           # ESLint v9 Flat Config
├── next.config.ts              # Next.js 配置
├── postcss.config.mjs          # PostCSS 配置
├── tailwind.config.ts          # Tailwind CSS 配置
└── tsconfig.json               # TypeScript 配置
```

## 代码组织规范

### 目录约定
- `src/app/`: 所有页面组件和路由
- `src/lib/`: 第三方库封装和工具函数
- `src/components/`: 共享组件 (当前为空，建议创建)

### 路径别名
- `@/*` 映射到 `./src/*`
- 示例: `import { supabase } from "@/lib/supabase"`

## 构建与运行命令

```bash
# 开发服务器 (端口 3000)
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint
```

### 数据库相关 (Drizzle)
```bash
# 注意：drizzle-kit 已安装但未在 package.json scripts 中配置
# 可以手动运行:
npx drizzle-kit generate
npx drizzle-kit migrate
npx drizzle-kit studio
```

### Cloudflare 部署
```bash
# 使用 wrangler 部署到 Cloudflare Workers
npx wrangler deploy
```

## 代码风格规范

### Prettier 配置 (`.prettierrc`)
- 使用分号 (`semi: true`)
- 双引号 (`singleQuote: false`)
- 缩进: 2 个空格 (`tabWidth: 2`)
- 换行符: LF (`endOfLine: "lf"`)
- 行宽: 100 字符 (`printWidth: 100`)
- 尾随逗号: ES5 兼容 (`trailingComma: "es5"`)
- 箭头函数始终使用括号 (`arrowParens: "always"`)

### ESLint 配置 (`eslint.config.mjs`)
- 使用 ESLint v9 Flat Config 格式
- **策略**: ESLint 负责逻辑错误与最佳实践，Prettier 负责代码风格
- 已配置的规则集:
  - `@eslint/js` - JavaScript 推荐规则
  - `@typescript-eslint` - TypeScript 规则
  - `eslint-plugin-react` - React 规则
  - `eslint-plugin-react-hooks` - React Hooks 规则
  - `eslint-config-prettier` - 关闭与 Prettier 冲突的规则

#### 关键 ESLint 规则
- `@typescript-eslint/no-unused-vars`: 警告级别，允许 `_` 前缀的未使用变量
- `react/react-in-jsx-scope`: 关闭 (Next.js 自动引入 React)
- `react/prop-types`: 关闭 (使用 TypeScript 类型检查)
- `no-console`: 关闭 (开发调试方便)

### 忽略的文件
- `node_modules/`
- `.next/`
- `dist/`
- `.wrangler/`
- `coverage/`
- `*.min.js`
- `*.md`, `*.json`

## 环境变量配置

创建 `.env.local` 文件并配置以下变量:

```env
# Supabase 配置 (客户端使用)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase 服务角色密钥 (仅服务端使用)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 安全提示
- `NEXT_PUBLIC_*` 前缀的变量会暴露给客户端
- `SUPABASE_SERVICE_ROLE_KEY` 拥有超级管理员权限，**切勿**暴露到客户端
- `.env.local` 已添加到 `.gitignore`

## 样式系统

### Tailwind CSS v4 配置
- 使用新的 `@import "tailwindcss"` 语法
- 内容路径:
  - `./src/app/**/*.{js,ts,jsx,tsx}`
  - `./src/components/**/*.{js,ts,jsx,tsx}`

### 主题配置 (`globals.css`)
```css
@theme inline {
  --color-background: #ffffff;
  --color-foreground: #171717;
  --font-sans: "Geist", system-ui, sans-serif;
}
```

### 暗黑模式支持
- 使用 CSS 媒体查询 `prefers-color-scheme: dark`
- 暗黑模式色值:
  - Background: `#0a0a0a`
  - Foreground: `#ededed`

## 开发注意事项

### TypeScript 严格模式
- `strict: true` 已启用
- 确保所有代码都通过类型检查

### React 版本特性
- 使用 React 19，支持新的客户端指令和特性
- Server Components 为默认，需要 `'use client'` 指令才使用客户端特性

### 已知限制
- 项目目前处于早期阶段，主要结构为 Next.js 默认模板
- `src/lib/supabase.ts` 需要有效的环境变量才能正常工作
- 未配置测试框架（Jest/Vitest/Playwright 等）

## 推荐扩展

### 建议添加的功能
1. **测试框架**: Vitest + React Testing Library + Playwright
2. **API 路由**: 在 `src/app/api/` 下创建服务端 API
3. **数据库 Schema**: 在 `src/db/schema.ts` 定义 Drizzle 模型
4. **组件库**: 可扩展 Radix UI 构建设计系统
5. **CI/CD**: GitHub Actions 工作流配置

### 文档参考
- `/官方文档/supabase/` - Supabase 相关文档

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

*最后更新: 2026-03-20*
