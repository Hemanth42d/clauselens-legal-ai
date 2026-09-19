const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_EXPIRES  = '7d';
const SALT_ROUNDS  = 10;
const NAME_REGEX   = /^.{2,100}$/;
const EMAIL_REGEX  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production.');
  }
  return secret || 'clauselens-dev-secret-local-only';
}

/**
 * In-memory user store with JWT-based authentication.
 * Suitable for demo/evaluation. Swap _users for a DB in production.
 */
class AuthService {
  constructor() {
    // email → { id, name, email, passwordHash, createdAt }
    this._users = new Map();
    this._seedDemoUser();
  }

  async _seedDemoUser() {
    const hash = await bcrypt.hash('Demo1234!', SALT_ROUNDS);
    this._users.set('demo@clauselens.app', {
      id:           'demo-user-1',
      name:         'Demo User',
      email:        'demo@clauselens.app',
      passwordHash: hash,
      createdAt:    new Date().toISOString(),
    });
  }

  async register(name, email, password) {
    const normalised = (email || '').toLowerCase().trim();

    if (!NAME_REGEX.test((name || '').trim())) {
      throw Object.assign(new Error('Name must be between 2 and 100 characters.'), { status: 400 });
    }
    if (!EMAIL_REGEX.test(normalised)) {
      throw Object.assign(new Error('Please enter a valid email address.'), { status: 400 });
    }
    if (!password || password.length < 8 || password.length > 128) {
      throw Object.assign(new Error('Password must be 8–128 characters.'), { status: 400 });
    }
    if (this._users.has(normalised)) {
      throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
    }

    const user = {
      id:           uuidv4(),
      name:         name.trim(),
      email:        normalised,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
      createdAt:    new Date().toISOString(),
    };
    this._users.set(normalised, user);
    return { token: this._sign(user), user: this._public(user) };
  }

  async login(email, password) {
    const normalised = (email || '').toLowerCase().trim();
    const user = this._users.get(normalised);

    // Always run bcrypt to prevent timing-based username enumeration.
    const dummyHash = '$2b$10$invalidhashforcomparison000000000';
    const matches   = await bcrypt.compare(password || '', user ? user.passwordHash : dummyHash);

    if (!user || !matches) {
      throw Object.assign(new Error('Incorrect email or password.'), { status: 401 });
    }
    return { token: this._sign(user), user: this._public(user) };
  }

  verify(token) {
    try {
      const payload = jwt.verify(token, getSecret());
      const user    = Array.from(this._users.values()).find(u => u.id === payload.sub);
      if (!user) throw new Error('User not found');
      return this._public(user);
    } catch {
      throw Object.assign(new Error('Invalid or expired session. Please sign in again.'), { status: 401 });
    }
  }

  _sign(user) {
    return jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      getSecret(),
      { expiresIn: JWT_EXPIRES },
    );
  }

  _public(user) {
    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  }
}

module.exports = new AuthService();
