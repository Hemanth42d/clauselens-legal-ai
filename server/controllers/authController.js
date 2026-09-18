const AuthService = require('../services/auth/AuthService');

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await AuthService.register(name, email, password);
    res.status(201).json(result);
  } catch (err) {
    // Pass validation/conflict errors with their status codes
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout  (client just drops the token, but we acknowledge it)
exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully.' });
};

// GET /api/auth/me  (requires auth middleware)
exports.me = (req, res) => {
  res.json({ user: req.user });
};
