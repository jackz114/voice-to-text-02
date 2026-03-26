// src/db/index.ts
// 数据库单例 — 所有 API 路由共享此实例
// prepare: false 是 Supabase Transaction pooler 模式的必要配置
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// 懒加载数据库客户端（避免构建时因缺少环境变量而报错）
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let clientInstance: ReturnType<typeof postgres> | null = null;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL environment variable");
  }
  return url;
}

function getClient() {
  if (!clientInstance) {
    const databaseUrl = getDatabaseUrl();
    clientInstance = postgres(databaseUrl, { prepare: false });
  }
  return clientInstance;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle({ client: getClient(), schema });
  }
  return dbInstance;
}

// 保持向后兼容的导出（懒初始化）
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof getDb>];
  },
});
