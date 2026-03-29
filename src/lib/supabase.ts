import { createClient } from '@supabase/supabase-js'

// Client-side singleton (for client components) - lazy initialization
// 重要：所有组件必须使用同一个 Supabase 实例，否则 PKCE verifier 无法共享
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient(): ReturnType<typeof createClient> {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables")
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
  return supabaseInstance
}

// For backward compatibility - lazy initialized supabase client
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof ReturnType<typeof createClient>]
  }
})
