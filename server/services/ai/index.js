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
 * Priority: GEMINI_API_KEY → GeminiAIService
 *           OPENAI_API_KEY → RealAIService (legacy OpenAI)
 *           otherwise      → DemoAIService (no external calls)
 */
function getAIService() {
  if (_instance) return _instance;

  seedDemoDocs();

  if (process.env.GEMINI_API_KEY) {
    const GeminiAIService = require('./GeminiAIService');
    _instance = new GeminiAIService();
  } else if (process.env.OPENAI_API_KEY) {
    const RealAIService = require('./RealAIService');
    _instance = new RealAIService();
  } else {
    _instance = new DemoAIService();
  }

  return _instance;
}

module.exports = { getAIService };
