const AIService = require('./AIService');

/**
 * RealAIService — OpenAI-backed implementation.
 *
 * Only instantiated when OPENAI_API_KEY is present in the environment.
 * Uses GPT-4o with carefully crafted system prompts that enforce the safety
 * guidelines required by ClauseLens (no legal advice, source-grounded answers,
 * careful language about legal enforceability).
 */
class RealAIService extends AIService {
  constructor() {
    super();
    const { OpenAI } = require('openai');
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
  }

  _systemPrompt() {
    return `You are ClauseLens, an AI assistant that helps users understand legal documents.

CRITICAL RULES:
1. ONLY provide information found in the document provided. Never invent clauses.
2. NEVER give legal advice. Do not say "this clause is illegal", "you will win", or "you can safely ignore this".
3. ALWAYS cite source sections when making a claim about the document.
4. Use language such as: "The document states...", "The wording appears to...", "This may be worth reviewing..."
5. If information is not in the document, say: "I couldn't find this information in the provided document."
6. If asked for legal advice (e.g. "should I sue"), respond: "I can help you understand relevant provisions in your agreement and prepare questions for a legal professional, but I cannot determine whether you should pursue legal action."
7. Always distinguish: (a) what the document states, (b) plain-English interpretation, (c) what a lawyer needs to assess.
8. Format responses as valid JSON matching the schema provided in each prompt.

DISCLAIMER LANGUAGE: Always remind users that ClauseLens provides informational assistance only and is not a substitute for legal advice.`;
  }

