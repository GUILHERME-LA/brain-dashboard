import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  
  return supabaseInstance
}

export const supabase = typeof window !== 'undefined' ? getSupabase() : null

export type Memory = {
  id: string
  type: string
  content: string
  metadata: Record<string, unknown>
  created_at: string
  importance: number
  usage_count: number
  last_used: string | null
  success_rate: number
}

export type ExecutionLog = {
  id: string
  query: string
  intent: string | null
  risk: string | null
  agents_used: string | null
  success: boolean
  error: string | null
  latency: number | null
  created_at: string
}
