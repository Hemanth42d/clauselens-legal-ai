const { getAIService } = require('../services/ai');
const DocumentProcessor = require('../services/document/DocumentProcessor');
const DocumentStore = require('../services/document/DocumentStore');
const path = require('path');
const fs = require('fs');

// ── List documents ────────────────────────────────────────────────────────────
exports.listDocuments = async (req, res, next) => {
  try {
    const service = getAIService();
    if (typeof service.listDocuments === 'function') {
      return res.json({ documents: service.listDocuments(), mode: 'demo' });
    }
    res.json({ documents: [], mode: 'ai' });
  } catch (err) {
    next(err);
  }
};

// ── Get one document
exports.getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid document ID' });
    }
    const service = getAIService();
    if (typeof service.getDocument === 'function') {
      const doc = service.getDocument(id);
      return res.json({ document: doc });
    }
    res.status(404).json({ error: 'Document not found' });
  } catch (err) {
    next(err);
  }
};

// ── Get sections (navigation list) ───────────────────────────────────────────
exports.getSections = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = getAIService();
    if (typeof service.getDocument === 'function') {
      const doc = service.getDocument(id);
      const sections = doc.sections.map(s => ({
        id: s.id,
        sectionNumber: s.sectionNumber,
        title: s.title,
        page: s.page,
        category: s.category,
      }));
      return res.json({ sections });
    }
    res.status(404).json({ error: 'Document not found' });
  } catch (err) {
    next(err);
  }
};

// ── Upload → Process → Register → Return documentId ──────────────────────────
// Client then calls the analysis endpoints with that documentId.
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided.' });
    }

    // Process: validate, extract text, build structure
    const document = await DocumentProcessor.process(req.file);

    // Register in the shared store so analysis endpoints can reach it
    const service = getAIService();
    if (typeof service.registerDocument === 'function') {
      service.registerDocument(document);
    } else {
      // Fallback: put directly in DocumentStore
      DocumentStore.register(document, false);
    }

    res.json({
      documentId: document.documentId,
      title: document.title,
      isUploaded: true,
      message: 'Document processed and ready for analysis.',
    });
  } catch (err) {
    // Surface structured errors to the client with friendly messages
    const status = err.status || 500;
    const message = err.message || 'We couldn\'t analyze this document. Please try another PDF.';
    res.status(status).json({ error: message });
  }
};

// ── Serve sample document download ────────────────────────────────────────────
exports.downloadSample = (req, res, next) => {
  try {
    const samplePath = path.join(
      __dirname, '..', 'data', 'demo',
      'ClauseLens_Sample_Employment_Agreement.txt'
    );

    if (!fs.existsSync(samplePath)) {
      return res.status(404).json({ error: 'Sample document not found.' });
    }

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="ClauseLens_Sample_Employment_Agreement.txt"'
    );
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.sendFile(samplePath);
  } catch (err) {
    next(err);
  }
};

// ── Load demo document (registers it if not already present) ─────────────────
exports.loadDemo = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    const demoId = documentId || 'employment-v2';

    const service = getAIService();
    if (typeof service.getDocument === 'function') {
      const doc = service.getDocument(demoId); // throws if not found
      return res.json({
        documentId: doc.documentId,
        title: doc.title,
        isDemo: true,
        message: 'Demo document ready for analysis.',
      });
    }
    res.status(404).json({ error: 'Demo document not found.' });
  } catch (err) {
    next(err);
  }
};
