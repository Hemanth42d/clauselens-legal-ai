/**
 * AIService — Abstract base class for AI service implementations.
 *
 * Two concrete implementations exist:
 *   - DemoAIService  : deterministic, no external API required (default)
 *   - RealAIService  : uses OpenAI API when OPENAI_API_KEY is present
 *
 * All methods return plain JavaScript objects that are serialised to JSON by
 * the route handlers.
 */
class AIService {
  /**
   * Analyse a document and return structured results.
   * @param {object} document - Parsed document object
   * @returns {Promise<object>} Analysis result
   */
  async analyzeDocument(document) {
    throw new Error('analyzeDocument() must be implemented');
  }

  /**
   * Extract and classify clauses from a document.
   * @param {object} document - Parsed document object
   * @returns {Promise<object[]>} Array of clause objects
   */
  async extractClauses(document) {
    throw new Error('extractClauses() must be implemented');
  }

  /**
   * Extract obligations from a document.
   * @param {object} document - Parsed document object
   * @returns {Promise<object[]>} Array of obligation objects
   */
  async extractObligations(document) {
    throw new Error('extractObligations() must be implemented');
  }

  /**
   * Answer a natural-language question grounded in the document.
   * @param {string} question - User question
   * @param {object} document - Parsed document object
   * @param {object[]} relevantClauses - Pre-retrieved relevant clauses
   * @returns {Promise<object>} Answer object with evidence and source
   */
  async answerQuestion(question, document, relevantClauses) {
    throw new Error('answerQuestion() must be implemented');
  }

  /**
   * Compare two document versions and return a structured diff.
   * @param {object} docA - First document
   * @param {object} docB - Second document
   * @returns {Promise<object>} Comparison result
   */
  async compareDocuments(docA, docB) {
    throw new Error('compareDocuments() must be implemented');
  }

  /**
   * Generate a lawyer consultation preparation brief.
   * @param {object} document - Parsed document object
   * @param {string} concern - User's stated concern (optional)
   * @returns {Promise<object>} Consultation brief object
   */
  async generateConsultationBrief(document, concern) {
    throw new Error('generateConsultationBrief() must be implemented');
  }

  /**
   * Extract a visual timeline from a document.
   * @param {object} document - Parsed document object
   * @returns {Promise<object[]>} Array of timeline event objects
   */
  async extractTimeline(document) {
    throw new Error('extractTimeline() must be implemented');
  }
}

module.exports = AIService;
