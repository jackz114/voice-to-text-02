# OpenNext Cloudflare 部署指南

> 本文档汇总了如何使用 `@opennextjs/cloudflare` 将 Next.js 应用部署到 Cloudflare Workers。

---

## 目录

1. [概述](#概述)
2. [快速开始](#快速开始)
3. [配置文件详解](#配置文件详解)
4. [开发工作流](#开发工作流)
5. [部署指南](#部署指南)
6. [缓存配置](#缓存配置)
7. [Bindings 使用](#bindings-使用)
8. [数据库和 ORM](#数据库和-orm)
9. [环境变量](#环境变量)
10. [故障排除](#故障排除)

---

## 概述

### 什么是 @opennextjs/cloudflare

`@opennextjs/cloudflare` 是一个适配器，让你可以将 Next.js 应用部署到 **Cloudflare Workers**，使用 Next.js 的 Node.js runtime（而非 Edge runtime）。

### 与 @cloudflare/next-on-pages 的区别

| 特性         | @opennextjs/cloudflare | @cloudflare/next-on-pages |
| ------------ | ---------------------- | ------------------------- |
| Runtime      | Node.js                | Edge                      |
| API 支持     | 完整的 Node.js API     | 有限的 Edge API           |
| Next.js 功能 | 完整支持               | 部分限制                  |

### 支持的 Next.js 版本

- Next.js 16（所有次要版本和补丁版本）
- Next.js 14 和 15（最新次要版本）
- Next.js 14 支持将在 2026 Q1 停止

### 支持的 Next.js 功能

- App Router
- Route Handlers
- Dynamic routes
- Static Site Generation (SSG)
- Server-Side Rendering (SSR)
- Middleware
- Image optimization
- Partial Prerendering (PPR)
- Pages Router
- Incremental Static Regeneration (ISR)
- `after` 支持
- Composable Caching (`'use cache'`)
- Turbopack

### Worker 大小限制

- **Free 计划**: 3 MiB（压缩后）
- **Paid 计划**: 10 MiB（压缩后）

> 部署时 wrangler 会显示原始大小和 gzip 压缩后的大小，**以压缩后的大小为准**。

---

## 快速开始

### 1. 创建新项目

```bash
npm create cloudflare@latest -- my-next-app --framework=next --platform=workers
```

### 2. 迁移现有项目

```bash
npx @opennextjs/cloudflare migrate
```

`migrate` 命令会自动完成以下设置：

- 安装依赖（`@opennextjs/cloudflare` 和 `wrangler`）
- 创建 `wrangler.jsonc` 配置文件
- 创建 `open-next.config.ts` 文件
- 创建 `.dev.vars` 文件
- 更新 `package.json` 脚本
- 添加静态资源缓存头（`public/_headers`）
- 将 `.open-next` 添加到 `.gitignore`
- 在 Next.js 配置中设置本地开发
- 创建 R2 bucket 用于缓存（如果 R2 已启用）

### 3. 手动安装步骤

如果 migrate 命令无法满足需求，可以手动设置：

#### 安装依赖

```bash
npm install @opennextjs/cloudflare@latest
npm install --save-dev wrangler@latest
```

> 需要 Wrangler 3.99.0 或更高版本

#### 创建 wrangler.jsonc

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "my-app",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "my-app"
    }
  ],
  "r2_buckets": [
    {
      "binding": "NEXT_INC_CACHE_R2_BUCKET",
      "bucket_name": "<BUCKET_NAME>"
    }
  ],
  "images": {
    "binding": "IMAGES"
  }
}
```

#### 创建 open-next.config.ts

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
```

#### 创建 .dev.vars

```bash
NEXTJS_ENV=development
```

#### 更新 package.json

```json
{
  "scripts": {
    "build": "next build",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "upload": "opennextjs-cloudflare build && opennextjs-cloudflare upload",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
```

#### 添加静态资源缓存头

创建 `public/_headers` 文件：

```
/_next/static/*
  Cache-Control: public,max-age=31536000,immutable
```

#### 更新 next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 你的配置
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

#### 更新 .gitignore

```
.open-next
```

#### 移除 export const runtime = "edge"

`@opennextjs/cloudflare` 目前**不支持** Edge runtime，请移除所有 `export const runtime = "edge";`。

---

## 配置文件详解

### wrangler.jsonc

| 字段                  | 说明                                           |
| --------------------- | ---------------------------------------------- |
| `main`                | Worker 入口文件，保持为 `.open-next/worker.js` |
| `compatibility_date`  | 必须设置为 2024-09-23 或更晚                   |
| `compatibility_flags` | 必须包含 `nodejs_compat` 以启用 Node.js API    |
| `assets.directory`    | 静态资源目录，保持为 `.open-next/assets`       |
| `services`            | 自引用服务绑定，用于 ISR 等功能                |
| `r2_buckets`          | R2 bucket 绑定，用于增量缓存                   |
| `images.binding`      | 启用图片优化                                   |

### open-next.config.ts

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  // 增量缓存配置
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
  }),

  // 队列配置（用于 ISR）
  queue: doQueue,

  // Tag 缓存配置（用于 revalidateTag）
  tagCache: d1NextTagCache,

  // 启用缓存拦截（提升性能，但与 PPR 不兼容）
  enableCacheInterception: true,
});
```

---

## 开发工作流

### 推荐的开发流程

1. **使用 `next dev` 进行本地开发**
   - 最快的热更新（HMR）
   - 最佳的开发体验

   ```bash
   npm run dev
   ```

2. **使用 `opennextjs-cloudflare preview` 本地预览**
   - 在 Cloudflare Workers 运行时中测试
   - 验证生产环境行为

   ```bash
   npm run preview
   ```

3. **部署到 Cloudflare**

   ```bash
   npm run deploy
   ```

### 使用 Cloudflare Bindings 进行本地开发

要在 `next dev` 中访问 Cloudflare Bindings，需要在 `next.config.ts` 中调用 `initOpenNextCloudflareForDev()`：

```typescript
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

### 远程 Bindings

让本地开发连接到远程 Cloudflare 资源：

```typescript
initOpenNextCloudflareForDev({
  experimental: { remoteBindings: true },
});
```

在 wrangler 配置中设置 `remote: true`：

```json
{
  "r2_buckets": [
    {
      "binding": "MY_BUCKET",
      "bucket_name": "my-bucket",
      "remote": true
    }
  ]
}
```

---

## 部署指南

### 命令行部署

```bash
# 构建并部署（立即可用）
npm run deploy

# 构建并上传（不上线，用于灰度发布）
npm run upload

# 仅构建
npx @opennextjs/cloudflare build

# 构建并本地预览
npx @opennextjs-cloudflare preview
```

### Workers Builds（推荐）

通过 GitHub/GitLab 集成自动部署：

1. 连接 GitHub/GitLab 仓库
2. 在 Workers Builds 设置中：
   - **Build command**: `npx @opennextjs/cloudflare build`
   - **Deploy command**: `npx @opennextjs/cloudflare deploy`（或 `upload`）

3. 在 "Build variables and secrets" 中设置环境变量

### 环境变量

- `.env` 和 `.dev.vars` 是本地文件，**不应**提交到版本控制
- 生产环境变量应在 Cloudflare Dashboard 中设置
- 使用 `--keep-vars` 选项防止部署时删除环境变量：

```bash
opennextjs-cloudflare deploy -- --keep-vars
```

---

## 缓存配置

### 小型站点配置（推荐）

适用于使用 ISR 的小型站点：

```json
// wrangler.jsonc
{
  "name": "my-app",
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "my-app"
    }
  ],
  "r2_buckets": [
    {
      "binding": "NEXT_INC_CACHE_R2_BUCKET",
      "bucket_name": "my-cache-bucket"
    }
  ],
  "durable_objects": {
    "bindings": [
      {
        "name": "NEXT_CACHE_DO_QUEUE",
        "class_name": "DOQueueHandler"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["DOQueueHandler"]
    }
  ],
  "d1_databases": [
    {
      "binding": "NEXT_TAG_CACHE_D1",
      "database_id": "<DATABASE_ID>",
      "database_name": "<DATABASE_NAME>"
    }
  ]
}
```

```typescript
// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  tagCache: d1NextTagCache,
});
```

### 大型站点配置

适用于高流量站点：

```json
// wrangler.jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "NEXT_CACHE_DO_QUEUE",
        "class_name": "DOQueueHandler"
      },
      {
        "name": "NEXT_TAG_CACHE_DO_SHARDED",
        "class_name": "DOShardedTagCache"
      },
      {
        "name": "NEXT_CACHE_DO_PURGE",
        "class_name": "BucketCachePurge"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["DOQueueHandler", "DOShardedTagCache", "BucketCachePurge"]
    }
  ]
}
```

```typescript
// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import { purgeCache } from "@opennextjs/cloudflare/overrides/cache-purge/index";

export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
  }),
  queue: doQueue,
  tagCache: doShardedTagCache({ baseShardSize: 12 }),
  enableCacheInterception: true,
  cachePurge: purgeCache({ type: "direct" }),
});
```

### SSG 纯静态站点

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
```

### 创建 R2 Bucket

```bash
npx wrangler r2 bucket create <YOUR_BUCKET_NAME>
```

### 缓存调试

在 `.env` 文件中添加：

```bash
NEXT_PRIVATE_DEBUG_CACHE=1
```

---

## Bindings 使用

### 访问 Bindings

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: Request) {
  // 获取环境变量和 bindings
  const { env, cf, ctx } = getCloudflareContext();

  // 使用 KV
  await env.MY_KV.put("key", "value");
  const value = await env.MY_KV.get("key");

  // cf: 请求相关的 Cloudflare 信息
  // ctx: 生命周期方法（如 waitUntil）

  return new Response(value);
}
```

### SSG 路由中使用 Bindings

SSG 路由需要在 async 模式下使用：

```typescript
const context = await getCloudflareContext({ async: true });
```

> ⚠️ 警告：SSG 时会使用 `.dev.vars` 中的 secrets 和本地 binding 值

### 生成 TypeScript 类型

```bash
npx wrangler types --env-interface CloudflareEnv
```

这会生成 `worker-configuration.d.ts` 文件。

---

## 数据库和 ORM

### Drizzle ORM

#### PostgreSQL 配置

❌ **不要**创建全局客户端：

```typescript
// 错误示例
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.PG_URL });
export const db = drizzle({ client: pool, schema });
```

✅ **正确**做法：为每个请求创建客户端：

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { cache } from "react";
import { Pool } from "pg";

export const getDb = cache(() => {
  const pool = new Pool({
    connectionString: process.env.PG_URL,
    maxUses: 1, // 关键：不重用连接
  });
  return drizzle({ client: pool, schema });
});
```

#### D1 配置

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { cache } from "react";

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  return drizzle(env.MY_D1, { schema });
});

// 用于 ISR/SSG
export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.MY_D1, { schema });
});
```

#### Hyperdrive 配置

```typescript
export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  const pool = new Pool({
    connectionString: env.HYPERDRIVE.connectionString,
    maxUses: 1,
  });
  return drizzle({ client: pool, schema });
});
```

### Prisma ORM

#### schema.prisma 配置

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
  // 不要设置 output 目录
}
```

#### next.config.ts 配置

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};
```

#### D1 使用

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  const adapter = new PrismaD1(env.MY_D1);
  return new PrismaClient({ adapter });
});
```

---

## 环境变量

### 本地开发

使用 Next.js 的 `.env` 文件：

```
.env                # 默认
.env.local          # 本地覆盖（不提交到 git）
.env.development    # 开发环境
.env.production     # 生产环境
```

在 `.dev.vars` 中设置环境：

```bash
NEXTJS_ENV=development
```

### 生产环境

- 在 Cloudflare Dashboard 中设置环境变量
- 或使用 Wrangler CLI：

```bash
wrangler secret put SECRET_NAME
```

### Workers Builds

在 "Build variables and secrets" 中设置：

- Build 过程需要访问环境变量
- `NEXT_PUBLIC_*` 变量会在构建时被内联

---

## 故障排除

### Worker 大小超限

**错误**: "Your Worker exceeded the size limit of 3 MiB"

- Free 计划限制为 3 MiB，升级到 Paid 计划可获得 10 MiB
- 使用 bundle analyzer 分析依赖：

```bash
npx @opennextjs/cloudflare build
cd .open-next/server-functions/default
# 使用 ESBuild Bundle Analyzer 分析 handler.mjs.meta.json
```

### 构建时无法解析包

**错误**: "Could not resolve '<package>'"

某些包包含 workerd 特定代码，需要在 `next.config.ts` 中配置：

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    "postgres",
    "jose",
    "@libsql/isomorphic-ws",
  ],
};
```

