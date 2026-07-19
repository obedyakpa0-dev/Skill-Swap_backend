import dotenv from 'dotenv';
dotenv.config();

const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * requireAdmin
 * Must run after requireAuth. Checks req.user.email against ADMIN_EMAILS.
 *
 * NOTE: the blueprint's `profiles` table (7.1) has no `is_admin` / `role`
 * column. This env-list approach is a quick stand-in so admin routes are
 * gated from day one. Recommended follow-up: add a `role text default 'user'`
 * column to profiles and switch this to a DB check — that way you can manage
 * admins without redeploying.
 */
export function requireAdmin(req, res, next) {
  const email = (req.user?.email || '').toLowerCase();
  if (!adminEmails.includes(email)) {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}
