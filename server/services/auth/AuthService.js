const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../../models/User');

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
 * MongoDB-backed user store with JWT-based authentication.
 */
class AuthService {
  constructor() {
    this._seedDemoUser();
  }

  async _seedDemoUser() {
    try {
      const existingUser = await User.findOne({ email: 'demo@clauselens.app' });
      if (!existingUser) {
        const hash = await bcrypt.hash('Demo1234!', SALT_ROUNDS);
        await User.create({
          id:           'demo-user-1',
          name:         'Demo User',
          email:        'demo@clauselens.app',
          passwordHash: hash,
        });
        console.log('✅ Demo user seeded');
      }
    } catch (err) {
      console.error('Failed to seed demo user:', err.message);
    }
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

    const existingUser = await User.findOne({ email: normalised });
    if (existingUser) {
      throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      id: uuidv4(),
      name: name.trim(),
      email: normalised,
      passwordHash,
    });

    return { token: this._sign(user), user: this._public(user) };
  }

  async login(email, password) {
    const normalised = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: normalised });

    // Always run bcrypt to prevent timing-based username enumeration.
    const dummyHash = '$2b$10$invalidhashforcomparison000000000';
    const matches   = await bcrypt.compare(password || '', user ? user.passwordHash : dummyHash);

    if (!user || !matches) {
      throw Object.assign(new Error('Incorrect email or password.'), { status: 401 });
    }
    return { token: this._sign(user), user: this._public(user) };
  }

  async verify(token) {
    try {
      const payload = jwt.verify(token, getSecret());
      const user    = await User.findOne({ id: payload.sub });
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
