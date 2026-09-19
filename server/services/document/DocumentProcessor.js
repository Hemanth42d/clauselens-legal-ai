const { v4: uuidv4 } = require('uuid');

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const HEADING_PATTERNS = [
  /^(\d+(?:\.\d+)?)[.\s]+([A-Z][A-Z0-9\s\-&\/]+)$/,
  /^(?:SECTION|Section)\s+(\d+(?:\.\d+)?)[\s:\-]+(.+)$/,
  /^(\d+(?:\.\d+)?)\)\s+([A-Z][A-Z0-9\s\-&\/]+)$/,
];

const CLASSIFICATION_RULES = [
  { category: 'financial',    keywords: ['salary','remuneration','compensation','bonus','ctc','fee','payment','training cost','recovery','reimbursement','increment','incentive'] },
  { category: 'termination',  keywords: ['notice','termination','dismissal','resignation','garden leave','pilon','redundancy','layoff'] },
  { category: 'restrictions', keywords: ['confidential','non-solicitation','non-compete','exclusivity','data protection','privacy','nda'] },
  { category: 'ownership',    keywords: ['intellectual property','copyright','invention','patent','assignment','work product','moral rights'] },
  { category: 'disputes',     keywords: ['dispute','arbitration','mediation','governing law','jurisdiction','litigation','court'] },
  { category: 'time',         keywords: ['probation','duration','renewal','deadline','leave','holiday','hours','working hours','annual leave'] },
];

const HIGH_ATTENTION   = ['notice','termination','confidential','intellectual property','training','recovery','non-compete','non-solicitation','repayment','renewal','automatic'];
const MEDIUM_ATTENTION = ['probation','salary','bonus','leave','dispute','arbitration','data protection','copyright'];

const OBLIGATION_TRIGGERS    = ['shall','must','agrees to','is required to','undertakes to'];
const EMPLOYEE_INDICATORS    = ['employee shall','employee must','employee agrees','employee undertakes','employee is required'];
const COMPANY_INDICATORS     = ['company shall','employer shall','company must','employer must','company agrees','company undertakes'];
const MILESTONE_KEYWORDS     = ['commencement','probation','notice','renewal','termination'];
const DEADLINE_PATTERNS      = [/(\d+)\s+days/i, /(\d+)\s+months/i, /(\d+)\s+weeks/i, /within\s+([^,;.]+)/i, /by\s+([^,;.]{3,30})/i];

/**
 * Processes uploaded documents through a local NLP pipeline:
 * validate → extract text → detect sections → classify → extract clauses/obligations/timeline
 */
class DocumentProcessor {
  validateFile(file) {
    if (!file) throw Object.assign(new Error('No file provided'), { status: 400 });
    if (file.size > MAX_FILE_BYTES) throw Object.assign(new Error('File exceeds the 10 MB limit.'), { status: 413 });

    const name  = (file.originalname || '').toLowerCase();
    const isPDF = file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf' || name.endsWith('.pdf');
    const isTXT = file.mimetype === 'text/plain' || name.endsWith('.txt');

    if (!isPDF && !isTXT) throw Object.assign(new Error('Please upload a PDF file.'), { status: 415 });

    file.safeName = (file.originalname || 'document').replace(/[^a-zA-Z0-9.\-_]/g, '_').replace(/_{2,}/g, '_');
    file.isPDF    = isPDF;
  }

  async extractText(buffer, isPDF) {
    if (!isPDF) {
      const text = buffer.toString('utf8');
      if (!text || text.trim().length < 20) {
        throw Object.assign(new Error("We couldn't extract readable text from this document."), { status: 422 });
      }
      return text;
    }
    try {
      const pdfParse = require('pdf-parse');
      const data     = await pdfParse(buffer, { max: 0 });
      if (!data.text || data.text.trim().length < 20) {
        throw Object.assign(new Error("We couldn't extract readable text from this document."), { status: 422 });
      }
      return data.text;
    } catch (err) {
      if (err.status) throw err;
      throw Object.assign(new Error("We couldn't analyze this document. Please try another PDF."), { status: 422 });
    }
  }

  detectSections(text) {
    const lines    = text.split(/\r?\n/);
    const sections = [];
    let current    = null;
    let page       = 1;
    let lineN      = 0;

    for (const line of lines) {
      if (++lineN % 45 === 0) page++;
      const trimmed = line.trim();
      if (!trimmed) continue;

      let matched = false;
      for (const pattern of HEADING_PATTERNS) {
        const m = trimmed.match(pattern);
        if (m && m[2] && m[2].trim().length >= 3) {
          if (current) sections.push(current);
          current = { id: m[1], sectionNumber: m[1], title: m[2].trim().replace(/\s+/g, ' '), page, text: trimmed, category: 'general' };
          matched = true;
          break;
        }
      }

      if (!matched && current)  current.text += '\n' + line;
      else if (!matched && !current) current = { id: '0', sectionNumber: '0', title: 'Document Header', page: 1, text: trimmed, category: 'general' };
    }

    if (current) sections.push(current);
    return sections.filter(s => s.text && s.text.trim().length > 10);
  }

  classifySection(section) {
    const text = (section.title + ' ' + section.text).toLowerCase();
    for (const rule of CLASSIFICATION_RULES) {
      if (rule.keywords.some(kw => text.includes(kw))) return rule.category;
    }
    return 'general';
  }

  _assessAttention(section) {
    const text = (section.title + ' ' + section.text).toLowerCase();
    if (HIGH_ATTENTION.some(k => text.includes(k)))   return 'high';
    if (MEDIUM_ATTENTION.some(k => text.includes(k))) return 'medium';
    return 'low';
  }

