import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const email = 'debug.user.auth@example.com';
const password = 'DebugPass123!';
console.log('env url', !!process.env.SUPABASE_URL, 'service', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
console.log('createError', authError);
if (authData?.user?.id) {
  console.log('created', authData.user.id);
  const { data: profile, error: profileError } = await supabase.from('profiles').insert({ id: authData.user.id, full_name: 'Debug Auth User', school: 'Debug University', department: 'Engineering', level: 'Undergraduate', verification_status: 'pending', verified: false, reputation_score: 0, gamification_points: 0, rank: 'Bronze Mentor' }).select().single();
  console.log('profileError', profileError);
  console.log('profile', profile);
}
const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) });
console.log('loginStatus', loginRes.status);
console.log(await loginRes.text());
