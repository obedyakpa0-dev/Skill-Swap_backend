import dotenv from 'dotenv';
dotenv.config();
import supabase from './src/config/supabase.js';
const email = 'test.user.ac133e34@example.com';
const password = 'TestPass123!';
(async () => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log('auth signIn res', JSON.stringify({ data, error }, null, 2));
  if (error) return;
  console.log('user id', data.user?.id);
  const profile = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  console.log('profile lookup', JSON.stringify(profile, null, 2));
})();
