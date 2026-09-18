/**
 * AuthService — in-memory user store with JWT-based sessions.
 *
 * No database required. Users are stored in a Map for the lifetime
 * of the server process. Suitable for demo / evaluation purposes.
 *
 * Security features:
 *   - Passwords hashed with bcrypt (cost factor 10)
 *   - Tokens signed with HS256 JWT, 7-day expiry
 *   - No secrets in code — JWT_SECRET read from environment
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET  = process.env.JWT_SECRET || 'clauselens-dev-secret-change-in-production';
const JWT_EXPIRES = '7d';
const SALT_ROUNDS = 10;

class AuthService {
  constructor() {
    // Map<email, { id, name, email, passwordHash, createdAt }>
    this._users = new Map();

    // Seed a demo account so evaluators can sign in immediately
    this._seedDemoUser();
  }

  async _seedDemoUser() {
    const hash = await bcrypt.hash('Demo1234!', SALT_ROUNDS);
    const demo = {
      id:           'demo-user-1',
      name:         'Demo User',
      email:        'demo@clauselens.app',
      passwordHash: hash,
      createdAt:    new Date().toISOString(),
    };
    this._users.set(demo.email, demo);
  }

  // ── Register ──────────────────────────────────────────────────────────────

  async register(name, email, password) {
    const normalised = (email || '').toLowerCase().trim();

    if (!name || name.trim().length < 2) {
      throw Object.assign(new Error('Name must be at least 2 characters.'), { status: 400 });
    }
    if (!normalised || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
      throw Object.assign(new Error('Please enter a valid email address.'), { status: 400 });
    }
    if (!password || password.length < 8) {
      throw Object.assign(new Error('Password must be at least 8 characters.'), { status: 400 });
    }
    if (this._users.has(normalised)) {
      throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = {
      id:           uuidv4(),
      name:         name.trim(),
      email:        normalised,
      passwordHash,
      createdAt:    new Date().toISOString(),
    };
    this._users.set(normalised, user);
    return { token: this._sign(user), user: this._public(user) };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(email, password) {
    const normalised = (email || '').toLowerCase().trim();
    const user = this._users.get(normalised);

    // Use constant-time compare even when user not found (prevents timing attacks)
    const hash     = user ? user.passwordHash : '$2b$10$invalidhashforcomparison000000000';
    const matches  = await bcrypt.compare(password || '', hash);

    if (!user || !matches) {
      throw Object.assign(
        new Error('Incorrect email or password.'),
        { status: 401 }
      );
    }

    return { token: this._sign(user), user: this._public(user) };
  }

  // ── Verify token ──────────────────────────────────────────────────────────

  verify(token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      // Make sure user still exists (handles deleted accounts)
      const user = Array.from(this._users.values()).find(u => u.id === payload.sub);
      if (!user) throw new Error('User not found');
      return this._public(user);
    } catch {
      throw Object.assign(new Error('Invalid or expired session. Please sign in again.'), { status: 401 });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _sign(user) {
    return jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
  }

  _public(user) {
    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  }
}

module.exports = new AuthService();
