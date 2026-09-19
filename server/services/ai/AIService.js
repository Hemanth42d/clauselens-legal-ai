/**
 * Abstract base class for AI service implementations.
 * Concrete implementations: DemoAIService, RealAIService.
 */
class AIService {
  async analyzeDocument(document)                          { throw new Error('analyzeDocument() must be implemented'); }
  async extractClauses(document)                           { throw new Error('extractClauses() must be implemented'); }
  async extractObligations(document)                       { throw new Error('extractObligations() must be implemented'); }
  async answerQuestion(question, document, clauses)        { throw new Error('answerQuestion() must be implemented'); }
  async compareDocuments(docA, docB)                       { throw new Error('compareDocuments() must be implemented'); }
  async generateConsultationBrief(document, concern)       { throw new Error('generateConsultationBrief() must be implemented'); }
  async extractTimeline(documentId)                        { throw new Error('extractTimeline() must be implemented'); }
}

module.exports = AIService;
