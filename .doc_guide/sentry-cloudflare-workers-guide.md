# Cloudflare Workers + Sentry 集成指南

> 适用场景：Next.js 项目通过 OpenNext 部署到 Cloudflare Workers

---

## 概述

本指南介绍如何在 Cloudflare Workers 环境中集成 Sentry 错误监控和性能追踪。

**重要提示**：
- 使用 `@sentry/cloudflare` 包（不是 `@sentry/nextjs`）
- Cloudflare Workers 不支持 `@sentry/nextjs` 的自动注入机制
- 需要通过 `withSentry` 手动包装 Worker handler

---

## 方案对比

| 方案 | 适用场景 | 复杂度 |
|------|----------|--------|
| `@sentry/cloudflare` + `withSentry` | Next.js + OpenNext → Cloudflare Workers | 中等 |
| `@sentry/nextjs` + `instrumentation.ts` | Next.js → Vercel/Node.js | 低（不适用于 Workers） |

---

## 集成步骤

### 1. 安装依赖

```bash
npm install @sentry/cloudflare --save
```

### 2. 配置 wrangler.jsonc

在 `wrangler.jsonc` 中添加 `nodejs_compat` 兼容标志（SDK 需要 `AsyncLocalStorage` API）：

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "voice-to-text-02",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-03-21",
  "compatibility_flags": ["nodejs_compat"],  // 添加此项

  // 可选：启用版本元数据（自动检测 release 版本）
  "version_metadata": {
    "binding": "CF_VERSION_METADATA"
  },

  // 可选：启用 source map 上传
  "upload_source_maps": true,

  // 环境变量
  "vars": {
    "NEXT_PUBLIC_APP_URL": "https://bijiassistant.shop"
  },

  // Sentry DSN 建议通过 secret 设置
  // wrangler secret put SENTRY_DSN
}
```

### 3. 创建 Sentry 包装器

由于 OpenNext 生成的是 `.open-next/worker.js`，需要创建自定义入口文件来包装 Sentry：

**创建 `src/worker-sentry.ts`：**

```typescript
import * as Sentry from "@sentry/cloudflare";

// 导入 OpenNext 生成的 worker
import worker from "../.open-next/worker.js";

// 包装原始的 fetch handler
const sentryWrappedWorker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return Sentry.withSentry(
      (env) => ({
        dsn: env.SENTRY_DSN,

        // 可选：发送默认 PII（用户 IP、请求头）
        sendDefaultPii: true,

        // 可选：性能追踪采样率（1.0 = 100%）
        tracesSampleRate: 1.0,

        // 可选：启用日志采集
        enableLogs: true,

        // 可选：环境区分
        environment: env.ENVIRONMENT || "production",

        // 自动从 CF_VERSION_METADATA 检测 release
        // 如需手动设置：release: env.SENTRY_RELEASE,
      }),
      {
        async fetch(request, env, ctx) {
          // 调用原始的 OpenNext worker
          return worker.fetch(request, env, ctx);
        },
      },
    ).fetch(request, env, ctx);
  },
};

export default sentryWrappedWorker;
```

**注意**：需要正确处理 TypeScript 类型。如果遇到类型错误，可以使用 `// @ts-ignore` 或创建类型声明文件。

### 4. 修改构建流程

由于需要自定义入口文件，调整构建步骤：

**修改 `package.json`：**

```json
{
  "scripts": {
    "build": "next build",
    "build:cloudflare": "npm run build && opennextjs-cloudflare build",

    // 添加 sentry 包装步骤（可选）
    "build:sentry": "npm run build:cloudflare && npm run wrap:sentry",
    "wrap:sentry": "esbuild src/worker-sentry.ts --bundle --outfile=.open-next/worker-sentry.js --format=esm --platform=neutral",

    // 修改部署命令使用 sentry 包装后的入口
    "deploy": "wrangler deploy .open-next/worker-sentry.js",
    "deploy:staging": "wrangler deploy .open-next/worker-sentry.js --env staging"
  }
}
```

**替代方案**：直接在构建后修改 `wrangler.jsonc` 的入口指向：

```jsonc
{
  // 构建后修改为 sentry 包装后的入口
  "main": ".open-next/worker-sentry.js"
}
```

### 5. 设置 Sentry DSN

