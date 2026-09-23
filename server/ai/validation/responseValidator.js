/**
 * AI Response Validator for ClauseLens.
 *
 * Validates AI-generated JSON responses against expected schemas.
 * Ensures data integrity before passing results to the frontend.
 */

const VALID_ATTENTION_LEVELS = new Set(['high', 'medium', 'low']);
const VALID_CATEGORIES = new Set(['financial', 'termination', 'restrictions', 'ownership', 'disputes', 'time', 'general']);
const VALID_CHANGE_TYPES = new Set(['added', 'modified', 'removed']);
const VALID_CONFIDENCE = new Set(['high', 'medium', 'low']);
const VALID_TIMELINE_TYPES = new Set(['milestone', 'obligation', 'financial', 'restriction', 'deadline']);

/**
 * Normalizes attention level to lowercase.
 * @param {string} level
 * @returns {string}
 */
function normalizeLevel(level) {
  if (!level) return 'low';
  const l = String(level).toLowerCase().trim();
  return VALID_ATTENTION_LEVELS.has(l) ? l : 'low';
}

/**
 * Validates and normalizes an analysis response.
 * @param {Object} raw - Raw AI response
 * @returns {Object} Validated response
 * @throws {Error} If response is fundamentally invalid
 */
function validateAnalysisResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI returned an empty or non-object response for analysis.');
  }

  // Validate summary
  const summary = raw.summary || {};
  const validatedSummary = {
    documentType: summary.documentType || 'Unknown',
    parties: Array.isArray(summary.parties) ? summary.parties : [],
    effectiveDate: summary.effectiveDate || null,
    duration: summary.duration || null,
    keyTopics: Array.isArray(summary.keyTopics) ? summary.keyTopics : [],
  };

  // Validate attention areas
  const attentionAreas = Array.isArray(raw.attentionAreas) ? raw.attentionAreas : [];
  const validatedAreas = attentionAreas
    .filter(a => a && typeof a === 'object')
    .map((a, i) => {
      const level = normalizeLevel(a.level);
      // Reject areas without summaries (no grounding)
      if (!a.summary && !a.title) return null;
      return {
        id: a.id || `att-${i + 1}`,
        level,
        title: a.title || 'Untitled',
        summary: a.summary || '',
        sourceSection: a.sourceSection || null,
        sourcePage: typeof a.sourcePage === 'number' ? a.sourcePage : null,
        clauseId: a.clauseId || null,
      };
    })
    .filter(Boolean);

  // Validate counts — use arrays if they exist, otherwise use AI's numbers
  const clauseCount = typeof raw.clauseCount === 'number' ? raw.clauseCount : 0;
  const sectionCount = typeof raw.sectionCount === 'number' ? raw.sectionCount : 0;
  const obligationCount = typeof raw.obligationCount === 'number' ? raw.obligationCount : 0;

  // Compute attention counts from validated areas
  const attentionCounts = {
    high: validatedAreas.filter(a => a.level === 'high').length,
    medium: validatedAreas.filter(a => a.level === 'medium').length,
    low: validatedAreas.filter(a => a.level === 'low').length,
  };

  return {
    summary: validatedSummary,
    attentionAreas: validatedAreas,
    attentionCounts,
    clauseCount,
    sectionCount,
    obligationCount,
  };
}

/**
 * Validates and normalizes a clause extraction response.
 * @param {Object} raw - Raw AI response
 * @returns {Object} Validated response with clauses and grouped
 */
function validateClauseResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI returned an empty or non-object response for clauses.');
  }

  const clauses = Array.isArray(raw.clauses) ? raw.clauses : [];
  const validatedClauses = clauses
    .filter(c => c && typeof c === 'object')
    .map((c, i) => {
      const category = VALID_CATEGORIES.has(c.category) ? c.category : 'general';
      return {
        id: c.id || `clause-${i + 1}`,
        sectionId: c.sectionId || null,
        category,
        title: c.title || 'Untitled Clause',
        attentionLevel: normalizeLevel(c.attentionLevel),
        summary: c.summary || '',
        plainEnglish: c.plainEnglish || '',
        whyItMatters: c.whyItMatters || '',
        whatToVerify: Array.isArray(c.whatToVerify) ? c.whatToVerify : [],
        sourceSection: c.sourceSection || null,
        sourcePage: typeof c.sourcePage === 'number' ? c.sourcePage : null,
        originalText: c.originalText || '',
        // Preserve keywords for retrieval service
        keywords: c.title ? c.title.toLowerCase().split(/\s+/) : [],
      };
    });

  // Build grouped map
  const grouped = validatedClauses.reduce((acc, c) => {
    (acc[c.category] = acc[c.category] || []).push(c);
    return acc;
  }, {});

  return {
    clauses: validatedClauses,
    grouped,
    total: validatedClauses.length,
  };
}

/**
 * Validates and normalizes an obligation extraction response.
 * @param {Object} raw - Raw AI response
 * @returns {Object} Validated response
 */
function validateObligationResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI returned an empty or non-object response for obligations.');
  }

  const obligations = Array.isArray(raw.obligations) ? raw.obligations : [];
  const validatedObligations = obligations
    .filter(o => o && typeof o === 'object' && o.action)
    .map((o, i) => ({
      id: o.id || `ob-${i + 1}`,
      who: o.who || 'Not specified',
      action: o.action || '',
      trigger: o.trigger || 'As specified in the agreement',
      deadline: o.deadline || 'As specified in the agreement',
      consequence: o.consequence || 'As specified in the agreement',
      sourceSection: o.sourceSection || null,
      sourcePage: typeof o.sourcePage === 'number' ? o.sourcePage : null,
    }));

  return {
    obligations: validatedObligations,
    total: validatedObligations.length,
    byParty: {
      employee: validatedObligations.filter(o => o.who.toLowerCase().includes('employee')),
      company: validatedObligations.filter(o =>
        o.who.toLowerCase().includes('company') || o.who.toLowerCase().includes('employer')
      ),
    },
  };
}

/**
 * Validates and normalizes a Q&A response.
 * @param {Object} raw - Raw AI response
 * @param {string} question - Original question
 * @returns {Object} Validated response
 */
function validateQAResponse(raw, question) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI returned an empty or non-object response for Q&A.');
  }

  return {
    question,
    answer: raw.answer || 'Unable to process this question. Please try again.',
    evidence: raw.evidence || null,
    sourceSection: raw.sourceSection || null,
    sourcePage: typeof raw.sourcePage === 'number' ? raw.sourcePage : null,
    confidence: VALID_CONFIDENCE.has(raw.confidence) ? raw.confidence : 'low',
    outOfScope: !!raw.outOfScope,
    notFound: !!raw.notFound,
  };
}

/**
 * Validates and normalizes a comparison response.
 * @param {Object} raw - Raw AI response
 * @returns {Object} Validated response
 */
function validateComparisonResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI returned an empty or non-object response for comparison.');
  }

  const changes = Array.isArray(raw.changes) ? raw.changes : [];
  const validatedChanges = changes
    .filter(c => c && typeof c === 'object')
    .map((c, i) => ({
      id: c.id || `chg-${i + 1}`,
      clauseTitle: c.clauseTitle || 'Untitled',
      section: c.section || '',
      category: c.category || 'general',
      changeType: VALID_CHANGE_TYPES.has(c.changeType) ? c.changeType : 'modified',
      attentionLevel: normalizeLevel(c.attentionLevel),
      valueBefore: c.valueBefore || null,
      valueAfter: c.valueAfter || null,
      plainEnglishBefore: c.plainEnglishBefore || '',
      plainEnglishAfter: c.plainEnglishAfter || '',
      whyItMatters: c.whyItMatters || '',
      textBefore: c.textBefore || null,
      textAfter: c.textAfter || null,
    }));

  // Compute counts from actual data
  const changeCounts = {
    total: validatedChanges.length,
    high: validatedChanges.filter(c => c.attentionLevel === 'high').length,
    medium: validatedChanges.filter(c => c.attentionLevel === 'medium').length,
    low: validatedChanges.filter(c => c.attentionLevel === 'low').length,
    added: validatedChanges.filter(c => c.changeType === 'added').length,
    modified: validatedChanges.filter(c => c.changeType === 'modified').length,
    removed: validatedChanges.filter(c => c.changeType === 'removed').length,
  };

  return {
    summary: raw.summary || '',
    overallAssessment: raw.overallAssessment || '',
    changes: validatedChanges,
    changeCounts,
  };
}

/**
 * Validates and normalizes a consultation brief response.
 * @param {Object} raw - Raw AI response
 * @returns {Object} Validated response
 */
function validateConsultationResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI returned an empty or non-object response for consultation.');
  }

  return {
    concern: raw.concern || '',
    relevantClauses: Array.isArray(raw.relevantClauses)
      ? raw.relevantClauses.filter(c => c && c.title).map(c => ({
          title: c.title,
          section: c.section || '',
          attentionLevel: normalizeLevel(c.attentionLevel),
          summary: c.summary || '',
        }))
      : [],
    questionsForLawyer: Array.isArray(raw.questionsForLawyer) ? raw.questionsForLawyer : [],
    documentsToGather: Array.isArray(raw.documentsToGather) ? raw.documentsToGather : [],
    keyDates: Array.isArray(raw.keyDates)
      ? raw.keyDates.filter(d => d && d.label).map(d => ({
          label: d.label,
          date: d.date || 'Not specified',
          description: d.description || '',
          sourceSection: d.sourceSection || '',
        }))
      : [],
    disclaimer: raw.disclaimer || 'This checklist is intended to help prepare for a professional legal consultation. It is not legal advice.',
  };
}

/**
 * Validates and normalizes a timeline response.
 * @param {Object} raw - Raw AI response
 * @returns {Object} Validated response
 */
function validateTimelineResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI returned an empty or non-object response for timeline.');
  }

  const timeline = Array.isArray(raw.timeline) ? raw.timeline : [];
  const validatedTimeline = timeline
    .filter(t => t && typeof t === 'object' && t.label)
    .map((t, i) => ({
      id: t.id || `tl-${i + 1}`,
      date: t.date || 'ongoing',
      label: t.label,
      description: t.description || '',
      type: VALID_TIMELINE_TYPES.has(t.type) ? t.type : 'milestone',
      sourceSection: t.sourceSection || '',
    }));

  return {
    timeline: validatedTimeline,
    total: validatedTimeline.length,
  };
}


module.exports = {
  validateAnalysisResponse,
  validateClauseResponse,
  validateObligationResponse,
  validateQAResponse,
  validateComparisonResponse,
  validateConsultationResponse,
  validateTimelineResponse,
  normalizeLevel,
};
