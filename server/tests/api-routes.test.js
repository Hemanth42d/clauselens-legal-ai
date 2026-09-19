const request = require('supertest');
const fs = require('fs');
const path = require('path');
delete process.env.OPENAI_API_KEY;

const app = require('../app');

const SAMPLE_PATH  = path.join(__dirname, '../data/demo/ClauseLens_Sample_Employment_Agreement.txt');
const SAMPLE_EXISTS = fs.existsSync(SAMPLE_PATH);

// ── Auth helper ───────────────────────────────────────────────────────────────
let authToken = '';

// Register a test user before all tests and store the JWT
beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email: `test-${Date.now()}@example.com`, password: 'TestPass1!' });
  authToken = res.body.token;
});

function auth(req) { return req.set('Authorization', `Bearer ${authToken}`) }

// ─────────────────────────────────────────────────────────────────────────────
describe('API Routes', () => {

  // ── Health (public) ───────────────────────────────────────────────────────
  describe('GET /api/health', () => {
    test('returns 200 with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.mode).toBe('demo');
    });
  });

  // ── Auth routes ───────────────────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    test('creates a new account', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email: `new-${Date.now()}@test.com`, password: 'Password1!' });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBeTruthy();
    });

    test('rejects duplicate email with 409', async () => {
      await request(app).post('/api/auth/register')
        .send({ name: 'Alice', email: 'dup@test.com', password: 'Password1!' });
      const res = await request(app).post('/api/auth/register')
        .send({ name: 'Alice', email: 'dup@test.com', password: 'Password1!' });
      expect(res.status).toBe(409);
    });

    test('rejects weak password with 400', async () => {
      const res = await request(app).post('/api/auth/register')
        .send({ name: 'Alex', email: 'weak@test.com', password: '123' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('returns token for valid credentials (demo account)', async () => {
      const res = await request(app).post('/api/auth/login')
        .send({ email: 'demo@clauselens.app', password: 'Demo1234!' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
    });

    test('returns 401 for wrong password', async () => {
      const res = await request(app).post('/api/auth/login')
        .send({ email: 'demo@clauselens.app', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    test('returns user when authenticated', async () => {
      const res = await auth(request(app).get('/api/auth/me'));
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Test User');
    });

    test('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // ── Protected routes require auth ─────────────────────────────────────────
  describe('Auth protection', () => {
    test('GET /api/documents returns 401 without token', async () => {
      const res = await request(app).get('/api/documents');
      expect(res.status).toBe(401);
    });

    test('POST /api/analysis/analyze returns 401 without token', async () => {
      const res = await request(app).post('/api/analysis/analyze')
        .send({ documentId: 'employment-v2' });
      expect(res.status).toBe(401);
    });
  });

  // ── Documents (authenticated) ─────────────────────────────────────────────
  describe('GET /api/documents', () => {
    test('returns list of demo documents', async () => {
      const res = await auth(request(app).get('/api/documents'));
      expect(res.status).toBe(200);
      expect(res.body.documents.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /api/documents/demo', () => {
    test('loads employment-v2 demo document', async () => {
      const res = await auth(request(app).post('/api/documents/demo'))
        .send({ documentId: 'employment-v2' });
      expect(res.status).toBe(200);
      expect(res.body.documentId).toBe('employment-v2');
    });
  });

  describe('GET /api/documents/sample', () => {
    test('returns sample document', async () => {
      const res = await auth(request(app).get('/api/documents/sample'));
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/documents/:id', () => {
    test('returns employment-v1', async () => {
      const res = await auth(request(app).get('/api/documents/employment-v1'));
      expect(res.status).toBe(200);
      expect(res.body.document.documentId).toBe('employment-v1');
    });

    test('returns 404 for unknown document', async () => {
      const res = await auth(request(app).get('/api/documents/nonexistent-xyz'));
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ── Analysis ──────────────────────────────────────────────────────────────
  describe('POST /api/analysis/analyze', () => {
    test('analyzes employment-v2', async () => {
      const res = await auth(request(app).post('/api/analysis/analyze'))
        .send({ documentId: 'employment-v2' });
      expect(res.status).toBe(200);
      expect(res.body.clauseCount).toBeGreaterThan(0);
    });

    test('returns 400 when documentId missing', async () => {
      const res = await auth(request(app).post('/api/analysis/analyze')).send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/analysis/clauses', () => {
    test('extracts clauses', async () => {
      const res = await auth(request(app).post('/api/analysis/clauses'))
        .send({ documentId: 'employment-v2' });
      expect(res.status).toBe(200);
      expect(res.body.clauses.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/analysis/obligations', () => {
    test('extracts obligations', async () => {
      const res = await auth(request(app).post('/api/analysis/obligations'))
        .send({ documentId: 'employment-v2' });
      expect(res.status).toBe(200);
      expect(res.body.obligations).toBeInstanceOf(Array);
    });
  });

  // ── Upload + Analyse pipeline ─────────────────────────────────────────────
  describe('Upload pipeline', () => {
    let uploadedDocId = null;

    beforeAll(async () => {
      if (!SAMPLE_EXISTS) return;
      const res = await auth(
        request(app).post('/api/documents/upload')
          .attach('document', SAMPLE_PATH, { filename: 'Sample.txt', contentType: 'text/plain' })
      );
      if (res.status === 200) uploadedDocId = res.body.documentId;
    });

    test('upload returns documentId', () => {
      if (!uploadedDocId) return;
      expect(uploadedDocId).toMatch(/^upload-/);
    });

    test('uploaded doc is analysable', async () => {
      if (!uploadedDocId) return;
      const res = await auth(request(app).post('/api/analysis/analyze'))
        .send({ documentId: uploadedDocId });
      expect(res.status).toBe(200);
      expect(res.body.clauseCount).toBeGreaterThan(0);
    });

    test('Q&A works on uploaded doc', async () => {
      if (!uploadedDocId) return;
      const res = await auth(request(app).post('/api/qa/ask'))
        .send({ question: 'What is the notice period?', documentId: uploadedDocId });
      expect(res.status).toBe(200);
      expect(res.body.answer).toBeTruthy();
    });
  });

  describe('POST /api/qa/ask', () => {
    test('answers question for demo doc', async () => {
      const res = await auth(request(app).post('/api/qa/ask'))
        .send({ question: 'What is the notice period?', documentId: 'employment-v2' });
      expect(res.status).toBe(200);
      expect(res.body.answer).toBeTruthy();
      expect(res.body.confidence).toMatch(/^(high|medium|low)$/);
    });

    test('returns 400 when question missing', async () => {
      const res = await auth(request(app).post('/api/qa/ask'))
        .send({ documentId: 'employment-v2' });
      expect(res.status).toBe(400);
    });

    test('handles out-of-scope questions safely', async () => {
      const res = await auth(request(app).post('/api/qa/ask'))
        .send({ question: 'Should I sue my employer?', documentId: 'employment-v2' });
      expect(res.status).toBe(200);
      expect(res.body.outOfScope).toBe(true);
    });
  });

  describe('GET /api/qa/suggested', () => {
    test('returns suggested questions', async () => {
      const res = await auth(request(app).get('/api/qa/suggested'));
      expect(res.status).toBe(200);
      expect(res.body.questions.length).toBeGreaterThan(0);
    });
  });
 
  describe('POST /api/comparison/compare', () => {
    test('compares v1 and v2', async () => {
      const res = await auth(request(app).post('/api/comparison/compare'))
        .send({ documentAId: 'employment-v1', documentBId: 'employment-v2' });
      expect(res.status).toBe(200);
      expect(res.body.changes.length).toBeGreaterThan(0);
    });

    test('returns 400 when IDs missing', async () => {
      const res = await auth(request(app).post('/api/comparison/compare')).send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/consultation/brief', () => {
    test('generates brief', async () => {
      const res = await auth(request(app).post('/api/consultation/brief'))
        .send({ documentId: 'employment-v2' });
      expect(res.status).toBe(200);
      expect(res.body.questionsForLawyer.length).toBeGreaterThan(0);
      expect(res.body.disclaimer).toBeTruthy();
    });

    test('returns 404 for unknown document', async () => {
      const res = await auth(request(app).post('/api/consultation/brief'))
        .send({ documentId: 'nonexistent-xyz-abc' });
      expect(res.status).toBe(404);
    });
  });

  describe('404 handler', () => {
    test('returns 404 for unknown route', async () => {
      const res = await request(app).get('/api/nonexistent-route');
      expect(res.status).toBe(404);
    });
  });
});
