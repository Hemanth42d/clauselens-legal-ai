const DemoAIService = require('./DemoAIService');

let _instance = null;

/**
 * Returns the singleton AI service instance.
 * Uses RealAIService when OPENAI_API_KEY is set, DemoAIService otherwise.
 */
function getAIService() {
  if (_instance) return _instance;

  if (process.env.OPENAI_API_KEY) {
    const RealAIService = require('./RealAIService');
    _instance = new RealAIService();
  } else {
    _instance = new DemoAIService();
  }

  return _instance;
}

module.exports = { getAIService };
