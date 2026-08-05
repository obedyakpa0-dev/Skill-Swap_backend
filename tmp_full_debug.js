import dotenv from 'dotenv';
dotenv.config();
import supabase from './src/config/supabase.js';
import fetch from 'node-fetch';
const email = 'test.user.ac133e34@example.com';
const password = 'TestPass123!';
(async () => {
  const login = await supabase.auth.signInWithPassword({ email, password });
  console.log('login', JSON.stringify(login, null, 2));
  const token = login.data?.session?.access_token;
  console.log('token length', token?.length, 'token valid?', !!token);
  if (!token) return;

  const userCheck = await supabase.auth.getUser(token);
  console.log('getUser', JSON.stringify(userCheck, null, 2));

  const res = await fetch('http://localhost:5000/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type':'application/json' },
  });
  console.log('api /auth/me status', res.status);
  console.log('api /auth/me body', await res.text());
})();
