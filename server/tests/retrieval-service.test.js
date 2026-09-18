const retrieval = require('../services/retrieval/RetrievalService');

const sampleClauses = [
  {
    id: 'clause-notice',
    category: 'termination',
    title: 'Notice Period',
    summary: 'Either party must provide 90 days notice to terminate employment.',
    plainEnglish: 'You must give 90 days notice if you want to leave.',
    originalText: 'Either party wishing to terminate shall provide ninety (90) days written notice.',
    keywords: ['notice period', 'notice', 'resign', 'termination', 'quit'],
    attentionLevel: 'high',
    sourceSection: 'Section 8.1',
    sourcePage: 6,
    sectionId: '8.1',
  },
  {
    id: 'clause-confidentiality',
    category: 'restrictions',
    title: 'Confidentiality Obligation',
    summary: 'Confidentiality obligations continue for 5 years after employment ends.',
    plainEnglish: 'You must keep company secrets for 5 years after leaving.',
    originalText: 'These obligations shall remain in force for a period of five years following termination.',
    keywords: ['confidentiality', 'secret', 'nda', 'non-disclosure', 'disclose'],
    attentionLevel: 'high',
    sourceSection: 'Section 13.4',
    sourcePage: 10,
    sectionId: '13',
  },
  {
    id: 'clause-salary',
    category: 'financial',
    title: 'Annual Salary',
    summary: 'The employee receives annual CTC of INR 24 lakhs.',
    plainEnglish: 'You will be paid 24 Lakhs per year.',
    originalText: 'The Employee shall receive a gross annual CTC of Rs 24,00,000.',
    keywords: ['salary', 'compensation', 'ctc', 'pay', 'remuneration', 'income'],
    attentionLevel: 'low',
    sourceSection: 'Section 5.1',
    sourcePage: 3,
    sectionId: '5',
  },
  {
    id: 'clause-ip',
    category: 'ownership',
    title: 'Intellectual Property Ownership',
    summary: 'All work created during employment belongs to the company.',
    plainEnglish: 'Anything you build at work belongs to the company.',
    originalText: 'All inventions, software and works created in the course of employment shall belong to the Company.',
    keywords: ['intellectual property', 'ip', 'copyright', 'invention', 'software', 'ownership'],
    attentionLevel: 'high',
    sourceSection: 'Section 14',
    sourcePage: 11,
    sectionId: '14',
  },
];

describe('RetrievalService', () => {

  describe('tokenise', () => {
    test('lowercases and removes punctuation', () => {
      const tokens = retrieval.tokenise('Notice Period: 90 Days!');
      expect(tokens).toContain('notice');
      expect(tokens).toContain('period');
      expect(tokens).toContain('90');
      expect(tokens).toContain('days');
    });

    test('removes stop words', () => {
      const tokens = retrieval.tokenise('What is the notice period');
      expect(tokens).not.toContain('what');
      expect(tokens).not.toContain('is');
      expect(tokens).not.toContain('the');
      expect(tokens).toContain('notice');
      expect(tokens).toContain('period');
    });

    test('handles empty string', () => {
      expect(retrieval.tokenise('')).toEqual([]);
    });
  });

  describe('retrieve', () => {
    test('returns empty array for no clauses', () => {
      const result = retrieval.retrieve('notice period', [], 5);
      expect(result).toEqual([]);
    });

    test('retrieves notice clause for notice question', () => {
      const results = retrieval.retrieve('What is the notice period?', sampleClauses, 3);
      expect(results.length).toBeGreaterThan(0);
      const ids = results.map(r => r.id);
      expect(ids).toContain('clause-notice');
    });

    test('retrieves salary clause for pay question', () => {
      const results = retrieval.retrieve('What is my salary and compensation?', sampleClauses, 3);
      expect(results.length).toBeGreaterThan(0);
      const ids = results.map(r => r.id);
      expect(ids).toContain('clause-salary');
    });

    test('retrieves confidentiality clause for NDA question', () => {
      const results = retrieval.retrieve('How long does confidentiality last?', sampleClauses, 3);
      expect(results.length).toBeGreaterThan(0);
      const ids = results.map(r => r.id);
      expect(ids).toContain('clause-confidentiality');
    });

    test('retrieves IP clause for intellectual property question', () => {
      const results = retrieval.retrieve('Who owns intellectual property?', sampleClauses, 3);
      expect(results.length).toBeGreaterThan(0);
      const ids = results.map(r => r.id);
      expect(ids).toContain('clause-ip');
    });

    test('respects topK limit', () => {
      const results = retrieval.retrieve('notice period resign termination', sampleClauses, 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    test('does not return clauses with zero score', () => {
      // "helicopter license" should not match any legal employment clauses
      const results = retrieval.retrieve('helicopter flying license aviation', sampleClauses, 5);
      expect(results.length).toBe(0);
    });

    test('returned clauses do not expose internal _score field', () => {
      const results = retrieval.retrieve('notice period', sampleClauses, 5);
      results.forEach(r => {
        expect(r._score).toBeUndefined();
      });
    });

    test('notice clause ranks first for resign question', () => {
      const results = retrieval.retrieve('What happens when I resign?', sampleClauses, 5);
      expect(results[0].id).toBe('clause-notice');
    });
  });

  describe('findSection', () => {
    const sections = [
      { id: '8.1', sectionNumber: '8.1', title: 'Notice Period', page: 6 },
      { id: '13',  sectionNumber: '13',  title: 'Confidentiality', page: 10 },
    ];

    test('finds section by id', () => {
      const result = retrieval.findSection(sections, '8.1');
      expect(result).toBeDefined();
      expect(result.title).toBe('Notice Period');
    });

    test('returns null for missing section', () => {
      const result = retrieval.findSection(sections, 'nonexistent');
      expect(result).toBeNull();
    });
  });
});
