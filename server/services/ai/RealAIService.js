const AIService = require('./AIService');
const DocumentStore = require('../document/DocumentStore');
const prompts = require('../../ai/prompts/legalAnalysisPrompt');
const validator = require('../../ai/validation/responseValidator');
const { parseWithRepair } = require('../../ai/validation/jsonRepair');

class RealAIService extends AIService {
  constructor() {
    super();
    const { OpenAI } = require('openai');
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model  = process.env.OPENAI_MODEL || 'gpt-4o';
  }

  async _chat(messages, temperature = 0.2) {
    let retries = 3;
    let delay = 1000;
    while (retries >= 0) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [{ role: 'system', content: prompts.SYSTEM_PROMPT }, ...messages],
          temperature,
          response_format: { type: 'json_object' },
        });
        return response.choices[0].message.content;
      } catch (err) {
        if (retries === 0) {
          throw Object.assign(new Error(err.message || 'AI service unavailable'), { status: 502 });
        }
        if (err.status === 429 || err.status === 503 || (err.message && (err.message.includes('overloaded') || err.message.includes('rate limit')))) {
          retries--;
          await new Promise(r => setTimeout(r, delay));
          delay *= 2; // Exponential backoff
        } else {
          throw Object.assign(new Error(err.message || 'AI service unavailable'), { status: 502 });
        }
      }
    }
  }

  // Helper for JSON repair retries
  _createRepairFn(messages, temperature) {
    return async (invalidJsonText) => {
      const repairMessages = [
        ...messages,
        { role: 'assistant', content: invalidJsonText },
        { role: 'user', content: 'Your previous response was not valid JSON. Please fix any syntax errors, ensure there are no markdown fences or trailing text, and return ONLY a valid JSON object matching the requested schema.' }
      ];
      return await this._chat(repairMessages, temperature);
    };
  }

  async analyzeDocument(document) {
    const messages = [{ role: 'user', content: prompts.buildAnalysisPrompt(document) }];
    const rawText = await this._chat(messages);
    const rawJson = await parseWithRepair(rawText, this._createRepairFn(messages, 0.2));
    const result = validator.validateAnalysisResponse(rawJson);

    return {
      ...result,
      documentId: document.documentId,
      title:      document.title,
      metadata:   document.metadata,
      disclaimer: document.disclaimer,
      mode: 'ai',
    };
  }

  async extractClauses(document) {
    const messages = [{ role: 'user', content: prompts.buildClausePrompt(document) }];
    const rawText = await this._chat(messages);
    const rawJson = await parseWithRepair(rawText, this._createRepairFn(messages, 0.2));
    const result = validator.validateClauseResponse(rawJson);

    return { ...result, documentId: document.documentId, sections: document.sections, mode: 'ai' };
  }

  async extractObligations(document) {
    const messages = [{ role: 'user', content: prompts.buildObligationPrompt(document) }];
    const rawText = await this._chat(messages);
    const rawJson = await parseWithRepair(rawText, this._createRepairFn(messages, 0.2));
    const result = validator.validateObligationResponse(rawJson);

    return { ...result, documentId: document.documentId, mode: 'ai' };
  }

  async answerQuestion(question, document, relevantClauses) {
    const messages = [{ role: 'user', content: prompts.buildQAPrompt(question, document, relevantClauses) }];
    const rawText = await this._chat(messages);
    const rawJson = await parseWithRepair(rawText, this._createRepairFn(messages, 0.2));
    const result = validator.validateQAResponse(rawJson, question);

    return { ...result, mode: 'ai' };
  }

  async compareDocuments(docA, docB) {
    const messages = [{ role: 'user', content: prompts.buildComparisonPrompt(docA, docB) }];
    const rawText = await this._chat(messages, 0.1);
    const rawJson = await parseWithRepair(rawText, this._createRepairFn(messages, 0.1));
    const result = validator.validateComparisonResponse(rawJson);

    return {
      ...result,
      documentA: docA.documentId, documentB: docB.documentId,
      documentATitle: docA.title, documentBTitle: docB.title,
      mode: 'ai',
    };
  }

  async generateConsultationBrief(document, concern) {
    const messages = [{ role: 'user', content: prompts.buildConsultationPrompt(document, concern) }];
    const rawText = await this._chat(messages);
    const rawJson = await parseWithRepair(rawText, this._createRepairFn(messages, 0.2));
    const result = validator.validateConsultationResponse(rawJson);

    return { ...result, documentId: document.documentId, documentTitle: document.title, mode: 'ai' };
  }

  async extractTimeline(documentId) {
    const doc = await this.getDocument(documentId);
    if (!doc) throw Object.assign(new Error(`Document not found: ${documentId}`), { status: 404 });

    const messages = [{ role: 'user', content: prompts.buildTimelinePrompt(doc) }];
    const rawText = await this._chat(messages);
    const rawJson = await parseWithRepair(rawText, this._createRepairFn(messages, 0.2));
    const result = validator.validateTimelineResponse(rawJson);

    return { ...result, documentId: doc.documentId, documentTitle: doc.title, mode: 'ai' };
  }

  // --- Missing Document Store Integration ---
  async registerDocument(doc) {
    return await DocumentStore.register(doc, false);
  }

  async listDocuments(userId) {
    return await DocumentStore.list(userId);
  }

  async getDocument(id) {
    const doc = await DocumentStore.get(id);
    if (!doc) throw Object.assign(new Error(`Document not found: ${id}`), { status: 404 });
    return doc;
  }

  getSuggestedQuestions() {
    return [
      'What is the notice period?', 'What happens if I resign?',
      'Is there a training repayment clause?', 'How long does confidentiality last?',
      'Who owns intellectual property?', 'What are my major obligations?',
      'What should I clarify before signing?', 'Does the contract automatically renew?',
      'What are the non-solicitation restrictions?', 'What is the probation period?',
    ];
  }
}

module.exports = RealAIService;
