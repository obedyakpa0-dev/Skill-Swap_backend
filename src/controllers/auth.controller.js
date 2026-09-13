import * as authService from "../services/auth.service.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Minimal audit trail for auth events — never logs passwords or tokens.
function logAuthEvent(event, { email, ip, ok, reason }) {
  const line = `[auth] ${event} ${ok ? "success" : "failed"} email=${email} ip=${ip}${reason ? ` reason=${reason}` : ""}`;
  ok ? console.log(line) : console.warn(line);
}

export async function register(req, res) {
  const { email, password, full_name, school, department, level } = req.body;

  if (!email || !password || !full_name) {
    return res
      .status(400)
      .json({ error: "email, password, and full_name are required." });
  }
  if (!EMAIL_RE.test(email)) {
    return res
      .status(400)
      .json({ error: "Please provide a valid email address." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters." });
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res
      .status(400)
      .json({
        error: "Password must include at least one letter and one number.",
      });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await authService.registerUser({
      email: normalizedEmail,
      password,
      full_name,
      school,
      department,
      level,
    });
    logAuthEvent("register", { email: normalizedEmail, ip: req.ip, ok: true });
    res.status(201).json(result);
  } catch (err) {
    logAuthEvent("register", {
      email: normalizedEmail,
      ip: req.ip,
      ok: false,
      reason: err.message,
    });
    throw err;
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required." });
  }
  if (!EMAIL_RE.test(email)) {
    return res
      .status(400)
      .json({ error: "Please provide a valid email address." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await authService.loginUser({
      email: normalizedEmail,
      password,
    });
    logAuthEvent("login", { email: normalizedEmail, ip: req.ip, ok: true });
    res.status(200).json(result);
  } catch (err) {
    logAuthEvent("login", {
      email: normalizedEmail,
      ip: req.ip,
      ok: false,
      reason: err.message,
    });
    throw err;
  }
}

export async function logout(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(400).json({ error: "Missing bearer token." });
  }

  await authService.logoutUser(token);
  res.status(200).json({ message: "Logged out." });
}

export async function me(req, res) {
  const profile = await authService.getCurrentProfile(req.user.id);
  res.status(200).json(profile);
}

export async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email || !EMAIL_RE.test(email)) {
    return res
      .status(400)
      .json({ error: "Please provide a valid email address." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  await authService.requestPasswordReset(normalizedEmail);
  logAuthEvent("forgot-password", {
    email: normalizedEmail,
    ip: req.ip,
    ok: true,
  });

  res
    .status(200)
    .json({
      message:
        "If an account exists for that email, a reset link has been sent.",
    });
}

export async function resetPassword(req, res) {
  const { access_token, new_password } = req.body;

  if (!access_token || !new_password) {
    return res
      .status(400)
      .json({ error: "access_token and new_password are required." });
  }
  if (typeof new_password !== "string" || new_password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters." });
  }
  if (!/[a-zA-Z]/.test(new_password) || !/[0-9]/.test(new_password)) {
    return res
      .status(400)
      .json({
        error: "Password must include at least one letter and one number.",
      });
  }

  await authService.resetPassword(access_token, new_password);
  res.status(200).json({ message: "Password updated. Please log in again." });
}
