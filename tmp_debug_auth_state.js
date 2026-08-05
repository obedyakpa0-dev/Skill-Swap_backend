import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const email = 'test.user.ac133e34@example.com';
const password = 'TestPass123!';
(async () => {
  const signIn = await authClient.auth.signInWithPassword({ email, password });
  console.log('signIn data', JSON.stringify(signIn, null, 2));
  const query1 = await authClient.from('profiles').select('*').eq('id', signIn.data.user.id).single();
  console.log('query1', JSON.stringify(query1, null, 2));
  const freshClient = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const query2 = await freshClient.from('profiles').select('*').eq('id', signIn.data.user.id).single();
  console.log('query2', JSON.stringify(query2, null, 2));
})();
