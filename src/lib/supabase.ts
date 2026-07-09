import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
