/**
 * Unit tests for DemoAIService.
 * These run against the actual bundled demo JSON data.
 */
// Ensure demo mode
delete process.env.OPENAI_API_KEY;

const DemoAIService = require('../services/ai/DemoAIService');
const DocumentStore  = require('../services/document/DocumentStore');

describe('DemoAIService', () => {
  let service;

  beforeEach(() => {
    // Fresh instance for each test (also re-registers demo docs in DocumentStore)
    service = new DemoAIService();
  });

  // ── listDocuments ─────────────────────────────────────────────────────────
  describe('listDocuments()', () => {
    test('returns at least both demo documents', () => {
      const docs = service.listDocuments();
      expect(docs.length).toBeGreaterThanOrEqual(2);
      const ids = docs.map(d => d.documentId);
      expect(ids).toContain('employment-v1');
      expect(ids).toContain('employment-v2');
    });

    test('each entry has clauseCount and obligationCount', () => {
      service.listDocuments().forEach(doc => {
        expect(typeof doc.clauseCount).toBe('number');
        expect(typeof doc.obligationCount).toBe('number');
      });
    });

    test('attention counts have high/medium/low', () => {
      service.listDocuments().forEach(doc => {
        expect(doc.attentionCounts).toHaveProperty('high');
        expect(doc.attentionCounts).toHaveProperty('medium');
        expect(doc.attentionCounts).toHaveProperty('low');
      });
    });
  });

  // ── getDocument ───────────────────────────────────────────────────────────
  describe('getDocument()', () => {
    test('returns employment-v1', () => {
      const doc = service.getDocument('employment-v1');
      expect(doc.documentId).toBe('employment-v1');
    });

    test('throws for unknown documentId', () => {
      expect(() => service.getDocument('nonexistent-xyz')).toThrow();
    });
  });

  // ── registerDocument ──────────────────────────────────────────────────────
  describe('registerDocument()', () => {
    test('registers a custom document accessible via getDocument', () => {
      const fake = {
        documentId: 'test-upload-999',
        title: 'Test Doc',
        isUploaded: true,
        sections: [],
        clauses: [],
        obligations: [],
        timeline: [],
        attentionAreas: [],
        metadata: {},
        summary: {},
      };
      service.registerDocument(fake);
      expect(() => service.getDocument('test-upload-999')).not.toThrow();
      const doc = service.getDocument('test-upload-999');
      expect(doc.title).toBe('Test Doc');
    });
  });

  // ── analyzeDocument ───────────────────────────────────────────────────────
  describe('analyzeDocument()', () => {
    test('returns analysis for employment-v1', async () => {
      const result = await service.analyzeDocument('employment-v1');
      expect(result.documentId).toBe('employment-v1');
      expect(result.clauseCount).toBeGreaterThan(0);
      expect(result.attentionAreas).toBeDefined();
      expect(result.attentionAreas.length).toBeGreaterThan(0);
    });

    test('returns analysis for employment-v2', async () => {
      const result = await service.analyzeDocument('employment-v2');
      expect(result.documentId).toBe('employment-v2');
      expect(result.attentionCounts.high).toBeGreaterThan(0);
    });

    test('includes isDemo flag for demo docs', async () => {
      const result = await service.analyzeDocument('employment-v2');
      expect(result.isDemo).toBe(true);
      expect(result.isUploaded).toBeFalsy();
    });

    test('includes isUploaded flag for uploaded docs', async () => {
      const fake = {
        documentId: 'upload-test-analyze',
        isUploaded: true,
        title: 'Uploaded Test',
        sections: [], clauses: [], obligations: [], timeline: [],
        attentionAreas: [], metadata: { totalSections: 0 }, summary: {},
      };
      service.registerDocument(fake);
      const result = await service.analyzeDocument('upload-test-analyze');
      expect(result.isUploaded).toBe(true);
      expect(result.isDemo).toBeFalsy();
    });

    test('throws for unknown documentId', async () => {
      await expect(service.analyzeDocument('nonexistent-xyz')).rejects.toThrow();
    });

    test('disclaimer is present and mentions fictional', async () => {
      const result = await service.analyzeDocument('employment-v1');
      expect(result.disclaimer).toBeTruthy();
      expect(result.disclaimer.toLowerCase()).toContain('fictional');
    });

    test('returns mode: demo', async () => {
      const result = await service.analyzeDocument('employment-v1');
      expect(result.mode).toBe('demo');
    });
  });

  // ── extractClauses ────────────────────────────────────────────────────────
  describe('extractClauses()', () => {
    test('returns clauses for employment-v1', async () => {
      const result = await service.extractClauses('employment-v1');
      expect(result.clauses).toBeInstanceOf(Array);
      expect(result.clauses.length).toBeGreaterThan(0);
    });

    test('clauses are grouped by category', async () => {
      const result = await service.extractClauses('employment-v1');
      expect(result.grouped).toBeDefined();
      expect(Object.keys(result.grouped).length).toBeGreaterThan(0);
    });

    test('each clause has required fields', async () => {
      const result = await service.extractClauses('employment-v1');
      result.clauses.forEach(clause => {
        expect(clause.id).toBeDefined();
        expect(clause.category).toBeDefined();
        expect(clause.title).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(clause.attentionLevel);
        expect(clause.sourceSection).toBeDefined();
        expect(clause.originalText).toBeDefined();
      });
    });

    test('Clause categorisation covers financial and termination', async () => {
      const result = await service.extractClauses('employment-v2');
      const categories = Object.keys(result.grouped);
      expect(categories).toContain('financial');
      expect(categories).toContain('termination');
    });

    test('returns mode: demo', async () => {
      const result = await service.extractClauses('employment-v1');
      expect(result.mode).toBe('demo');
    });
  });

  // ── extractObligations ────────────────────────────────────────────────────
  describe('extractObligations()', () => {
    test('returns obligations for employment-v2', async () => {
      const result = await service.extractObligations('employment-v2');
      expect(result.obligations).toBeInstanceOf(Array);
      expect(result.obligations.length).toBeGreaterThan(0);
    });

    test('each obligation has required fields', async () => {
      const result = await service.extractObligations('employment-v2');
      result.obligations.forEach(ob => {
        expect(ob.id).toBeDefined();
        expect(ob.who).toBeDefined();
        expect(ob.action).toBeDefined();
        expect(ob.sourceSection).toBeDefined();
      });
    });

    test('obligations are split by party', async () => {
      const result = await service.extractObligations('employment-v2');
      expect(result.byParty.employee.length).toBeGreaterThan(0);
      expect(result.byParty.company.length).toBeGreaterThan(0);
    });

    test('v2 has more obligations than v1', async () => {
      const v1 = await service.extractObligations('employment-v1');
      const v2 = await service.extractObligations('employment-v2');
      expect(v2.total).toBeGreaterThan(v1.total);
    });
  });

  // ── answerQuestion ────────────────────────────────────────────────────────
  describe('answerQuestion()', () => {
    test('answers notice period question for demo doc', async () => {
      const result = await service.answerQuestion('What is the notice period?', 'employment-v2', []);
      expect(result.answer).toBeTruthy();
      expect(result.answer.toLowerCase()).toContain('notice');
      expect(result.sourceSection).toBeTruthy();
      expect(['high', 'medium', 'low']).toContain(result.confidence);
    });

    test('returns evidence for matched questions', async () => {
      const result = await service.answerQuestion('Is there a training repayment clause?', 'employment-v2', []);
      expect(result.evidence).toBeTruthy();
    });

    test('returns notFound for unrelated questions', async () => {
      const result = await service.answerQuestion(
        'What is the fee for a helicopter pilot license?',
        'employment-v2', []
      );
      expect(result.notFound).toBe(true);
      expect(result.answer).toBeTruthy();
    });

    test('returns outOfScope for legal advice questions', async () => {
      const result = await service.answerQuestion('Should I sue my employer?', 'employment-v2', []);
      expect(result.outOfScope).toBe(true);
    });

    test('out-of-scope answer does not give legal advice', async () => {
      const result = await service.answerQuestion('Should I sue my employer?', 'employment-v2', []);
      expect(result.answer).not.toMatch(/you (will|can|should) (win|sue|take legal)/i);
    });

    test('answers from clauses for uploaded docs', async () => {
      const fake = {
        documentId: 'upload-qa-test',
        isUploaded: true,
        title: 'QA Test Doc',
        sections: [], obligations: [], timeline: [], attentionAreas: [],
        metadata: {}, summary: {},
        clauses: [{
          id: 'c1', category: 'termination', title: 'Notice Period',
          summary: 'Either party must give 45 days notice.',
          plainEnglish: 'You need to give 45 days notice before leaving.',
          originalText: 'Either party shall give 45 days written notice.',
          keywords: ['notice', 'terminate', 'resign'],
          attentionLevel: 'medium', sourceSection: 'Section 5', sourcePage: 3,
          sectionId: '5',
        }],
      };
      service.registerDocument(fake);
      const result = await service.answerQuestion(
        'What is the notice period?', 'upload-qa-test',
        [fake.clauses[0]]
      );
      expect(result.answer).toBeTruthy();
      expect(result.confidence).toBeTruthy();
    });

    test('returns mode: demo', async () => {
      const result = await service.answerQuestion('What is the salary?', 'employment-v1', []);
      expect(result.mode).toBe('demo');
    });
  });

  // ── compareDocuments ──────────────────────────────────────────────────────
  describe('compareDocuments()', () => {
    test('compares v1 and v2 successfully', async () => {
      const result = await service.compareDocuments('employment-v1', 'employment-v2');
      expect(result.changes).toBeInstanceOf(Array);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    test('notice period change is 30 → 90 days', async () => {
      const result = await service.compareDocuments('employment-v1', 'employment-v2');
      const noticeChange = result.changes.find(c => c.clauseTitle.toLowerCase().includes('notice'));
      expect(noticeChange).toBeDefined();
      expect(noticeChange.valueBefore).toContain('30');
      expect(noticeChange.valueAfter).toContain('90');
    });

    test('confidentiality change is 2 → 5 years', async () => {
      const result = await service.compareDocuments('employment-v1', 'employment-v2');
      const confChange = result.changes.find(c =>
        c.clauseTitle.toLowerCase().includes('confidentiality')
      );
      expect(confChange).toBeDefined();
      expect(confChange.valueBefore).toContain('2');
      expect(confChange.valueAfter).toContain('5');
    });

    test('each change has attentionLevel and changeType', async () => {
      const result = await service.compareDocuments('employment-v1', 'employment-v2');
      result.changes.forEach(change => {
        expect(['high', 'medium', 'low']).toContain(change.attentionLevel);
        expect(['added', 'modified', 'removed']).toContain(change.changeType);
      });
    });

    test('changeCounts.total matches changes array length', async () => {
      const result = await service.compareDocuments('employment-v1', 'employment-v2');
      expect(result.changeCounts.total).toBe(result.changes.length);
    });

    test('throws for documents not in store', async () => {
      await expect(
        service.compareDocuments('unknown-a', 'unknown-b')
      ).rejects.toThrow();
    });

    test('returns mode: demo', async () => {
      const result = await service.compareDocuments('employment-v1', 'employment-v2');
      expect(result.mode).toBe('demo');
    });
  });

  // ── Source mapping ────────────────────────────────────────────────────────
  describe('source mapping', () => {
    test('clauses reference section IDs that exist in the document', async () => {
      const { clauses } = await service.extractClauses('employment-v1');
      const doc = service.getDocument('employment-v1');
      const sectionIds = new Set(doc.sections.map(s => s.id));
      clauses.forEach(clause => {
        expect(sectionIds.has(clause.sectionId)).toBe(true);
        expect(clause.sourcePage).toBeGreaterThan(0);
      });
    });

    test('attention areas reference valid clause IDs', () => {
      const doc = service.getDocument('employment-v2');
      const clauseIds = new Set(doc.clauses.map(c => c.id));
      doc.attentionAreas.forEach(area => {
        expect(clauseIds.has(area.clauseId)).toBe(true);
      });
    });
  });

  // ── generateConsultationBrief ─────────────────────────────────────────────
  describe('generateConsultationBrief()', () => {
    test('generates a brief for employment-v2', async () => {
      const result = await service.generateConsultationBrief('employment-v2');
      expect(result.questionsForLawyer).toBeInstanceOf(Array);
      expect(result.questionsForLawyer.length).toBeGreaterThan(0);
      expect(result.disclaimer).toBeTruthy();
      expect(result.disclaimer.toLowerCase()).toContain('not legal advice');
    });

    test('accepts a concern string', async () => {
      const result = await service.generateConsultationBrief(
        'employment-v2',
        'I want to understand the notice period'
      );
      expect(result.concern).toContain('notice period');
    });

    test('includes relevant clauses from attention areas', async () => {
      const result = await service.generateConsultationBrief('employment-v2');
      expect(result.relevantClauses.length).toBeGreaterThan(0);
    });

    test('includes documents to gather', async () => {
      const result = await service.generateConsultationBrief('employment-v2');
      expect(result.documentsToGather).toBeInstanceOf(Array);
      expect(result.documentsToGather.length).toBeGreaterThan(0);
    });
  });

  // ── extractTimeline ───────────────────────────────────────────────────────
  describe('extractTimeline()', () => {
    test('returns timeline for employment-v2', async () => {
      const result = await service.extractTimeline('employment-v2');
      expect(result.timeline).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
    });
  });

  // ── Demo mode marker ──────────────────────────────────────────────────────
  describe('demo mode markers', () => {
    test('analyzeDocument returns mode: demo', async () => {
      expect((await service.analyzeDocument('employment-v1')).mode).toBe('demo');
    });
    test('extractClauses returns mode: demo', async () => {
      expect((await service.extractClauses('employment-v1')).mode).toBe('demo');
    });
    test('compareDocuments returns mode: demo', async () => {
      expect((await service.compareDocuments('employment-v1', 'employment-v2')).mode).toBe('demo');
    });
    test('answerQuestion returns mode: demo', async () => {
      expect((await service.answerQuestion('What is the salary?', 'employment-v1', [])).mode).toBe('demo');
    });
  });
});
