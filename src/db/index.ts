// src/db/index.ts
// 数据库客户端 — 使用 Supabase REST API（兼容 Cloudflare Workers）
// 替代原来的 postgres-js（不兼容 Workers）

import { getSupabaseServiceClient } from "@/lib/db-client";
export * from "./schema";

// 导出 Supabase 服务客户端
export const db = getSupabaseServiceClient();

// 向后兼容：导出 getDb 函数
export { getSupabaseServiceClient as getDb };
