// src/db/index.ts
// 数据库单例 — 所有 API 路由共享此实例
// prepare: false 是 Supabase Transaction pooler 模式的必要配置
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle({ client, schema });
