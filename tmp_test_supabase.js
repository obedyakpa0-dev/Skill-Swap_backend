import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const email = 'test.user.ac133e34@example.com';
const password = 'TestPass123!';
(async () => {
  const res = await supabase.auth.signInWithPassword({ email, password });
  console.log(JSON.stringify(res, null, 2));
  if (res.data?.user?.id) {
    const p = await supabase.from('profiles').select('*').eq('id', res.data.user.id).single();
    console.log(JSON.stringify(p, null, 2));
  }
})();
