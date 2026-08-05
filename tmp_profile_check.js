import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const userId = '58e057e5-ed30-4a5c-9545-b0ebb70db979';
async function run() {
  const list = await supabase.from('profiles').select('*').limit(10);
  console.log('list result', JSON.stringify(list, null, 2));
  const q = await supabase.from('profiles').select('*').eq('id', userId).limit(1);
  console.log('query by id limit', JSON.stringify(q, null, 2));
  const q2 = await supabase.from('profiles').select('*').eq('id', userId).single();
  console.log('query by id single', JSON.stringify(q2, null, 2));
}
run();
