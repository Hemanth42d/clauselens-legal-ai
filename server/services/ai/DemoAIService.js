const AIService    = require('./AIService');
const DocumentStore = require('../document/DocumentStore');
const path         = require('path');

// Pre-load demo data once at module load time
const demoV1       = require(path.join(__dirname, '../../data/demo/employment-v1.json'));
const demoV2       = require(path.join(__dirname, '../../data/demo/employment-v2.json'));
const demoComparison = require(path.join(__dirname, '../../data/demo/comparison.json'));
const demoQA       = require(path.join(__dirname, '../../data/demo/qa-responses.json'));

/**
 * DemoAIService — fully deterministic AI service backed by bundled demo data
 * AND any documents registered at runtime (uploaded PDFs).
 *
 * Used automatically when OPENAI_API_KEY is not set.
 */
class DemoAIService extends AIService {
  constructor() {
    super();

    // Register demo docs into the shared store (persistent — no TTL)
    const v1 = { ...demoV1, isDemo: true };
    const v2 = { ...demoV2, isDemo: true };
    DocumentStore.register(v1, true);
    DocumentStore.register(v2, true);
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  _getDocument(documentId) {
    const doc = DocumentStore.get(documentId);
    if (!doc) throw Object.assign(
      new Error(`Document not found: ${documentId}`),
      { status: 404 }
    );
    return doc;
  }

  _simulateDelay(min = 200, max = 600) {
    return new Promise(resolve =>
      setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
    );
  }

  // ── Public: register an uploaded document ──────────────────────────────────

  registerDocument(doc) {
    return DocumentStore.register(doc, false); // with TTL
  }

  // ── AIService implementation ────────────────────────────────────────────────

  async analyzeDocument(document) {
    await this._simulateDelay(400, 800);

    const doc = typeof document === 'string'
      ? this._getDocument(document)
      : document;

    const attentionAreas  = doc.attentionAreas || [];
    const clauseCount     = (doc.clauses || []).length;
    const obligationCount = (doc.obligations || []).length;
    const sectionCount    = (doc.sections || []).length;

    return {
      documentId:   doc.documentId,
      title:        doc.title,
      version:      doc.version,
      disclaimer:   doc.disclaimer,
      metadata:     doc.metadata,
      summary:      doc.summary,
      clauseCount,
      sectionCount,
      obligationCount,
      attentionAreas,
      attentionCounts: {
        high:   attentionAreas.filter(a => a.level === 'high').length,
        medium: attentionAreas.filter(a => a.level === 'medium').length,
        low:    attentionAreas.filter(a => a.level === 'low').length,
      },
      isDemo:     !!doc.isDemo,
      isUploaded: !!doc.isUploaded,
      mode:       'demo',
    };
  }

  async extractClauses(document) {
    await this._simulateDelay(300, 600);

    const doc = typeof document === 'string'
      ? this._getDocument(document)
      : document;

    const clauses = doc.clauses || [];
    const grouped = clauses.reduce((acc, clause) => {
      const cat = clause.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(clause);
      return acc;
    }, {});

    return {
      documentId: doc.documentId,
      clauses,
      grouped,
      sections:   doc.sections || [],
      total:      clauses.length,
      mode:       'demo',
    };
  }

  async extractObligations(document) {
    await this._simulateDelay(200, 500);

    const doc = typeof document === 'string'
      ? this._getDocument(document)
      : document;

    const obligations = doc.obligations || [];

    return {
      documentId:  doc.documentId,
      obligations,
      total:       obligations.length,
      byParty: {
        employee: obligations.filter(o =>
          (o.who || '').toLowerCase().includes('employee')),
        company:  obligations.filter(o =>
          (o.who || '').toLowerCase().includes('company') ||
          (o.who || '').toLowerCase().includes('employer')),
      },
      mode: 'demo',
    };
  }

  async answerQuestion(question, documentId, relevantClauses) {
    await this._simulateDelay(400, 800);

    const q = (question || '').toLowerCase().trim();

    // Detect out-of-scope questions (legal advice requests)
    const outOfScopePatterns = [
      'should i sue', 'can i sue', 'take legal action', 'file a case',
      'am i right', 'will i win', 'is this illegal', 'is this enforceable',
      'what should i do about my boss', 'should i quit', 'advice on',
    ];
    if (outOfScopePatterns.some(p => q.includes(p))) {
      return {
        question,
        answer:      demoQA.outOfScopeResponse.answer,
        suggestion:  demoQA.outOfScopeResponse.suggestion,
        evidence:    null,
        sourceSection: null,
        sourcePage:  null,
        confidence:  'low',
        outOfScope:  true,
        mode:        'demo',
      };
    }

    // For uploaded documents, try to answer from relevant clauses
    if (documentId && !['employment-v1', 'employment-v2'].includes(documentId)) {
      return this._answerFromClauses(question, relevantClauses);
    }

    // Demo documents — use pre-built Q&A responses
    const bestMatch = this._findBestQAMatch(q);
    if (bestMatch) {
      return {
        question,
        answer:       bestMatch.answer,
        evidence:     bestMatch.evidence,
        sourceSection: bestMatch.sourceSection,
        sourcePage:   bestMatch.sourcePage,
        confidence:   bestMatch.confidence,
        relatedClauses: bestMatch.relatedClauses || [],
        outOfScope:   false,
        mode:         'demo',
      };
    }

    return {
      question,
      answer:      demoQA.notFoundResponse.answer,
      suggestion:  demoQA.notFoundResponse.suggestion,
      evidence:    null,
      sourceSection: null,
      sourcePage:  null,
      confidence:  'low',
      notFound:    true,
      mode:        'demo',
    };
  }

  _answerFromClauses(question, relevantClauses) {
    if (!relevantClauses || relevantClauses.length === 0) {
      return {
        question,
        answer:    demoQA.notFoundResponse.answer,
        suggestion: demoQA.notFoundResponse.suggestion,
        evidence:  null,
        sourceSection: null,
        sourcePage: null,
        confidence: 'low',
        notFound:  true,
        mode:      'demo',
      };
    }

    const top = relevantClauses[0];
    return {
      question,
      answer: `Based on the document, ${top.plainEnglish || top.summary}`,
      evidence:     top.originalText || top.summary,
      sourceSection: top.sourceSection,
      sourcePage:   top.sourcePage,
      confidence:   'medium',
      relatedClauses: relevantClauses.slice(1, 3).map(c => c.id),
      outOfScope:   false,
      notFound:     false,
      mode:         'demo',
    };
  }

  _findBestQAMatch(question) {
    let bestMatch = null;
    let bestScore = 0;

    for (const response of demoQA.responses) {
      let score = 0;
      for (const pattern of response.questionPatterns) {
        if (question.includes(pattern)) {
          score += pattern.split(' ').length;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = response;
      }
    }

    return bestScore > 0 ? bestMatch : null;
  }

  async compareDocuments(docAId, docBId) {
    await this._simulateDelay(500, 1000);

    if (
      (docAId === 'employment-v1' && docBId === 'employment-v2') ||
      (docAId === 'employment-v2' && docBId === 'employment-v1')
    ) {
      const docA = this._getDocument('employment-v1');
      const docB = this._getDocument('employment-v2');
      return {
        ...demoComparison,
        documentATitle:   docA.title,
        documentBTitle:   docB.title,
        documentAVersion: docA.version,
        documentBVersion: docB.version,
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

    // Basic structural comparison for uploaded documents
    const docA = DocumentStore.get(docAId);
    const docB = DocumentStore.get(docBId);
    if (!docA || !docB) {
      throw Object.assign(
        new Error('One or both documents not found. Please re-upload them.'),
        { status: 404 }
      );
    }

    return this._compareGenericDocuments(docA, docB);
  }

  _compareGenericDocuments(docA, docB) {
    const changes = [];
    const sectionsA = new Map((docA.sections || []).map(s => [s.id, s]));
    const sectionsB = new Map((docB.sections || []).map(s => [s.id, s]));

    let id = 1;
    for (const [sid, secA] of sectionsA) {
      if (sectionsB.has(sid)) {
        const secB = sectionsB.get(sid);
        if (secA.text !== secB.text) {
          changes.push({
            id:          `chg-${id++}`,
            clauseTitle: secA.title,
            section:     `Section ${sid}`,
            category:    secA.category,
            changeType:  'modified',
            attentionLevel: 'medium',
            valueBefore: 'See version A text',
            valueAfter:  'See version B text',
            plainEnglishBefore: `Version A contains content for: ${secA.title}`,
            plainEnglishAfter:  `Version B contains modified content for: ${secB.title}`,
            whyItMatters: 'This section was modified between the two versions. Review the changes carefully.',
            textBefore:  secA.text.slice(0, 200),
            textAfter:   secB.text.slice(0, 200),
          });
        }
      } else {
        changes.push({
          id:          `chg-${id++}`,
          clauseTitle: secA.title,
          section:     `Section ${sid}`,
          category:    secA.category,
          changeType:  'removed',
          attentionLevel: 'high',
          valueBefore:  'Present in version A',
          valueAfter:   null,
          plainEnglishBefore: `Version A contains: ${secA.title}`,
          plainEnglishAfter:  'This section does not appear in version B.',
          whyItMatters: 'This entire section was removed. Review carefully.',
          textBefore:   secA.text.slice(0, 200),
          textAfter:    null,
        });
      }
    }

    for (const [sid, secB] of sectionsB) {
      if (!sectionsA.has(sid)) {
        changes.push({
          id:          `chg-${id++}`,
          clauseTitle: secB.title,
          section:     `Section ${sid}`,
          category:    secB.category,
          changeType:  'added',
          attentionLevel: 'medium',
          valueBefore:  null,
          valueAfter:   'Present in version B',
          plainEnglishBefore: 'This section was not in version A.',
          plainEnglishAfter:  `Version B adds: ${secB.title}`,
          whyItMatters: 'A new section was added. Review to understand new obligations.',
          textBefore:   null,
          textAfter:    secB.text.slice(0, 200),
        });
      }
    }

    return {
      comparisonId:     `compare-${Date.now()}`,
      documentA:        docA.documentId,
      documentB:        docB.documentId,
      documentATitle:   docA.title,
      documentBTitle:   docB.title,
      summary:          `Comparison of "${docA.title}" and "${docB.title}". ${changes.length} difference(s) detected.`,
      overallAssessment: 'Review each changed section carefully before signing.',
      changes,
      changeCounts: {
        total:    changes.length,
        high:     changes.filter(c => c.attentionLevel === 'high').length,
        medium:   changes.filter(c => c.attentionLevel === 'medium').length,
        low:      changes.filter(c => c.attentionLevel === 'low').length,
        added:    changes.filter(c => c.changeType === 'added').length,
        modified: changes.filter(c => c.changeType === 'modified').length,
        removed:  changes.filter(c => c.changeType === 'removed').length,
      },
      disclaimer: 'FICTIONAL DEMONSTRATION DOCUMENT — NOT LEGAL ADVICE.',
      mode: 'demo',
    };
  }

  async generateConsultationBrief(documentId, concern) {
    await this._simulateDelay(500, 900);

    const doc = this._getDocument(documentId || 'employment-v2');
    const highAttention = (doc.attentionAreas || []).filter(a => a.level === 'high');
    const medAttention  = (doc.attentionAreas || []).filter(a => a.level === 'medium');

    // For demo docs, use the rich pre-built data
    const isDemoDoc = doc.isDemo;

    const defaultQuestions = isDemoDoc ? [
      'Is the 90-day notice period enforceable and standard for my role and industry?',
      'What are the practical implications of the 5-year post-employment confidentiality obligation?',
      'Does the automatic renewal clause create any obligations I should be aware of?',
      'Can the non-solicitation restriction (18 months) be enforced as written?',
      'If I receive training and am later made redundant, does the recovery clause still apply?',
      'Should I disclose any existing personal projects or IP before signing?',
      'What happens to my rights if the company is acquired during my employment?',
      'Are there any provisions that may conflict with applicable employment law?',
      'What is the process if I disagree with a disciplinary decision?',
      'Can the terms of this agreement be changed unilaterally by the company?',
    ] : [
      'Are there any clauses I should negotiate before signing?',
      'What are the key obligations I need to be aware of?',
      'Are there any unusual or restrictive clauses in this agreement?',
      'What are my rights if the other party breaches the agreement?',
      'Are there any deadlines or time limits I need to track?',
      'Is there anything in this agreement that could restrict my future activities?',
      'What happens if I need to exit this agreement early?',
      'Are there any financial penalties or recovery obligations?',
      'Does this agreement contain any clauses I should clarify before signing?',
      'What documents should I retain copies of after signing?',
    ];

    const keyDates = isDemoDoc
      ? (doc.timeline || [])
          .filter(t => t.type === 'milestone' || t.type === 'deadline')
          .map(t => ({ label: t.label, date: t.date, description: t.description, sourceSection: t.sourceSection }))
      : (doc.timeline || []).slice(0, 5).map(t => ({
          label: t.label, date: t.date, description: t.description, sourceSection: t.sourceSection,
        }));

    return {
      documentId:    doc.documentId,
      documentTitle: doc.title,
      disclaimer:    'This checklist is intended to help prepare for a professional legal consultation. It is not legal advice.',
      concern:       concern || 'Understanding the key obligations and restrictions in this agreement before signing.',
      relevantClauses: [
        ...highAttention.map(a => ({
          title: a.title, section: a.sourceSection, attentionLevel: a.level, summary: a.summary,
        })),
        ...medAttention.map(a => ({
          title: a.title, section: a.sourceSection, attentionLevel: a.level, summary: a.summary,
        })),
      ],
      questionsForLawyer: defaultQuestions,
      documentsToGather: [
        'This agreement (signed copy)',
        'Any offer letter or prior written terms',
        'Related agreements (e.g. training, NDA)',
        'Previous version of this agreement (if applicable)',
        'Any relevant written correspondence',
        'Company handbook or policies referenced in the agreement',
      ],
      keyDates,
      mode: 'demo',
    };
  }

  async extractTimeline(documentId) {
    await this._simulateDelay(150, 400);

    const doc = this._getDocument(documentId || 'employment-v2');

    return {
      documentId:    doc.documentId,
      documentTitle: doc.title,
      timeline:      doc.timeline || [],
      total:         (doc.timeline || []).length,
      mode:          'demo',
    };
  }

  // ── Convenience helpers (not on base AIService) ─────────────────────────────

  listDocuments() {
    return DocumentStore.list();
  }

  getDocument(documentId) {
    return this._getDocument(documentId);
  }

  getSuggestedQuestions() {
    return [
      'What is the notice period?',
      'What happens if I resign?',
      'Is there a training repayment clause?',
      'How long does confidentiality last?',
      'Who owns intellectual property?',
      'What are my major obligations?',
      'What should I clarify before signing?',
      'Does the contract automatically renew?',
      'What are the non-solicitation restrictions?',
      'What is the probation period?',
    ];
  }
}

module.exports = DemoAIService;
