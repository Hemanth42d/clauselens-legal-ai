const AIService     = require('./AIService');
const DocumentStore = require('../document/DocumentStore');
const path          = require('path');

const demoV1       = require(path.join(__dirname, '../../data/demo/employment-v1.json'));
const demoV2       = require(path.join(__dirname, '../../data/demo/employment-v2.json'));
const demoComparison = require(path.join(__dirname, '../../data/demo/comparison.json'));
const demoQA       = require(path.join(__dirname, '../../data/demo/qa-responses.json'));

const OUT_OF_SCOPE_PATTERNS = [
  'should i sue', 'can i sue', 'take legal action', 'file a case',
  'am i right', 'will i win', 'is this illegal', 'is this enforceable',
  'what should i do about my boss', 'should i quit', 'advice on',
];

const DEMO_IDS = new Set(['employment-v1', 'employment-v2']);

/**
 * Deterministic AI service using bundled demo data + any runtime-uploaded documents.
 * Used when OPENAI_API_KEY is not set. No external calls.
 */
class DemoAIService extends AIService {
  constructor() {
    super();
    this._seedDemoDocs();
  }

  async _seedDemoDocs() {
    try {
      const hasV1 = await DocumentStore.has('employment-v1');
      if (!hasV1) await DocumentStore.register({ ...demoV1, isDemo: true }, true);

      const hasV2 = await DocumentStore.has('employment-v2');
      if (!hasV2) await DocumentStore.register({ ...demoV2, isDemo: true }, true);
      console.log('✅ Demo documents seeded');
    } catch (err) {
      console.error('Failed to seed demo docs:', err);
    }
  }

  async _getDocument(documentId) {
    const doc = await DocumentStore.get(documentId);
    if (!doc) throw Object.assign(new Error(`Document not found: ${documentId}`), { status: 404 });
    return doc;
  }

  _delay(min = 200, max = 600) {
    return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
  }

  async registerDocument(doc) {
    return await DocumentStore.register(doc, false);
  }

  async analyzeDocument(document) {
    await this._delay(400, 800);
    const doc            = typeof document === 'string' ? await this._getDocument(document) : document;
    const attentionAreas = doc.attentionAreas || [];
    return {
      documentId:   doc.documentId,
      title:        doc.title,
      version:      doc.version,
      disclaimer:   doc.disclaimer,
      metadata:     doc.metadata,
      summary:      doc.summary,
      clauseCount:     (doc.clauses      || []).length,
      sectionCount:    (doc.sections     || []).length,
      obligationCount: (doc.obligations  || []).length,
      attentionAreas,
      attentionCounts: {
        high:   attentionAreas.filter(a => a.level === 'high').length,
        medium: attentionAreas.filter(a => a.level === 'medium').length,
        low:    attentionAreas.filter(a => a.level === 'low').length,
      },
      isDemo:     !!doc.isDemo,
      isUploaded: !!doc.isUploaded,
      mode: 'demo',
    };
  }

  async extractClauses(document) {
    await this._delay(300, 600);
    const doc     = typeof document === 'string' ? await this._getDocument(document) : document;
    const clauses = doc.clauses || [];
    const grouped = clauses.reduce((acc, c) => {
      (acc[c.category || 'general'] = acc[c.category || 'general'] || []).push(c);
      return acc;
    }, {});
    return { documentId: doc.documentId, clauses, grouped, sections: doc.sections || [], total: clauses.length, mode: 'demo' };
  }

  async extractObligations(document) {
    await this._delay(200, 500);
    const doc         = typeof document === 'string' ? await this._getDocument(document) : document;
    const obligations = doc.obligations || [];
    return {
      documentId: doc.documentId,
      obligations,
      total: obligations.length,
      byParty: {
        employee: obligations.filter(o => (o.who || '').toLowerCase().includes('employee')),
        company:  obligations.filter(o => (o.who || '').toLowerCase().includes('company') || (o.who || '').toLowerCase().includes('employer')),
      },
      mode: 'demo',
    };
  }