```bash
# 添加 Sentry DSN 到 secrets
wrangler secret put SENTRY_DSN
# 输入: https://xxx@yyy.ingest.sentry.io/zzz

# 可选：设置环境标识
wrangler secret put ENVIRONMENT
# 输入: production
```

### 6. 上传 Source Maps（可选）

```bash
# 安装 Sentry CLI
npm install -D @sentry/cli

# 在构建后上传 source maps
npx sentry-cli sourcemaps upload --release=<version> .open-next/assets
```

或者在 `wrangler.jsonc` 中设置 `upload_source_maps: true` 并运行 Sentry Wizard：

```bash
npx @sentry/wizard@latest -i sourcemaps
```

---

## 在代码中手动捕获错误

### 客户端组件中

```typescript
"use client";

import * as Sentry from "@sentry/cloudflare";

export function MyComponent() {
  const handleClick = () => {
    try {
      // 某些操作
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  return <button onClick={handleClick}>Click</button>;
}
```

### API Route 中

```typescript
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/cloudflare";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // 处理请求
    return NextResponse.json({ success: true });
  } catch (error) {
    // 手动上报错误
    Sentry.captureException(error);
    return NextResponse.json({ error: "处理失败" }, { status: 500 });
  }
}
```

### 性能追踪

```typescript
import * as Sentry from "@sentry/cloudflare";

async function slowOperation() {
  return Sentry.startSpan(
    {
      op: "http.request",
      name: "Slow API Call",
    },
    async () => {
      // 执行耗时操作
      await fetch("https://api.example.com/data");
    }
  );
}
```

---

## 已知限制

1. **Span 持续时间显示为 0ms**
   - 在 Cloudflare Workers 环境中，`performance.now()` 和 `Date.now()` 只在 I/O 操作后才会推进
   - CPU 密集型操作会显示为 0ms 持续时间
   - 这是 Cloudflare 的安全措施，用于[缓解定时攻击](https://developers.cloudflare.com/workers/runtime-apis/performance/)

2. **Source Map 上传**
   - 需要在构建流程中额外配置
   - 可以使用 `wrangler.jsonc` 中的 `upload_source_maps: true` 或 Sentry CLI

3. **Next.js 自动仪器化不可用**
   - `@sentry/nextjs` 的自动 API route 包装在 Workers 环境下不工作
   - 需要手动包装或使用 `withSentry`

---

## 故障排查

### 错误："AsyncLocalStorage is not available"

确保 `wrangler.jsonc` 中设置了 `compatibility_flags: ["nodejs_compat"]`。

### 错误未上报到 Sentry

1. 检查 `SENTRY_DSN` secret 是否正确设置：
   ```bash
   wrangler secret list
   ```

2. 检查 DSN 格式是否正确：
   ```
   https://<public_key>@<host>/<project_id>
   ```

3. 在本地开发中测试：
   ```bash
   wrangler dev .open-next/worker-sentry.js
   ```

### Source maps 未生效

1. 确保构建时生成了 source maps
2. 确保 release 版本匹配（代码中的 release 和上传 source maps 时的 release 必须一致）
3. 检查 Sentry 项目设置中的 source map 配置

---

## 参考链接

- [Sentry Cloudflare 官方文档](https://docs.sentry.io/platforms/javascript/guides/cloudflare/)
- [Next.js on Cloudflare (Sentry)](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/nextjs/)
- [Cloudflare Workers Source Maps](https://docs.sentry.io/platforms/javascript/guides/cloudflare/sourcemaps/)
- [Wrangler 配置参考](https://developers.cloudflare.com/workers/wrangler/configuration/)

---

## 替代方案：使用 Cloudflare 原生集成（不推荐）

**注意**：Cloudflare Dashboard 中的原生 Sentry 集成已于 2025 年 6 月被移除。

如需配置，请直接使用 `wrangler secret put` 设置以下环境变量：
- `SENTRY_DSN`: Sentry 项目 DSN
- `BLOCKED_HEADERS`: 要排除的 header（逗号分隔）
- `EXCEPTION_SAMPLING_RATE`: 采样率（0-100）
- `STATUS_CODES_TO_SAMPLING_RATES`: 状态码到采样率的映射

---

*文档版本：2025-03-28*
*基于 Sentry SDK v9.x 和 @opennextjs/cloudflare v1.x*
