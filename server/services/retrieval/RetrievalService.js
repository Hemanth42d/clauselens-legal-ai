/**
 * Keyword-based clause retrieval — simplified RAG without a vector database.
 * Pipeline: tokenise question → score clauses → boost by category → return top-k.
 */

const STOP_WORDS = new Set([
  'a','an','the','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should',
  'may','might','shall','can','in','on','at','to','for','of','and','or',
  'but','if','this','that','with','from','by','not','it','its',
  'what','how','when','where','who','which',
]);

const CATEGORY_HINTS = {
  notice:       ['termination'], resign:       ['termination', 'financial'],
  resignation:  ['termination'], terminate:    ['termination'],
  training:     ['financial'],   repay:        ['financial'],
  repayment:    ['financial'],   confidential: ['restrictions'],
  secret:       ['restrictions'],nda:          ['restrictions'],
  ip:           ['ownership'],   intellectual: ['ownership'],
  copyright:    ['ownership'],   invention:    ['ownership'],
  solicit:      ['restrictions'],compete:      ['restrictions'],
  arbitration:  ['disputes'],    mediation:    ['disputes'],
  dispute:      ['disputes'],    probation:    ['time'],
  probationary: ['time'],        renewal:      ['time'],
  salary:       ['financial'],   pay:          ['financial'],
  compensation: ['financial'],   bonus:        ['financial'],
  leave:        ['time'],        holiday:      ['time'],
};

class RetrievalService {
  tokenise(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(t => t.length > 1 && !STOP_WORDS.has(t));
  }

  retrieve(question, clauses, topK = 5) {
    if (!clauses || !clauses.length) return [];

    const qTokens   = this.tokenise(question);
    const qSet      = new Set(qTokens);
    const boosted   = new Set(qTokens.flatMap(t => CATEGORY_HINTS[t] || []));

    const scored = clauses.map(clause => {
      let score = 0;

      const kwTokens = this.tokenise((clause.keywords || []).join(' '));
      for (const kw of kwTokens) if (qSet.has(kw)) score += 4;

      for (const t of this.tokenise(clause.title || '')) if (qSet.has(t)) score += 3;

      const summarySet = new Set(this.tokenise((clause.summary || '') + ' ' + (clause.plainEnglish || '')));
      for (const t of qTokens) if (summarySet.has(t)) score += 2;

      const textSet = new Set(this.tokenise(clause.originalText || ''));
      for (const t of qTokens) if (textSet.has(t)) score += 1;

      if (boosted.has(clause.category)) score += 5;
      if (clause.attentionLevel === 'high' && score > 0) score += 2;

      return { ...clause, _score: score };
    });

    return scored
      .filter(c => c._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, topK)
      .map(({ _score, ...clause }) => clause);
  }

  findSection(sections, sectionId) {
    return sections.find(s => s.id === sectionId || s.sectionNumber === sectionId) || null;
  }
}

module.exports = new RetrievalService();