  async answerQuestion(question, documentId, relevantClauses) {
    await this._delay(400, 800);
    const q = (question || '').toLowerCase().trim();

    if (OUT_OF_SCOPE_PATTERNS.some(p => q.includes(p))) {
      return { question, answer: demoQA.outOfScopeResponse.answer, suggestion: demoQA.outOfScopeResponse.suggestion, evidence: null, sourceSection: null, sourcePage: null, confidence: 'low', outOfScope: true, mode: 'demo' };
    }

    if (documentId && !DEMO_IDS.has(documentId)) {
      return this._answerFromClauses(question, relevantClauses);
    }

    const match = this._findBestQAMatch(q);
    if (match) {
      return { question, answer: match.answer, evidence: match.evidence, sourceSection: match.sourceSection, sourcePage: match.sourcePage, confidence: match.confidence, relatedClauses: match.relatedClauses || [], outOfScope: false, mode: 'demo' };
    }

    return { question, answer: demoQA.notFoundResponse.answer, suggestion: demoQA.notFoundResponse.suggestion, evidence: null, sourceSection: null, sourcePage: null, confidence: 'low', notFound: true, mode: 'demo' };
  }

  _answerFromClauses(question, clauses) {
    if (!clauses || !clauses.length) {
      return { question, answer: demoQA.notFoundResponse.answer, suggestion: demoQA.notFoundResponse.suggestion, evidence: null, sourceSection: null, sourcePage: null, confidence: 'low', notFound: true, mode: 'demo' };
    }
    const top = clauses[0];
    return { question, answer: `Based on the document, ${top.plainEnglish || top.summary}`, evidence: top.originalText || top.summary, sourceSection: top.sourceSection, sourcePage: top.sourcePage, confidence: 'medium', relatedClauses: clauses.slice(1, 3).map(c => c.id), outOfScope: false, notFound: false, mode: 'demo' };
  }

  _findBestQAMatch(question) {
    let best = null, top = 0;
    for (const r of demoQA.responses) {
      let score = 0;
      for (const p of r.questionPatterns) {
        if (question.includes(p)) score += p.split(' ').length;
      }
      if (score > top) { top = score; best = r; }
    }
    return top > 0 ? best : null;
  }

  async compareDocuments(docAId, docBId) {
    await this._delay(500, 1000);

    if ((docAId === 'employment-v1' && docBId === 'employment-v2') ||
        (docAId === 'employment-v2' && docBId === 'employment-v1')) {
      const a = await this._getDocument('employment-v1');
      const b = await this._getDocument('employment-v2');
      return {
        ...demoComparison,
        documentATitle: a.title, documentBTitle: b.title,
        documentAVersion: a.version, documentBVersion: b.version,
        changeCounts: {
          total:    demoComparison.changes.length,
          high:     demoComparison.changes.filter(c => c.attentionLevel === 'high').length,
          medium:   demoComparison.changes.filter(c => c.attentionLevel === 'medium').length,
          low:      demoComparison.changes.filter(c => c.attentionLevel === 'low').length,
          added:    demoComparison.changes.filter(c => c.changeType === 'added').length,
          modified: demoComparison.changes.filter(c => c.changeType === 'modified').length,
          removed:  demoComparison.changes.filter(c => c.changeType === 'removed').length,
        },
        mode: 'demo',
      };
    }

    const docA = await DocumentStore.get(docAId);
    const docB = await DocumentStore.get(docBId);
    if (!docA || !docB) throw Object.assign(new Error('One or both documents not found. Please re-upload them.'), { status: 404 });
    return this._compareGeneric(docA, docB);
  }