  _extractDeadline(sentence) {
    for (const p of DEADLINE_PATTERNS) {
      const m = sentence.match(p);
      if (m) return m[0].trim();
    }
    return 'As specified';
  }

  extractClausesFromText(sections) {
    const IMPORTANT = ['financial','termination','restrictions','ownership','disputes'];
    return sections
      .filter(s => IMPORTANT.includes(s.category))
      .map(s => {
        const originalText = s.text.trim().slice(0, 400);
        return {
          id:             `clause-upload-${s.id}`,
          sectionId:      s.id,
          category:       s.category,
          title:          s.title.charAt(0) + s.title.slice(1).toLowerCase(),
          attentionLevel: this._assessAttention(s),
          summary:        `This section covers ${s.title.toLowerCase()} provisions in the agreement.`,
          plainEnglish:   `The document contains provisions about ${s.title.toLowerCase()}. Review this section carefully with reference to the original text below.`,
          whyItMatters:   `${s.title} clauses can have significant practical implications. Understanding the exact terms is important before signing.`,
          whatToVerify:   ['Read the exact wording carefully.','Clarify any terms you do not understand.','Ask a legal professional if this clause affects your situation.'],
          sourceSection:  `Section ${s.sectionNumber}`,
          sourcePage:     s.page,
          originalText,
          keywords:       s.title.toLowerCase().split(/\s+/),
        };
      });
  }

  extractObligationsFromText(sections) {
    const obligations = [];
    let id = 1;

    for (const section of sections) {
      if (section.category === 'general') continue;

      const sentences = section.text.split(/[.;]/).map(s => s.trim()).filter(s => s.length > 20);

      for (const sentence of sentences) {
        const lower = sentence.toLowerCase();
        if (!OBLIGATION_TRIGGERS.some(t => lower.includes(t))) continue;

        let who = 'Both Parties';
        if (EMPLOYEE_INDICATORS.some(i => lower.includes(i))) who = 'Employee';
        else if (COMPANY_INDICATORS.some(i => lower.includes(i))) who = 'Company';

        const action = sentence
          .replace(/^(?:The\s+)?(?:employee|company|employer)\s+(?:shall|must|agrees?\s+to|undertakes\s+to|is\s+required\s+to)\s+/i, '')
          .replace(/\s+/g, ' ').trim().slice(0, 120);

        if (action.length < 10) continue;

        obligations.push({
          id:           `ob-upload-${id++}`,
          who,
          action:       action.charAt(0).toUpperCase() + action.slice(1),
          trigger:      'As specified in the agreement',
          deadline:     this._extractDeadline(sentence),
          consequence:  'As specified in the agreement',
          sourceSection:`Section ${section.sectionNumber}`,
          sourcePage:   section.page,
        });

        if (obligations.length >= 12) break;
      }
      if (obligations.length >= 12) break;
    }

    return obligations;
  }

  buildAttentionAreas(clauses) {
    return clauses
      .filter(c => c.attentionLevel !== 'low' || c.category === 'restrictions')
      .slice(0, 8)
      .map((c, i) => ({
        id:            `att-upload-${i + 1}`,
        clauseId:      c.id,
        level:         c.attentionLevel,
        title:         c.title,
        summary:       c.summary,
        sourceSection: c.sourceSection,
        sourcePage:    c.sourcePage,
      }));
  }

  buildTimeline(sections, obligations) {
    const timeline = [];
    let id = 1;

    for (const ob of obligations.slice(0, 6)) {
      if (ob.deadline && ob.deadline !== 'As specified') {
        timeline.push({ id: `tl-upload-${id++}`, date: 'ongoing', label: ob.action.slice(0, 60), description: `${ob.who}: ${ob.action.slice(0, 100)}`, type: 'obligation', sourceSection: ob.sourceSection });
      }
    }

    for (const section of sections) {
      if (MILESTONE_KEYWORDS.some(k => section.title.toLowerCase().includes(k))) {
        timeline.push({ id: `tl-upload-${id++}`, date: 'ongoing', label: section.title, description: `See ${section.title} provisions.`, type: 'milestone', sourceSection: `Section ${section.sectionNumber}` });
      }
    }

    return timeline.slice(0, 8);
  }

  buildDocumentFromText(text, filename) {
    const sections     = this.detectSections(text).map(s => ({ ...s, category: this.classifySection(s) }));
    const clauses      = this.extractClausesFromText(sections);
    const obligations  = this.extractObligationsFromText(sections);

    return {
      documentId:    `upload-${uuidv4()}`,   // uuid avoids timestamp collisions
      title:         (filename || 'Uploaded Document').replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
      version:       '1.0',
      disclaimer:    'This document was uploaded by the user. ClauseLens provides informational assistance only — not legal advice.',
      metadata:      { documentType: 'Uploaded Document', effectiveDate: null, parties: {}, totalPages: Math.ceil(text.split('\n').length / 45), totalSections: sections.length },
      summary:       { documentType: 'Uploaded Document', parties: [], keyTopics: [...new Set(sections.map(s => s.category))] },
      sections,
      clauses,
      obligations,
      timeline:      this.buildTimeline(sections, obligations),
      attentionAreas:this.buildAttentionAreas(clauses),
      isUploaded:    true,
    };
  }

  async process(file) {
    this.validateFile(file);
    const text = await this.extractText(file.buffer, file.isPDF);
    return this.buildDocumentFromText(text, file.safeName);
  }
}

module.exports = new DocumentProcessor();
