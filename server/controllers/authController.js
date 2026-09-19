const AuthService = require('../services/auth/AuthService');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await AuthService.register(name, email, password);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    res.json(await AuthService.login(email, password));
  } catch (err) { next(err); }
};

// Token is stateless (JWT). Client discards it; server simply acknowledges.
exports.logout = (_req, res) => res.json({ message: 'Logged out successfully.' });

exports.me = (req, res) => res.json({ user: req.user });
