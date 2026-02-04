const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    db: { schema: 'linkedin' },
    auth: { persistSession: false },
  }
);

module.exports = { supabase };
