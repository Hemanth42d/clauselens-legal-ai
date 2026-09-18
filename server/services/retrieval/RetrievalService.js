/**
 * RetrievalService — Keyword-based clause retrieval for Q&A (simplified RAG).
 *
 * Implements a lightweight retrieval pipeline:
 *   1. Tokenise the question
 *   2. Score each clause by keyword overlap (TF-style scoring)
 *   3. Apply category boosts for known question patterns
 *   4. Return the top-k most relevant clauses
 *
 * This avoids the need for a vector database while still demonstrating the
 * RAG architecture principle: retrieve → ground → answer.
 */

const STOP_WORDS = new Set([
  'a','an','the','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should',
  'may','might','shall','can','in','on','at','to','for','of','and','or',
  'but','if','this','that','with','from','by','not','it','its',
  'what','how','when','where','who','which',
]);

// Category hints: question keywords → category boosts
const CATEGORY_HINTS = {
  notice:         ['termination'],
  resign:         ['termination', 'financial'],
  resignation:    ['termination'],
  terminate:      ['termination'],
  training:       ['financial'],
  repay:          ['financial'],
  repayment:      ['financial'],
  confidential:   ['restrictions'],
  secret:         ['restrictions'],
  nda:            ['restrictions'],
  ip:             ['ownership'],
  intellectual:   ['ownership'],
  copyright:      ['ownership'],
  invention:      ['ownership'],
  solicit:        ['restrictions'],
  compete:        ['restrictions'],
  arbitration:    ['disputes'],
  mediation:      ['disputes'],
  dispute:        ['disputes'],
  probation:      ['time'],
  probationary:   ['time'],
  renewal:        ['time'],
  salary:         ['financial'],
  pay:            ['financial'],
  compensation:   ['financial'],
  bonus:          ['financial'],
  leave:          ['time'],
  holiday:        ['time'],
};

class RetrievalService {
  /**
   * Tokenise a string into lowercase, de-stopped terms.
   */
  tokenise(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 && !STOP_WORDS.has(t));
  }

  /**
   * Retrieve the most relevant clauses for a given question.
   * @param {string} question
   * @param {object[]} clauses - Array of clause objects from the document
   * @param {number} topK - Maximum number of clauses to return
   * @returns {object[]} Ranked clauses with score
   */
  retrieve(question, clauses, topK = 5) {
    if (!clauses || clauses.length === 0) return [];

    const questionTokens = this.tokenise(question);
    const questionSet = new Set(questionTokens);

    // Determine category boosts from question
    const boostedCategories = new Set();
    for (const token of questionTokens) {
      if (CATEGORY_HINTS[token]) {
        CATEGORY_HINTS[token].forEach(c => boostedCategories.add(c));
      }
    }

    const scored = clauses.map(clause => {
      let score = 0;

      // 1. Keyword field overlap (highest signal)
      const keywordTokens = this.tokenise((clause.keywords || []).join(' '));
      for (const kw of keywordTokens) {
        if (questionSet.has(kw)) score += 4;
      }

      // 2. Title overlap
      const titleTokens = this.tokenise(clause.title || '');
      for (const t of titleTokens) {
        if (questionSet.has(t)) score += 3;
      }

      // 3. Summary / plainEnglish overlap
      const summaryTokens = this.tokenise(
        (clause.summary || '') + ' ' + (clause.plainEnglish || '')
      );
      const summarySet = new Set(summaryTokens);
      for (const qToken of questionTokens) {
        if (summarySet.has(qToken)) score += 2;
      }

      // 4. Original text overlap
      const textTokens = this.tokenise(clause.originalText || '');
      const textSet = new Set(textTokens);
      for (const qToken of questionTokens) {
        if (textSet.has(qToken)) score += 1;
      }

      // 5. Category boost
      if (boostedCategories.has(clause.category)) score += 5;

      // 6. High attention boost (surface important clauses even with partial match)
      if (clause.attentionLevel === 'high' && score > 0) score += 2;

      return { ...clause, _score: score };
    });

    return scored
      .filter(c => c._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, topK)
      .map(({ _score, ...clause }) => clause); // strip internal score
  }

  /**
   * Find a section by its ID.
   */
  findSection(sections, sectionId) {
    return sections.find(s => s.id === sectionId || s.sectionNumber === sectionId) || null;
  }

  /**
   * Find the clause that matches a given attention area.
   */
  findClauseForAttentionArea(clauses, attentionArea) {
    return clauses.find(c => c.id === attentionArea.clauseId) || null;
  }
}

module.exports = new RetrievalService();
