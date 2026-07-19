import * as authService from '../services/auth.service.js';

export async function register(req, res) {
  const { email, password, full_name, school, department, level } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'email, password, and full_name are required.' });
  }

  const result = await authService.registerUser({
    email,
    password,
    full_name,
    school,
    department,
    level,
  });

  res.status(201).json(result);
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  const result = await authService.loginUser({ email, password });
  res.status(200).json(result);
}

export async function logout(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(400).json({ error: 'Missing bearer token.' });
  }

  await authService.logoutUser(token);
  res.status(200).json({ message: 'Logged out.' });
}

export async function me(req, res) {
  const profile = await authService.getCurrentProfile(req.user.id);
  res.status(200).json(profile);
}
