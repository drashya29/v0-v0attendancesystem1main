import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are not set. Using demo mode.")
    return {
      auth: {
        signInWithPassword: async () => ({
          error: new Error("Supabase not configured. Please set environment variables."),
          data: { user: null, session: null },
        }),
        signUp: async () => ({
          error: new Error("Supabase not configured. Please set environment variables."),
          data: { user: null, session: null },
        }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: null } }),
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: [], error: null }),
        update: () => ({ data: [], error: null }),
        delete: () => ({ data: [], error: null }),
      }),
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
