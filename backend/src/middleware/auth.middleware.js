const { createClient } = require('@supabase/supabase-js');

/**
 * authMiddleware — verifies a Supabase JWT from the Authorization header.
 * Attaches the decoded user object to req.user on success.
 * Returns 401 if the token is missing or invalid.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.slice(7);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('Supabase env vars not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(url, key);

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = data.user;
    next();
  } catch (err) {
    console.error('authMiddleware error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = authMiddleware;
