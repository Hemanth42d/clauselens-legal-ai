const AIService     = require('./AIService');
const DocumentStore = require('../document/DocumentStore');

const MAX_CONTEXT_CHARS = 80000;

/**
 * Google Gemini-backed AI service.
 * Instantiated when GEMINI_API_KEY is set in the environment.
 * Falls back to DemoAIService when key is absent.
 */
class GeminiAIService extends AIService {
  constructor() {
    super();
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  _systemInstruction() {
    return [
      'You are ClauseLens, an AI assistant that helps users understand legal documents.',
      'RULES:',
      '1. Only provide information found in the document. Never invent clauses.',
      '2. Never give legal advice or claim a clause is enforceable/illegal.',
      '3. Always cite source sections when making a factual claim.',
      '4. Use language like: "The document states...", "The wording appears to..."',
      '5. If information is absent: "I couldn\'t find this in the provided document."',
      '6. For legal strategy questions respond: "I can help you understand relevant provisions, but cannot advise on legal action."',
      '7. ALWAYS return valid JSON matching the schema in each prompt. No markdown fences, pure JSON only.',
    ].join('\n');
  }

  async _chat(prompt) {
    try {
      const model    = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: this._systemInstruction(),
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      });
      const result   = await model.generateContent(prompt);
      const text     = result.response.text();
      return JSON.parse(text);
    } catch (err) {
      throw Object.assign(new Error(err.message || 'AI service unavailable'), { status: 502 });
    }
  }

  _documentContext(document) {
    const raw = (document.sections || [])
      .map(s => `[${s.sectionNumber}] ${s.title} (Page ${s.page}):\n${s.text}`)
      .join('\n\n---\n\n');

    const truncated = raw.length > MAX_CONTEXT_CHARS
      ? raw.slice(0, MAX_CONTEXT_CHARS) + '\n\n[Document truncated for length]'
      : raw;

    const p = document.metadata?.parties || {};
    return [
      `Document: "${document.title}"`,
      p.employer ? `Employer: ${p.employer}` : '',
      p.employee ? `Employee: ${p.employee}` : '',
      document.metadata?.effectiveDate ? `Effective: ${document.metadata.effectiveDate}` : '',
      document.metadata?.governingLaw  ? `Governing Law: ${document.metadata.governingLaw}` : '',
      '', '--- DOCUMENT TEXT ---', truncated,
    ].filter(Boolean).join('\n');
  }

  async analyzeDocument(document) {
    const result = await this._chat(`Analyze this document and return JSON:
{
  "summary": { "documentType": "", "parties": [], "effectiveDate": "", "duration": "", "keyTopics": [] },
  "attentionAreas": [{ "id": "1", "level": "high|medium|low", "title": "", "summary": "", "sourceSection": "", "sourcePage": 1 }],
  "clauseCount": 0, "sectionCount": 0, "obligationCount": 0
}

${this._documentContext(document)}`);

    return {
      ...result,
      documentId: document.documentId,
      title:      document.title,
      metadata:   document.metadata,
      disclaimer: document.disclaimer,
      isUploaded: !!document.isUploaded,
      mode: 'ai',
    };
  }

  async extractClauses(document) {
    const result = await this._chat(`Extract all important clauses and return JSON:
{
  "clauses": [{
    "id": "", "sectionId": "", "category": "financial|termination|restrictions|ownership|disputes|time|general",
    "title": "", "attentionLevel": "high|medium|low", "summary": "", "plainEnglish": "",
    "whyItMatters": "", "whatToVerify": [], "sourceSection": "", "sourcePage": 1, "originalText": ""
  }]
}

${this._documentContext(document)}`);

    const clauses = result.clauses || [];
    const grouped = clauses.reduce((acc, c) => {
      (acc[c.category] = acc[c.category] || []).push(c); return acc;
    }, {});

    return { documentId: document.documentId, clauses, grouped, sections: document.sections, total: clauses.length, mode: 'ai' };
  }

  async extractObligations(document) {
    const result = await this._chat(`Extract all obligations and return JSON:
{ "obligations": [{ "id": "", "who": "", "action": "", "trigger": "", "deadline": "", "consequence": "", "sourceSection": "", "sourcePage": 1 }] }

${this._documentContext(document)}`);

    const obligations = result.obligations || [];
    return {
      documentId: document.documentId,
      obligations,
      total: obligations.length,
      byParty: {
        employee: obligations.filter(o => o.who?.toLowerCase().includes('employee')),
        company:  obligations.filter(o => o.who?.toLowerCase().includes('company')),
      },
      mode: 'ai',
    };
  }

  async answerQuestion(question, document, relevantClauses) {
    const clauseCtx = relevantClauses.length
      ? '\n\nRelevant clauses:\n' + relevantClauses.map(c => `[${c.sourceSection}] ${c.title}: ${c.originalText}`).join('\n\n')
      : '';

    const result = await this._chat(`Answer this question about the document: "${question}"

Return JSON:
{ "answer": "", "evidence": "", "sourceSection": "", "sourcePage": null, "confidence": "high|medium|low", "outOfScope": false, "notFound": false }
${clauseCtx}

${this._documentContext(document)}`);

    return { question, ...result, mode: 'ai' };
  }

  async compareDocuments(docA, docB) {
    const result = await this._chat(`Compare these two documents and return JSON:
{
  "summary": "", "overallAssessment": "",
  "changes": [{
    "id": "", "clauseTitle": "", "section": "", "category": "",
    "changeType": "added|modified|removed", "attentionLevel": "high|medium|low",
    "valueBefore": "", "valueAfter": "",
    "plainEnglishBefore": "", "plainEnglishAfter": "",
    "whyItMatters": "", "textBefore": "", "textAfter": ""
  }],
  "changeCounts": { "total": 0, "high": 0, "medium": 0, "low": 0, "added": 0, "modified": 0, "removed": 0 }
}

DOCUMENT A (${docA.title}):
${this._documentContext(docA)}

---

DOCUMENT B (${docB.title}):
${this._documentContext(docB)}`);

    return {
      ...result,
      documentA: docA.documentId, documentB: docB.documentId,
      documentATitle: docA.title,  documentBTitle: docB.title,
      mode: 'ai',
    };
  }

  async generateConsultationBrief(document, concern) {
    const result = await this._chat(`Generate a lawyer consultation brief. User concern: "${concern || 'Understanding key obligations before signing'}"

Return JSON:
{
  "concern": "", "relevantClauses": [{ "title": "", "section": "", "attentionLevel": "", "summary": "" }],
  "questionsForLawyer": [], "documentsToGather": [],
  "keyDates": [{ "label": "", "date": "", "description": "", "sourceSection": "" }],
  "disclaimer": "This checklist is intended to help prepare for a professional legal consultation. It is not legal advice."
}

${this._documentContext(document)}`);

    return { documentId: document.documentId, documentTitle: document.title, ...result, mode: 'ai' };
  }

  async extractTimeline(documentId) {
    const doc = DocumentStore.get(documentId);
    if (!doc) throw Object.assign(new Error(`Document not found: ${documentId}`), { status: 404 });

    const result = await this._chat(`Extract a chronological timeline. Return JSON:
{ "timeline": [{ "id": "", "date": "YYYY-MM-DD or ongoing", "label": "", "description": "", "type": "milestone|obligation|financial|restriction|deadline", "sourceSection": "" }] }

${this._documentContext(doc)}`);

    return { documentId: doc.documentId, documentTitle: doc.title, timeline: result.timeline || [], total: (result.timeline || []).length, mode: 'ai' };
  }

  // GeminiAIService also needs listDocuments / getDocument for the document controller
  listDocuments() { return DocumentStore.list(); }
  getDocument(id) {
    const doc = DocumentStore.get(id);
    if (!doc) throw Object.assign(new Error(`Document not found: ${id}`), { status: 404 });
    return doc;
  }
  registerDocument(doc) { return DocumentStore.register(doc, false); }
  getSuggestedQuestions() {
    return [
      'What is the notice period?', 'What happens if I resign?',
      'Is there a training repayment clause?', 'How long does confidentiality last?',
      'Who owns intellectual property?', 'What are my major obligations?',
      'What should I clarify before signing?', 'Does the contract automatically renew?',
    ];
  }
}

module.exports = GeminiAIService;
