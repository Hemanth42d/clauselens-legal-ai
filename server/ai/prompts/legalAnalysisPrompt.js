/**
 * Centralized AI prompt system for ClauseLens Legal Document Analysis Engine.
 *
 * All AI requests flow through this module to ensure:
 * - Consistent grounding rules (no hallucination)
 * - Document-only analysis (no legal advice)
 * - Structured JSON output matching frontend schemas
 * - Source citation with section/page references
 */

// ── Master System Prompt ────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the ClauseLens Legal Document Analysis Engine.

CORE RULES — follow these without exception:

1. Analyze ONLY the supplied document. Do not invent facts, clauses, obligations, dates, amounts, parties, restrictions, or conclusions.

2. You are providing informational document analysis, not legal advice. Do not determine whether a clause is legally enforceable, legal/illegal, valid/invalid, or whether someone will win a dispute.

3. Every important finding must be grounded in the supplied document and include its source section and page whenever available.

4. Preserve exact dates, amounts, percentages, durations, notice periods, and thresholds as they appear in the document.

5. If information is not present in the document, say that it is not specified instead of guessing.

6. Attention levels are document-review priorities, NOT legal risk scores:
   - HIGH: Use when a provision has potentially significant practical consequences such as substantial financial obligations, long notice periods, broad restrictions, major termination consequences, broad IP rights, significant deadlines, or similarly important provisions.
   - MEDIUM: Use for provisions that may materially affect responsibilities, rights, costs, deadlines, or obligations but require less immediate attention.
   - LOW: Use for provisions that are useful to understand but generally require less immediate review.

7. For every attention item, explain:
   a) What the document says.
   b) Why the user may want to review it.
   c) Where it appears in the document.

8. Never assign an attention level without a document-grounded reason.

9. Use plain language suitable for a non-lawyer.

10. Do not provide information that is not supported by the supplied document unless explicitly requested as general legal information, and clearly distinguish it from document content.

11. Use language like: "The document states...", "The wording appears to...", "According to Section X..."

12. For legal strategy questions respond: "I can help you understand relevant provisions, but cannot advise on legal action."

13. ALWAYS return valid JSON matching the schema in each prompt. No markdown fences, no commentary — pure JSON only.`;


// ── Document Context Builder ────────────────────────────────────────────────
/**
 * Builds a text representation of a document for inclusion in AI prompts.
 * Preserves section numbers, titles, and page references.
 *
 * @param {Object} document - The document object with sections and metadata
 * @param {number} [maxChars=80000] - Maximum character length for the context
 * @returns {string} Formatted document context
 */
function buildDocumentContext(document, maxChars = 80000) {
  const sections = document.sections || [];
  const raw = sections
    .map(s => `[Section ${s.sectionNumber}] ${s.title} (Page ${s.page}):\n${s.text}`)
    .join('\n\n---\n\n');

  const truncated = raw.length > maxChars
    ? raw.slice(0, maxChars) + '\n\n[Document truncated for length]'
    : raw;

  const p = document.metadata?.parties || {};
  return [
    `Document: "${document.title}"`,
    p.employer ? `Employer: ${p.employer}` : '',
    p.employee ? `Employee: ${p.employee}` : '',
    document.metadata?.effectiveDate ? `Effective Date: ${document.metadata.effectiveDate}` : '',
    document.metadata?.governingLaw ? `Governing Law: ${document.metadata.governingLaw}` : '',
    document.metadata?.documentType ? `Document Type: ${document.metadata.documentType}` : '',
    '',
    '--- DOCUMENT TEXT ---',
    truncated,
  ].filter(Boolean).join('\n');
}


// ── Task-Specific Prompt Builders ───────────────────────────────────────────

function buildAnalysisPrompt(document) {
  const ctx = buildDocumentContext(document);
  return `Analyze the following legal document thoroughly. Identify all important provisions, attention areas, and key statistics.

