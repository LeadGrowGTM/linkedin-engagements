import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  const error = `
    ❌ Missing Supabase Environment Variables
    
    VITE_SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '✗ Missing'}
    VITE_SUPABASE_ANON_KEY: ${supabaseKey ? '✓ Set' : '✗ Missing'}
    
    Please add these variables in Railway Dashboard:
    1. Go to Variables tab
    2. Add VITE_SUPABASE_URL
    3. Add VITE_SUPABASE_ANON_KEY
    4. Redeploy
  `
  console.error(error)
  throw new Error('Missing Supabase environment variables. Check console for details.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'linkedinengagements'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

