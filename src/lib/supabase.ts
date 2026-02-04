import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'linkedin' },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : (null as unknown as SupabaseClient)