Return ONLY a JSON object matching this exact schema:
{
  "summary": {
    "documentType": "string — type of document (e.g. Employment Agreement, NDA, Lease)",
    "parties": ["string — list of parties involved"],
    "effectiveDate": "string or null — effective/commencement date if stated",
    "duration": "string or null — contract duration if stated",
    "keyTopics": ["string — list of major topic areas covered"]
  },
  "attentionAreas": [
    {
      "id": "string — unique identifier",
      "level": "high|medium|low",
      "title": "string — short descriptive title",
      "summary": "string — what the document says and why it matters",
      "sourceSection": "string — e.g. 'Section 5'",
      "sourcePage": "number or null — page number if available",
      "clauseId": "string or null — related clause ID if applicable"
    }
  ],
  "clauseCount": "number — estimated count of important clauses",
  "sectionCount": "number — total document sections",
  "obligationCount": "number — estimated count of obligations"
}

RULES:
- Do NOT invent page numbers. If page information is unavailable, return null.
- Attention levels must be document-grounded. Explain WHY in the summary field.
- Include attention items for: financial obligations, notice periods, restrictions, termination clauses, IP provisions, deadlines, and any other significant provisions.

${ctx}`;
}


function buildClausePrompt(document) {
  const ctx = buildDocumentContext(document);
  return `Extract all important clauses from this legal document.

Return ONLY a JSON object matching this exact schema:
{
  "clauses": [
    {
      "id": "string — unique identifier (e.g. 'clause-1')",
      "sectionId": "string — section number where this clause appears",
      "category": "financial|termination|restrictions|ownership|disputes|time|general",
      "title": "string — descriptive clause title",
      "attentionLevel": "high|medium|low",
      "summary": "string — what this clause covers",
      "plainEnglish": "string — explanation in simple language",
      "whyItMatters": "string — practical impact on the reader",
      "whatToVerify": ["string — things to check or clarify"],
      "sourceSection": "string — e.g. 'Section 5'",
      "sourcePage": "number or null",
      "originalText": "string — exact or near-exact quote from the document (max 400 chars)"
    }
  ]
}

RULES:
- Extract ALL clauses that have practical significance, not just major ones.
- Category must be one of: financial, termination, restrictions, ownership, disputes, time, general.
- originalText must be an actual quote from the document, not a paraphrase.
- Do NOT invent page numbers. If unavailable, return null.

${ctx}`;
}


function buildObligationPrompt(document) {
  const ctx = buildDocumentContext(document);
  return `Extract all obligations from this legal document — things each party must do, deadlines, triggers, and consequences.

Return ONLY a JSON object matching this exact schema:
{
  "obligations": [
    {
      "id": "string — unique identifier",
      "who": "string — which party bears this obligation (e.g. 'Employee', 'Company', 'Both Parties')",
      "action": "string — what must be done",
      "trigger": "string — what triggers this obligation",
      "deadline": "string — time frame or deadline if specified, otherwise 'As specified in the agreement'",
      "consequence": "string — what happens if not fulfilled, or 'As specified in the agreement'",
      "sourceSection": "string — e.g. 'Section 5'",
      "sourcePage": "number or null"
    }
  ]
}

RULES:
- Include obligations for ALL parties, not just one side.
- Preserve exact deadlines, notice periods, and amounts from the document.
- If a consequence is not stated, say "As specified in the agreement" — do not invent.

${ctx}`;
}


function buildQAPrompt(question, document, relevantClauses) {
  const ctx = buildDocumentContext(document);
  const clauseCtx = relevantClauses && relevantClauses.length > 0
    ? '\n\nRelevant clauses for context:\n' + relevantClauses.map(c =>
        `[${c.sourceSection}] ${c.title}: ${c.originalText || c.summary}`
      ).join('\n\n')
    : '';

  return `Answer the following question ONLY from the supplied document.

Question: "${question}"

Return ONLY a JSON object matching this exact schema:
{
  "answer": "string — the answer based on document content",
  "evidence": "string or null — direct quote or paraphrase from the document supporting the answer",
  "sourceSection": "string or null — e.g. 'Section 5'",
  "sourcePage": "number or null",
  "confidence": "high|medium|low",
  "outOfScope": "boolean — true if the question asks for legal advice or strategy",
  "notFound": "boolean — true if the answer is not in the document"
}

