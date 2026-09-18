/**
 * AI Service factory.
 *
 * Automatically selects the correct implementation:
 *   - RealAIService  when OPENAI_API_KEY is present
 *   - DemoAIService  otherwise (default — no API key required)
 */
const DemoAIService = require('./DemoAIService');

let _instance = null;

function getAIService() {
  if (_instance) return _instance;

  if (process.env.OPENAI_API_KEY) {
    const RealAIService = require('./RealAIService');
    console.log('[AIService] Using RealAIService (OpenAI)');
    _instance = new RealAIService();
  } else {
    console.log('[AIService] No API key found — using DemoAIService');
    _instance = new DemoAIService();
  }

  return _instance;
}

module.exports = { getAIService };
