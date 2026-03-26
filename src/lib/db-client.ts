// src/lib/db-client.ts
// Supabase REST API 数据库客户端 — 替代 postgres-js，兼容 Cloudflare Workers
// 简化版：直接使用 Supabase 语法，不再模拟 Drizzle 的链式调用

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 懒加载 Supabase Service Role 客户端（用于服务端 API 路由）
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseInstance;
}

// 导出 Supabase 客户端供直接使用
export { getSupabaseServiceClient as getDb };
