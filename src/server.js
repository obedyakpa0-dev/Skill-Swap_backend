import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import profilesRoutes from './routes/profiles.routes.js';
import skillsRoutes from './routes/skills.routes.js';
import matchesRoutes from './routes/matches.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import sessionsRoutes from './routes/sessions.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import adminRoutes from './routes/admin.routes.js';

import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();

// Needed so express-rate-limit (and any IP-based logic) sees the real
// client IP when running behind a platform proxy (Render/Railway/Fly/etc.).
app.set('trust proxy', 1);

app.use(helmet());

// Lock CORS to known frontend origin(s) in production. Set
// ALLOWED_ORIGINS="https://app.example.com,https://staging.example.com"
// in .env. Falls back to allow-all only when unset, so local dev still
// works out of the box.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Fail closed: never boot in production with an open CORS policy just
// because someone forgot to set the env var.
if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  throw new Error(
    "ALLOWED_ORIGINS must be set in production — refusing to start with an open CORS policy.",
  );
}

app.use(
  cors(
    allowedOrigins.length ? { origin: allowedOrigins, credentials: true } : {},
  ),
);

// Enforce HTTPS in production. Trusts x-forwarded-proto since the app sits
// behind a platform proxy (trust proxy is set above).
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.secure || req.headers["x-forwarded-proto"] === "https")
      return next();
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

app.use(express.json({ limit: "100kb" }));

// Brute-force / credential-stuffing protection on the two endpoints that
// take a password. Tune windowMs/max as real traffic patterns emerge.
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
});

// Keyed by email+IP (not just IP) so an attacker rotating IPs to brute-force
// one specific account still gets rate-limited on that account.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${req.ip}:${(req.body?.email || "").trim().toLowerCase()}`,
  message: { error: "Too many attempts, please try again later." },
});

// Keyed by email ONLY, wider window/cap — catches an attacker who rotates
// IPs specifically to dodge the email+IP limiter above, while targeting
// one victim account.
const loginByEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    (req.body?.email || "").trim().toLowerCase() || "unknown",
  message: {
    error: "Too many login attempts for this account, please try again later.",
  },
});

app.use("/api/v1/auth/login", loginByEmailLimiter, loginLimiter);
app.use("/api/v1/auth/register", registerLimiter);
app.use("/api/v1/auth/forgot-password", registerLimiter);

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profiles', profilesRoutes);
app.use('/api/v1/skills', skillsRoutes);
app.use('/api/v1/matches', matchesRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/sessions', sessionsRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/admin', adminRoutes);

// Must be registered last — Express only treats a 4-arg function as an
// error handler, and only calls it once something upstream calls next(err).
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SkillSwap backend running on port ${PORT}`);
});