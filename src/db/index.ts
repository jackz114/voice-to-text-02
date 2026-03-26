// src/db/index.ts
// 数据库客户端 — 使用 Supabase REST API（兼容 Cloudflare Workers）
// 替代原来的 postgres-js（不兼容 Workers）

import { getSupabaseServiceClient } from "@/lib/db-client";

// 注意：schema.ts 中的 Drizzle ORM 定义仅用于 drizzle-kit 迁移
// 不要在 Cloudflare Workers 运行时导入 schema，因为 pg-core 包含 Node.js 特定代码
// import * from "./schema"; // 已移除 - 避免打包 node:fs 等模块

// 导出 Supabase 服务客户端
export const db = getSupabaseServiceClient();

// 向后兼容：导出 getDb 函数
export { getSupabaseServiceClient as getDb };
