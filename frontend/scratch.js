const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: plans, error: plansErr } = await supabase.from('plans').select('id, created_at').order('created_at', { ascending: false });
  console.log('Plans remaining in DB:', plans);
}
check();
