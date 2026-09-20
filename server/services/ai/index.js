const DemoAIService = require('./DemoAIService');
const DocumentStore = require('../document/DocumentStore');
const path          = require('path');

let _instance = null;
let _seeded   = false;

/**
 * Seed demo documents into DocumentStore once.
 * Called regardless of which AI service is active so that
 * listDocuments / getDocument work for all service types.
 */
function seedDemoDocs() {
  if (_seeded) return;
  _seeded = true;
  try {
    const v1 = require(path.join(__dirname, '../../data/demo/employment-v1.json'));
    const v2 = require(path.join(__dirname, '../../data/demo/employment-v2.json'));
    DocumentStore.register({ ...v1, isDemo: true }, true);
    DocumentStore.register({ ...v2, isDemo: true }, true);
  } catch (e) {
    // Non-fatal — demo docs simply won't be available
    console.error('[AI] Failed to seed demo documents:', e.message);
  }
}

/**
 * Returns the singleton AI service.
 * Priority: GEMINI_API_KEY (valid) → GeminiAIService
 *           OPENAI_API_KEY        → RealAIService (legacy OpenAI)
 *           otherwise             → DemoAIService (no external calls)
 */
function getAIService() {
  if (_instance) return _instance;

  seedDemoDocs();

  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  // Basic sanity check: Gemini API keys start with "AIza" and are 39 chars long.
  const geminiKeyValid = geminiKey.length >= 39 && geminiKey.startsWith('AIza');

  if (geminiKeyValid) {
    const GeminiAIService = require('./GeminiAIService');
    _instance = new GeminiAIService();
    console.log('[AI] Using GeminiAIService (Gemini API key detected).');
  } else if (geminiKey) {
    console.warn('[AI] GEMINI_API_KEY is set but appears invalid (must start with "AIza" and be ≥39 chars). Falling back to DemoAIService.');
    _instance = new DemoAIService();
  } else if (process.env.OPENAI_API_KEY) {
    const RealAIService = require('./RealAIService');
    _instance = new RealAIService();
    console.log('[AI] Using RealAIService (OpenAI API key detected).');
  } else {
    _instance = new DemoAIService();
    console.log('[AI] No API key configured — using DemoAIService (trial mode).');
  }

  return _instance;
}

module.exports = { getAIService };
