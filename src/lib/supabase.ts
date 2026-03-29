import { createBrowserClient } from '@supabase/ssr'

// Client-side singleton (for client components)
// 使用 @supabase/ssr 的 createBrowserClient，原生处理 PKCE，单例默认
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient(): ReturnType<typeof createBrowserClient> {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables")
    }
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

// For backward compatibility
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof ReturnType<typeof createBrowserClient>]
  }
})
