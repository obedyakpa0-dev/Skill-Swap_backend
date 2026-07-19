import supabase from '../config/supabase.js';

/**
 * requireAuth
 * Reads the Bearer token from the Authorization header, asks Supabase Auth
 * to validate it, and attaches the resulting user to req.user.
 *
 * Every protected route in this app runs this first. Nothing downstream
 * (controllers/services) should re-check the token — they trust req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token.' });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    // req.user.id is the same id used as the FK in profiles, matches, etc.
    req.user = data.user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * requireSelf
 * For routes like PATCH /profiles/:id — makes sure the logged-in user is
 * only editing their own row, not someone else's. Must run after requireAuth.
 */
export function requireSelf(paramName = 'id') {
  return (req, res, next) => {
    if (req.user.id !== req.params[paramName]) {
      return res.status(403).json({ error: 'You can only modify your own resource.' });
    }
    next();
  };
}