  async _chat(messages, temperature = 0.2) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: this._systemPrompt() },
        ...messages,
      ],
      temperature,
      response_format: { type: 'json_object' },
    });
    return JSON.parse(response.choices[0].message.content);
  }

  _documentContext(document) {
    const sections = document.sections
      .map(s => `[${s.sectionNumber}] ${s.title} (Page ${s.page}):\n${s.text}`)
      .join('\n\n---\n\n');
    return `Document: "${document.title}"
Parties: ${document.metadata.parties.employer} and ${document.metadata.parties.employee}
Effective Date: ${document.metadata.effectiveDate}
Governing Law: ${document.metadata.governingLaw}

--- DOCUMENT TEXT ---
${sections}`;
  }

  async analyzeDocument(document) {
    const result = await this._chat([{
      role: 'user',
      content: `Analyze this document and return a JSON object with fields:
- summary: { documentType, parties (array), effectiveDate, duration, keyTopics (array) }
- attentionAreas: array of { id, level ("high"|"medium"|"low"), title, summary, sourceSection, sourcePage }
- clauseCount: number
- sectionCount: number
- obligationCount: number

${this._documentContext(document)}`,
    }]);

    return {
      ...result,
      documentId: document.documentId,
      title: document.title,
      metadata: document.metadata,
      disclaimer: document.disclaimer,
      mode: 'ai',
    };
  }

  async extractClauses(document) {
    const result = await this._chat([{
      role: 'user',
      content: `Extract all important clauses from this document. Return a JSON object with:
- clauses: array of { id, sectionId, category, title, attentionLevel ("high"|"medium"|"low"), summary, plainEnglish, whyItMatters, whatToVerify (array), sourceSection, sourcePage, originalText }
Categories: financial, termination, restrictions, ownership, disputes, time, general

${this._documentContext(document)}`,
    }]);

    const grouped = (result.clauses || []).reduce((acc, c) => {
      if (!acc[c.category]) acc[c.category] = [];
      acc[c.category].push(c);
      return acc;
    }, {});

    return {
      documentId: document.documentId,
      clauses: result.clauses || [],
      grouped,
      sections: document.sections,
      total: (result.clauses || []).length,
      mode: 'ai',
    };
  }

  async extractObligations(document) {
    const result = await this._chat([{
      role: 'user',
      content: `Extract all obligations from this document. Return a JSON object with:
- obligations: array of { id, who, action, trigger, deadline, consequence, sourceSection, sourcePage }

${this._documentContext(document)}`,
    }]);

    const obligations = result.obligations || [];
    return {
      documentId: document.documentId,
      obligations,
      total: obligations.length,
      byParty: {
        employee: obligations.filter(o => o.who?.toLowerCase().includes('employee')),
        company: obligations.filter(o => o.who?.toLowerCase().includes('company')),
      },
      mode: 'ai',
    };
  }

  async answerQuestion(question, document, relevantClauses) {
    const clauseContext = relevantClauses.length > 0
      ? `\n\nRelevant clauses retrieved:\n${relevantClauses.map(c =>
          `[${c.sourceSection}] ${c.title}: ${c.originalText}`
        ).join('\n\n')}`
      : '';

    const result = await this._chat([{
      role: 'user',
      content: `Answer this question about the document: "${question}"

Return a JSON object with:
- answer: string (plain-English answer grounded in document)
- evidence: string (the relevant clause text)
- sourceSection: string
- sourcePage: number or null
- confidence: "high" | "medium" | "low"
- outOfScope: boolean (true if question asks for legal advice beyond document scope)
- notFound: boolean (true if answer cannot be found in document)

IMPORTANT: Only answer from the document. If not found, set notFound:true.
${clauseContext}

Full document:
${this._documentContext(document)}`,
    }]);

    return {
      question,
      ...result,
      mode: 'ai',
    };
  }

  async compareDocuments(docA, docB) {
    const result = await this._chat([{
      role: 'user',
      content: `Compare these two document versions and identify all meaningful changes.

Return a JSON object with:
- summary: string overview of overall changes
- overallAssessment: string
- changes: array of {
    id, clauseTitle, section, category, changeType ("added"|"modified"|"removed"),
    attentionLevel ("high"|"medium"|"low"),
    valueBefore, valueAfter,
    plainEnglishBefore, plainEnglishAfter,
    whyItMatters, textBefore, textAfter
  }
- changeCounts: { total, high, medium, low, added, modified, removed }

DOCUMENT A (${docA.title}):
${this._documentContext(docA)}

---

DOCUMENT B (${docB.title}):
${this._documentContext(docB)}`,
    }, ], 0.1);

    return {
      ...result,
      documentA: docA.documentId,
      documentB: docB.documentId,
      documentATitle: docA.title,
      documentBTitle: docB.title,
      mode: 'ai',
    };
  }

  async generateConsultationBrief(document, concern) {
    const result = await this._chat([{
      role: 'user',
      content: `Generate a lawyer consultation preparation brief for someone reviewing this document.
User concern: "${concern || 'Understanding key obligations and restrictions before signing'}"

Return a JSON object with:
- concern: string
- relevantClauses: array of { title, section, attentionLevel, summary }
- questionsForLawyer: array of strings (10 specific questions based on the document)
- documentsToGather: array of strings
- keyDates: array of { label, date, description, sourceSection }
- disclaimer: "This checklist is intended to help prepare for a professional legal consultation. It is not legal advice."

${this._documentContext(document)}`,
    }]);

    return {
      documentId: document.documentId,
      documentTitle: document.title,
      ...result,
      mode: 'ai',
    };
  }

  async extractTimeline(document) {
    const result = await this._chat([{
      role: 'user',
      content: `Extract a chronological timeline from this document.

Return a JSON object with:
- timeline: array of { id, date, label, description, type ("milestone"|"obligation"|"financial"|"restriction"|"deadline"), sourceSection }

Note: For ongoing obligations, use date: "ongoing".
${this._documentContext(document)}`,
    }]);

    return {
      documentId: document.documentId,
      documentTitle: document.title,
      timeline: result.timeline || [],
      total: (result.timeline || []).length,
      mode: 'ai',
    };
  }
}

module.exports = RealAIService;
