/**
 * DocumentProcessor — Document ingestion and processing pipeline.
 *
 * Pipeline stages:
 *   1. Text Extraction     (PDF via pdf-parse, plain-text direct)
 *   2. Section Detection   (numbered heading regex)
 *   3. Clause Segmentation
 *   4. Clause Classification (keyword heuristics)
 *   5. Obligation Extraction
 *   6. Attention Detection
 *   7. Evidence Mapping
 *
 * For demo documents, the pre-structured JSON is used directly.
 * For uploaded PDFs, text is extracted then parsed into sections.
 */

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'text/plain',
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.txt']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB (matches spec)

class DocumentProcessor {
  // ── Validation ─────────────────────────────────────────────────────────────

  validateFile(file) {
    if (!file) {
      throw Object.assign(new Error('No file provided'), { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw Object.assign(
        new Error('File exceeds the 10 MB limit.'),
        { status: 413 }
      );
    }

    // Check MIME type — browsers sometimes send different values for PDFs
    const isPDF =
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/x-pdf' ||
      (file.originalname || '').toLowerCase().endsWith('.pdf');

    const isTXT =
      file.mimetype === 'text/plain' ||
      (file.originalname || '').toLowerCase().endsWith('.txt');

    if (!isPDF && !isTXT) {
      throw Object.assign(
        new Error('Please upload a PDF file.'),
        { status: 415 }
      );
    }

    // Sanitise filename
    file.safeName = (file.originalname || 'document')
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/_{2,}/g, '_');

    file.isPDF = isPDF;
  }

  // ── Text extraction ────────────────────────────────────────────────────────

  async extractText(buffer, isPDF) {
    if (!isPDF) {
      // Plain text
      const text = buffer.toString('utf8');
      if (!text || text.trim().length < 20) {
        throw Object.assign(
          new Error("We couldn't extract readable text from this document."),
          { status: 422 }
        );
      }
      return text;
    }

    // PDF — use pdf-parse
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer, {
        // Disable test-file check that pdf-parse does on require
        max: 0,
      });

      if (!data.text || data.text.trim().length < 20) {
        throw Object.assign(
          new Error("We couldn't extract readable text from this document."),
          { status: 422 }
        );
      }

      return data.text;
    } catch (err) {
      if (err.status) throw err; // rethrow our own errors
      throw Object.assign(
        new Error("We couldn't analyze this document. Please try another PDF."),
        { status: 422 }
      );
    }
  }

  // ── Section detection ──────────────────────────────────────────────────────

  detectSections(text) {
    const lines = text.split(/\r?\n/);
    const sections = [];
    let current = null;
    let pageCounter = 1;
    let lineCount = 0;
    const LINES_PER_PAGE = 45;

    // Patterns for section headings
    const HEADING_PATTERNS = [
      // "1. TITLE" or "1.1 TITLE" (all caps required)
      /^(\d+(?:\.\d+)?)[.\s]+([A-Z][A-Z0-9\s\-&\/]+)$/,
      // "Section 1: Title" or "SECTION 1 - Title"
      /^(?:SECTION|Section)\s+(\d+(?:\.\d+)?)[\s:\-]+(.+)$/,
      // "1) TITLE"
      /^(\d+(?:\.\d+)?)\)\s+([A-Z][A-Z0-9\s\-&\/]+)$/,
    ];

    for (const line of lines) {
      lineCount++;
      if (lineCount % LINES_PER_PAGE === 0) pageCounter++;

      const trimmed = line.trim();
      if (!trimmed) continue;

      let matched = false;
      for (const pattern of HEADING_PATTERNS) {
        const m = trimmed.match(pattern);
        if (m && m[2] && m[2].trim().length >= 3) {
          if (current) sections.push(current);
          current = {
            id: m[1],
            sectionNumber: m[1],
            title: m[2].trim().replace(/\s+/g, ' '),
            page: pageCounter,
            text: trimmed,
            category: 'general',
          };
          matched = true;
          break;
        }
      }

      if (!matched && current) {
        current.text += '\n' + line;
      } else if (!matched && !current && trimmed.length > 0) {
        // Pre-heading content (title page etc)
        current = {
          id: '0',
          sectionNumber: '0',
          title: 'Document Header',
          page: 1,
          text: trimmed,
          category: 'general',
        };
      }
    }

    if (current) sections.push(current);

    // Filter out sections with very little content
    return sections.filter(s => s.text && s.text.trim().length > 10);
  }

  // ── Classification ─────────────────────────────────────────────────────────

  classifySection(section) {
    const text = (section.title + ' ' + section.text).toLowerCase();

    const rules = [
      {
        category: 'financial',
        keywords: ['salary', 'remuneration', 'compensation', 'bonus', 'ctc',
                   'fee', 'payment', 'training cost', 'recovery', 'reimbursement',
                   'increment', 'incentive'],
      },
      {
        category: 'termination',
        keywords: ['notice', 'termination', 'dismissal', 'resignation',
                   'garden leave', 'pilon', 'redundancy', 'layoff'],
      },
      {
        category: 'restrictions',
        keywords: ['confidential', 'non-solicitation', 'non-compete',
                   'exclusivity', 'data protection', 'privacy', 'nda'],
      },
      {
        category: 'ownership',
        keywords: ['intellectual property', 'copyright', 'invention',
                   'patent', 'assignment', 'work product', 'moral rights'],
      },
      {
        category: 'disputes',
        keywords: ['dispute', 'arbitration', 'mediation', 'governing law',
                   'jurisdiction', 'litigation', 'court'],
      },
      {
        category: 'time',
        keywords: ['probation', 'duration', 'renewal', 'deadline', 'leave',
                   'holiday', 'hours', 'working hours', 'annual leave'],
      },
    ];

    for (const rule of rules) {
      if (rule.keywords.some(kw => text.includes(kw))) return rule.category;
    }
    return 'general';
  }

  // ── Obligation extraction from text ────────────────────────────────────────

  extractObligationsFromText(sections) {
    const obligations = [];
    let id = 1;

    const OBLIGATION_KEYWORDS = [
      { trigger: 'shall', who: null },
      { trigger: 'must', who: null },
      { trigger: 'agrees to', who: null },
      { trigger: 'is required to', who: null },
      { trigger: 'undertakes to', who: null },
    ];

    const EMPLOYEE_INDICATORS = ['employee shall', 'employee must', 'employee agrees',
                                  'employee undertakes', 'employee is required'];
    const COMPANY_INDICATORS  = ['company shall', 'employer shall', 'company must',
                                  'employer must', 'company agrees', 'company undertakes'];

    for (const section of sections) {
      if (section.category === 'general') continue;

      const sentences = section.text
        .split(/[.;]/)
        .map(s => s.trim())
        .filter(s => s.length > 20);

      for (const sentence of sentences) {
        const lower = sentence.toLowerCase();
        const hasObligation = OBLIGATION_KEYWORDS.some(k => lower.includes(k.trigger));
        if (!hasObligation) continue;

        let who = 'Both Parties';
        if (EMPLOYEE_INDICATORS.some(i => lower.includes(i))) who = 'Employee';
        else if (COMPANY_INDICATORS.some(i => lower.includes(i))) who = 'Company';

        // Extract a concise action from the sentence
        const action = sentence
          .replace(/^(?:The\s+)?(?:employee|company|employer)\s+(?:shall|must|agrees?\s+to|undertakes\s+to|is\s+required\s+to)\s+/i, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 120);

        if (action.length < 10) continue;

        obligations.push({
          id: `ob-upload-${id++}`,
          who,
          action: action.charAt(0).toUpperCase() + action.slice(1),
          trigger: 'As specified in the agreement',
          deadline: this._extractDeadline(sentence),
          consequence: 'As specified in the agreement',
          sourceSection: `Section ${section.sectionNumber}`,
          sourcePage: section.page,
        });

        if (obligations.length >= 12) break; // cap at 12 for uploaded docs
      }
      if (obligations.length >= 12) break;
    }

    return obligations;
  }

  _extractDeadline(sentence) {
    const patterns = [
      /(\d+)\s+days/i,
      /(\d+)\s+months/i,
      /(\d+)\s+weeks/i,
      /within\s+([^,;.]+)/i,
      /by\s+([^,;.]{3,30})/i,
    ];
    for (const p of patterns) {
      const m = sentence.match(p);
      if (m) return m[0].trim();
    }
    return 'As specified';
  }

  // ── Clause extraction from text ────────────────────────────────────────────

  extractClausesFromText(sections) {
    const clauses = [];
    const IMPORTANT_CATEGORIES = ['financial', 'termination', 'restrictions', 'ownership', 'disputes'];

    for (const section of sections) {
      if (!IMPORTANT_CATEGORIES.includes(section.category)) continue;

      // Take first meaningful paragraph as the clause text
      const paragraphs = section.text
        .split(/\n\n|\n(?=\d+\.\d)/)
        .filter(p => p.trim().length > 30);

      const originalText = paragraphs[0]
        ? paragraphs[0].trim().slice(0, 400)
        : section.text.trim().slice(0, 400);

      const attentionLevel = this._assessAttention(section);

      clauses.push({
        id: `clause-upload-${section.id}`,
        sectionId: section.id,
        category: section.category,
        title: section.title.charAt(0) + section.title.slice(1).toLowerCase(),
        attentionLevel,
        summary: `This section covers ${section.title.toLowerCase()} provisions in the agreement.`,
        plainEnglish: `The document contains provisions about ${section.title.toLowerCase()}. Review this section carefully with reference to the original text below.`,
        whyItMatters: `${section.title} clauses can have significant practical implications. Understanding the exact terms here is important before signing.`,
        whatToVerify: [
          'Read the exact wording carefully.',
          'Clarify any terms you do not understand.',
          'Ask a legal professional if this clause affects your situation.',
        ],
        sourceSection: `Section ${section.sectionNumber}`,
        sourcePage: section.page,
        originalText,
        keywords: section.title.toLowerCase().split(/\s+/),
      });
    }

    return clauses;
  }

  _assessAttention(section) {
    const HIGH_KEYWORDS   = ['notice', 'termination', 'confidential', 'intellectual property',
                              'training', 'recovery', 'non-compete', 'non-solicitation',
                              'repayment', 'renewal', 'automatic'];
    const MEDIUM_KEYWORDS = ['probation', 'salary', 'bonus', 'leave', 'dispute', 'arbitration',
                              'data protection', 'copyright'];

    const text = (section.title + ' ' + section.text).toLowerCase();
    if (HIGH_KEYWORDS.some(k => text.includes(k))) return 'high';
    if (MEDIUM_KEYWORDS.some(k => text.includes(k))) return 'medium';
    return 'low';
  }

  // ── Attention areas ────────────────────────────────────────────────────────

  buildAttentionAreas(clauses) {
    return clauses
      .filter(c => c.attentionLevel !== 'low' || c.category === 'restrictions')
      .slice(0, 8)
      .map((c, i) => ({
        id: `att-upload-${i + 1}`,
        clauseId: c.id,
        level: c.attentionLevel,
        title: c.title,
        summary: c.summary,
        sourceSection: c.sourceSection,
        sourcePage: c.sourcePage,
      }));
  }

  // ── Timeline ───────────────────────────────────────────────────────────────

  buildTimeline(sections, obligations) {
    const timeline = [];
    let id = 1;

    // Extract date-like provisions from obligation deadlines
    for (const ob of obligations.slice(0, 6)) {
      if (ob.deadline && ob.deadline !== 'As specified') {
        timeline.push({
          id: `tl-upload-${id++}`,
          date: 'ongoing',
          label: ob.action.slice(0, 60),
          description: `${ob.who}: ${ob.action.slice(0, 100)}`,
          type: 'obligation',
          sourceSection: ob.sourceSection,
        });
      }
    }

    // Add generic milestones from section headings
    const MILESTONE_KEYWORDS = ['commencement', 'probation', 'notice', 'renewal', 'termination'];
    for (const section of sections) {
      const lower = section.title.toLowerCase();
      if (MILESTONE_KEYWORDS.some(k => lower.includes(k))) {
        timeline.push({
          id: `tl-upload-${id++}`,
          date: 'ongoing',
          label: section.title,
          description: `See ${section.title} provisions in the agreement.`,
          type: 'milestone',
          sourceSection: `Section ${section.sectionNumber}`,
        });
      }
    }

    return timeline.slice(0, 8);
  }

  // ── Build full document object from extracted text ─────────────────────────

  buildDocumentFromText(text, filename) {
    const sections   = this.detectSections(text).map(s => ({
      ...s,
      category: this.classifySection(s),
    }));

    const clauses       = this.extractClausesFromText(sections);
    const obligations   = this.extractObligationsFromText(sections);
    const attentionAreas = this.buildAttentionAreas(clauses);
    const timeline      = this.buildTimeline(sections, obligations);

    const docTitle = filename
      ? filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
      : 'Uploaded Document';

    return {
      documentId:   `upload-${Date.now()}`,
      title:        docTitle,
      version:      '1.0',
      disclaimer:   'This document was uploaded by the user. ClauseLens provides informational assistance only — not legal advice.',
      metadata: {
        documentType:   'Uploaded Document',
        effectiveDate:  null,
        parties:        {},
        totalPages:     Math.ceil(text.split('\n').length / 45),
        totalSections:  sections.length,
      },
      summary: {
        documentType: 'Uploaded Document',
        parties:      [],
        keyTopics:    [...new Set(sections.map(s => s.category))],
      },
      sections,
      clauses,
      obligations,
      timeline,
      attentionAreas,
      isUploaded: true,
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Full pipeline: validate → extract text → build document object.
   * Returns structured document ready for analysis.
   */
  async process(file) {
    this.validateFile(file);
    const text = await this.extractText(file.buffer, file.isPDF);
    return this.buildDocumentFromText(text, file.safeName);
  }
}

module.exports = new DocumentProcessor();