RULES:
- If the answer is NOT in the document, set notFound to true and answer: "This document does not specify that information."
- If the question asks for legal advice (e.g. "should I sue", "is this enforceable"), set outOfScope to true and answer: "I can help you understand relevant provisions, but cannot advise on legal action."
- Do NOT guess or infer information not present in the document.
- Cite the specific section and page where the answer is found.
${clauseCtx}

${ctx}`;
}


function buildComparisonPrompt(docA, docB) {
  const ctxA = buildDocumentContext(docA);
  const ctxB = buildDocumentContext(docB);
  return `Compare these two versions of a document and identify all meaningful differences.

Return ONLY a JSON object matching this exact schema:
{
  "summary": "string — overall comparison summary",
  "overallAssessment": "string — brief assessment of the changes",
  "changes": [
    {
      "id": "string — unique identifier",
      "clauseTitle": "string — title of the affected clause",
      "section": "string — section reference",
      "category": "string — clause category",
      "changeType": "added|modified|removed",
      "attentionLevel": "high|medium|low",
      "valueBefore": "string or null — value in Document A",
      "valueAfter": "string or null — value in Document B",
      "plainEnglishBefore": "string — plain English of Document A version",
      "plainEnglishAfter": "string — plain English of Document B version",
      "whyItMatters": "string — practical impact of this change",
      "textBefore": "string or null — original text from Document A",
      "textAfter": "string or null — original text from Document B"
    }
  ],
  "changeCounts": {
    "total": "number",
    "high": "number",
    "medium": "number",
    "low": "number",
    "added": "number",
    "modified": "number",
    "removed": "number"
  }
}

DOCUMENT A ("${docA.title}"):
${ctxA}

---

DOCUMENT B ("${docB.title}"):
${ctxB}`;
}


function buildConsultationPrompt(document, concern) {
  const ctx = buildDocumentContext(document);
  const userConcern = concern || 'Understanding key obligations before signing';
  return `Generate a lawyer consultation preparation brief based on this document.

User concern: "${userConcern}"

Return ONLY a JSON object matching this exact schema:
{
  "concern": "string — the user's concern restated",
  "relevantClauses": [
    {
      "title": "string — clause title",
      "section": "string — section reference",
      "attentionLevel": "high|medium|low",
      "summary": "string — why this clause is relevant to the concern"
    }
  ],
  "questionsForLawyer": ["string — specific questions to ask a lawyer about this document"],
  "documentsToGather": ["string — documents to bring to the consultation"],
  "keyDates": [
    {
      "label": "string — what the date is for",
      "date": "string — the date or 'ongoing'",
      "description": "string — context about the date",
      "sourceSection": "string — section reference"
    }
  ],
  "disclaimer": "This checklist is intended to help prepare for a professional legal consultation. It is not legal advice."
}

RULES:
- Questions should be specific to THIS document, not generic legal questions.
- Key dates must come from the document — do not invent dates.
- Focus relevant clauses on those related to the user's stated concern.

${ctx}`;
}


function buildTimelinePrompt(document) {
  const ctx = buildDocumentContext(document);
  return `Extract a chronological timeline of all important dates, deadlines, milestones, and time-bound obligations from this document.

Return ONLY a JSON object matching this exact schema:
{
  "timeline": [
    {
      "id": "string — unique identifier",
      "date": "string — YYYY-MM-DD, or 'ongoing', or descriptive (e.g. 'Upon termination')",
      "label": "string — short label for the event",
      "description": "string — what happens at this point",
      "type": "milestone|obligation|financial|restriction|deadline",
      "sourceSection": "string — section reference"
    }
  ]
}

RULES:
- Only include dates/deadlines that are actually stated or implied in the document.
- Use exact dates when provided, descriptive dates otherwise (e.g. "90 days after commencement").
- Do NOT invent dates.

${ctx}`;
}


module.exports = {
  SYSTEM_PROMPT,
  buildDocumentContext,
  buildAnalysisPrompt,
  buildClausePrompt,
  buildObligationPrompt,
  buildQAPrompt,
  buildComparisonPrompt,
  buildConsultationPrompt,
  buildTimelinePrompt,
};
