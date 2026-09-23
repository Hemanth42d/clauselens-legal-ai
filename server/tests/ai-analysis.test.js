const { validateAnalysisResponse, validateQAResponse, validateComparisonResponse } = require('../ai/validation/responseValidator');
const { parseWithRepair } = require('../ai/validation/jsonRepair');

describe('AI Response Validator', () => {
  describe('validateAnalysisResponse', () => {
    it('should validate a correct analysis response and compute counts', () => {
      const raw = {
        summary: { documentType: 'Test', parties: ['A', 'B'], keyTopics: ['Topic 1'] },
        attentionAreas: [
          { level: 'high', title: 'High Risk', summary: 'Important stuff', sourceSection: '1' },
          { level: 'low', title: 'Low Risk', summary: 'Minor stuff', sourceSection: '2' },
        ],
        clauseCount: 5,
        sectionCount: 3,
        obligationCount: 2,
      };

      const result = validateAnalysisResponse(raw);
      expect(result.summary.documentType).toBe('Test');
      expect(result.attentionCounts.high).toBe(1);
      expect(result.attentionCounts.medium).toBe(0);
      expect(result.attentionCounts.low).toBe(1);
      expect(result.clauseCount).toBe(5);
    });

    it('should reject areas without a summary or title (hallucination prevention)', () => {
      const raw = {
        summary: {},
        attentionAreas: [
          { level: 'high', title: 'Valid', summary: 'Valid summary' },
          { level: 'high' } // Invalid: no title or summary
        ]
      };
      const result = validateAnalysisResponse(raw);
      expect(result.attentionAreas).toHaveLength(1);
      expect(result.attentionAreas[0].title).toBe('Valid');
    });

    it('should normalize invalid attention levels to low', () => {
      const raw = {
        attentionAreas: [{ level: 'SUPER HIGH', title: 'Invalid', summary: 'Invalid' }]
      };
      const result = validateAnalysisResponse(raw);
      expect(result.attentionAreas[0].level).toBe('low');
    });
  });

  describe('validateQAResponse', () => {
    it('should validate a correct QA response', () => {
      const raw = { answer: 'Yes', evidence: 'Quote', sourceSection: 'Section 1', confidence: 'high' };
      const result = validateQAResponse(raw, 'Is it yes?');
      expect(result.answer).toBe('Yes');
      expect(result.question).toBe('Is it yes?');
      expect(result.outOfScope).toBe(false);
      expect(result.notFound).toBe(false);
    });

    it('should handle outOfScope and notFound booleans', () => {
      const raw = { answer: 'Not found', outOfScope: true, notFound: true };
      const result = validateQAResponse(raw, 'Unknown?');
      expect(result.outOfScope).toBe(true);
      expect(result.notFound).toBe(true);
    });
  });
});

describe('JSON Repair', () => {
  it('should successfully parse clean JSON', async () => {
    const json = '{"key": "value"}';
    const result = await parseWithRepair(json);
    expect(result.key).toBe('value');
  });

  it('should strip markdown fences and parse', async () => {
    const json = '```json\n{"key": "value"}\n```';
    const result = await parseWithRepair(json);
    expect(result.key).toBe('value');
  });

  it('should fix trailing commas', async () => {
    const json = '{"key": "value",}';
    const result = await parseWithRepair(json);
    expect(result.key).toBe('value');
  });

  it('should call repairFn if local repair fails', async () => {
    const json = '{ invalid json format }';
    const repairFn = jest.fn().mockResolvedValue('{"repaired": true}');
    
    const result = await parseWithRepair(json, repairFn);
    expect(repairFn).toHaveBeenCalledWith(json);
    expect(result.repaired).toBe(true);
  });

  it('should throw an error if all repairs fail', async () => {
    const json = '{ invalid }';
    const repairFn = jest.fn().mockResolvedValue('{ still invalid }');
    
    await expect(parseWithRepair(json, repairFn)).rejects.toThrow(/invalid JSON/);
  });
});
