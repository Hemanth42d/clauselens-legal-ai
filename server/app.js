require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const analysisRoutes = require('./routes/analysis');
const qaRoutes = require('./routes/qa');
const comparisonRoutes = require('./routes/comparison');
const consultationRoutes = require('./routes/consultation');
const authenticate = require('./middleware/auth');
const documentController = require('./controllers/documentController');
const mongoose = require('mongoose');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Database Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clauselens';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(compression()); // Gzip responses — reduces payload size by ~70%

// In production (same-origin on Render), allow all origins.
// In development, restrict to localhost.
if (isProd) {
  app.use(cors());
} else {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL,
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true,
  }));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200, // Increased from 100 — AI analysis needs multiple requests per page
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { error: 'Too many attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Public routes (no auth required) ─────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Sample download is public — browser <a href> can't send auth headers
app.get('/api/documents/sample', documentController.downloadSample);

app.use('/api/auth', authRoutes);

// ── Protected routes ──────────────────────────────────────────────────────────
app.use('/api/documents', authenticate, documentRoutes);
app.use('/api/analysis', authenticate, analysisRoutes);
app.use('/api/qa', authenticate, qaRoutes);
app.use('/api/comparison', authenticate, comparisonRoutes);
app.use('/api/consultation', authenticate, consultationRoutes);

// ── 404 for unknown API routes (must come before static/SPA catch-all) ───────
app.all('/api/*', (_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Production: serve frontend static files + SPA catch-all ──────────────────
if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    const indexPath = path.join(clientDist, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(500).send('Application loading error. Please try again.');
      }
    });
  });
}

app.use((err, _req, res, _next) => {
  if (!isProd) console.error(err.stack);
  res.status(err.status || 500).json({
    error: isProd ? 'An unexpected error occurred' : err.message,
  });
});

module.exports = app;