### "Cannot perform I/O on behalf of a different request"

数据库客户端在请求之间重用了连接。解决方案：为每个请求创建新的客户端，不使用全局客户端。

### "FinalizationRegistry is not defined"

更新 `compatibility_date` 到 2025-05-05 或更晚：

```json
{
  "compatibility_date": "2025-05-05"
}
```

### Durable Objects 警告

构建时可能会出现关于 `DOQueueHandler` 和 `DOShardedTagCache` 的警告，这是正常的，可以安全忽略。

### Turbopack 构建失败

如果看到 "Failed to load chunk server/chunks/ssr/<chunk_name>.js"，请升级到最新版本的 `@opennextjs/cloudflare`。

### Windows 支持

OpenNext 可以在 Windows 上使用，但不能保证完全支持。推荐：

- 使用 WSL (Windows Subsystem for Linux)
- 使用 Linux 虚拟机
- 或使用 CI/CD（如 GitHub Actions）进行部署

---

## CLI 命令参考

| 命令                                         | 说明                                        |
| -------------------------------------------- | ------------------------------------------- |
| `opennextjs-cloudflare build`                | 构建 Next.js 应用并转换为 Cloudflare Worker |
| `opennextjs-cloudflare populateCache local`  | 填充本地缓存                                |
| `opennextjs-cloudflare populateCache remote` | 填充远程缓存                                |
| `opennextjs-cloudflare preview`              | 本地预览（启动 wrangler dev）               |
| `opennextjs-cloudflare deploy`               | 部署到 Cloudflare（立即可用）               |
| `opennextjs-cloudflare upload`               | 上传新版本（不上线）                        |
| `opennextjs-cloudflare migrate`              | 迁移现有 Next.js 项目                       |

---

## 相关链接

- [OpenNext Cloudflare 官方文档](https://opennext.js.org/cloudflare)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Next.js 文档](https://nextjs.org/docs)
- [GitHub: opennextjs/cloudflare](https://github.com/opennextjs/opennextjs-cloudflare)
