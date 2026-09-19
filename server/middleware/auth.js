const AuthService = require('../services/auth/AuthService');

/**
 * Enforces JWT authentication on protected routes.
 * Reads from Authorization: Bearer <token> or x-auth-token header.
 * Attaches req.user = { id, name, email } on success.
 */
module.exports = function authenticate(req, res, next) {
  try {
    const bearer = (req.headers['authorization'] || '').startsWith('Bearer ')
      ? req.headers['authorization'].slice(7).trim()
      : '';
    const token = bearer || (req.headers['x-auth-token'] || '').trim();

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    req.user = AuthService.verify(token);
    next();
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message });
  }
};
