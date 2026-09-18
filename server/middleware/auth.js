/**
 * authenticate — Express middleware that enforces JWT authentication.
 *
 * Reads the token from:
 *   1. Authorization: Bearer <token>  header
 *   2. x-auth-token header (fallback)
 *
 * On success: attaches req.user = { id, name, email }
 * On failure: returns 401 JSON
 */

const AuthService = require('../services/auth/AuthService');

module.exports = function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const xToken     = req.headers['x-auth-token']  || '';

    let token = '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (xToken) {
      token = xToken.trim();
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    req.user = AuthService.verify(token);
    next();
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message });
  }
};