  _compareGeneric(docA, docB) {
    const changes  = [];
    const mapA     = new Map((docA.sections || []).map(s => [s.id, s]));
    const mapB     = new Map((docB.sections || []).map(s => [s.id, s]));
    let id = 1;

    for (const [sid, secA] of mapA) {
      if (mapB.has(sid)) {
        if (secA.text !== mapB.get(sid).text) {
          const secB = mapB.get(sid);
          changes.push({ id: `chg-${id++}`, clauseTitle: secA.title, section: `Section ${sid}`, category: secA.category, changeType: 'modified', attentionLevel: 'medium', valueBefore: 'See version A text', valueAfter: 'See version B text', plainEnglishBefore: `Version A: ${secA.title}`, plainEnglishAfter: `Version B: ${secB.title}`, whyItMatters: 'This section was modified. Review carefully.', textBefore: secA.text.slice(0, 200), textAfter: secB.text.slice(0, 200) });
        }
      } else {
        changes.push({ id: `chg-${id++}`, clauseTitle: secA.title, section: `Section ${sid}`, category: secA.category, changeType: 'removed', attentionLevel: 'high', valueBefore: 'Present in version A', valueAfter: null, plainEnglishBefore: `Version A contains: ${secA.title}`, plainEnglishAfter: 'Not present in version B.', whyItMatters: 'This section was removed. Review carefully.', textBefore: secA.text.slice(0, 200), textAfter: null });
      }
    }

    for (const [sid, secB] of mapB) {
      if (!mapA.has(sid)) {
        changes.push({ id: `chg-${id++}`, clauseTitle: secB.title, section: `Section ${sid}`, category: secB.category, changeType: 'added', attentionLevel: 'medium', valueBefore: null, valueAfter: 'Present in version B', plainEnglishBefore: 'Not in version A.', plainEnglishAfter: `Version B adds: ${secB.title}`, whyItMatters: 'New section added. Review to understand new obligations.', textBefore: null, textAfter: secB.text.slice(0, 200) });
      }
    }

    const counts = (type, field) => changes.filter(c => c[field] === type).length;
    return {
      comparisonId: `compare-${Date.now()}`, documentA: docA.documentId, documentB: docB.documentId,
      documentATitle: docA.title, documentBTitle: docB.title,
      summary: `Comparison of "${docA.title}" and "${docB.title}". ${changes.length} difference(s) detected.`,
      overallAssessment: 'Review each changed section carefully before signing.',
      changes,
      changeCounts: { total: changes.length, high: counts('high','attentionLevel'), medium: counts('medium','attentionLevel'), low: counts('low','attentionLevel'), added: counts('added','changeType'), modified: counts('modified','changeType'), removed: counts('removed','changeType') },
      disclaimer: 'FICTIONAL DEMONSTRATION DOCUMENT — NOT LEGAL ADVICE.',
      mode: 'demo',
    };
  }

  async generateConsultationBrief(documentId, concern) {
    await this._delay(500, 900);
    const doc     = await this._getDocument(documentId || 'employment-v2');
    const high    = (doc.attentionAreas || []).filter(a => a.level === 'high');
    const medium  = (doc.attentionAreas || []).filter(a => a.level === 'medium');
    const isDemoDoc = doc.isDemo;

    const questions = isDemoDoc ? [
      'Is the 90-day notice period enforceable and standard for my role?',
      'What are the practical implications of the 5-year confidentiality obligation?',
      'Does the automatic renewal clause create any obligations I should be aware of?',
      'Can the 18-month non-solicitation restriction be enforced as written?',
      'If I receive training and am made redundant, does the recovery clause still apply?',
      'Should I disclose existing personal projects or IP before signing?',
      'What happens to my rights if the company is acquired during my employment?',
      'Are there provisions that may conflict with applicable employment law?',
      'What is the process if I disagree with a disciplinary decision?',
      'Can the terms be changed unilaterally by the company?',
    ] : [
      'Are there any clauses I should negotiate before signing?',
      'What are the key obligations I need to be aware of?',
      'Are there any unusual or restrictive clauses?',
      'What are my rights if the other party breaches?',
      'Are there deadlines or time limits I need to track?',
      'Is anything in this agreement restricting my future activities?',
      'What happens if I need to exit this agreement early?',
      'Are there any financial penalties or recovery obligations?',
      'Are there any clauses I should clarify before signing?',
      'What documents should I retain after signing?',
    ];

    return {
      documentId: doc.documentId, documentTitle: doc.title,
      disclaimer: 'This checklist is intended to help prepare for a professional legal consultation. It is not legal advice.',
      concern: concern || 'Understanding the key obligations and restrictions in this agreement before signing.',
      relevantClauses: [...high, ...medium].map(a => ({ title: a.title, section: a.sourceSection, attentionLevel: a.level, summary: a.summary })),
      questionsForLawyer: questions,
      documentsToGather: [
        'This agreement (signed copy)',
        'Any offer letter or prior written terms',
        'Related agreements (e.g. training, NDA)',
        'Previous version of this agreement (if applicable)',
        'Any relevant written correspondence',
        'Company handbook or policies referenced in the agreement',
      ],
      keyDates: (doc.timeline || [])
        .filter(t => t.type === 'milestone' || t.type === 'deadline')
        .slice(0, 5)
        .map(t => ({ label: t.label, date: t.date, description: t.description, sourceSection: t.sourceSection })),
      mode: 'demo',
    };
  }

  async extractTimeline(documentId) {
    await this._delay(150, 400);
    const doc = await this._getDocument(documentId || 'employment-v2');
    return { documentId: doc.documentId, documentTitle: doc.title, timeline: doc.timeline || [], total: (doc.timeline || []).length, mode: 'demo' };
  }

  async listDocuments(userId)        { return await DocumentStore.list(userId); }
  async getDocument(id)              { return await this._getDocument(id); }
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

module.exports = DemoAIService;
