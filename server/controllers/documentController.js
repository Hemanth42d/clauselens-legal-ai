const { getAIService }   = require('../services/ai');
const DocumentProcessor  = require('../services/document/DocumentProcessor');
const DocumentStore      = require('../services/document/DocumentStore');
const path = require('path');
const fs   = require('fs');

exports.listDocuments = async (req, res, next) => {
  try {
    const service = getAIService();
    if (typeof service.listDocuments === 'function') {
      return res.json({ documents: service.listDocuments(), mode: 'demo' });
    }
    res.json({ documents: [] });
  } catch (err) { next(err); }
};

exports.getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid document ID' });
    }
    const service = getAIService();
    if (typeof service.getDocument === 'function') {
      return res.json({ document: service.getDocument(id) });
    }
    res.status(404).json({ error: 'Document not found' });
  } catch (err) { next(err); }
};

exports.getSections = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid document ID' });
    }
    const service = getAIService();
    if (typeof service.getDocument === 'function') {
      const doc      = service.getDocument(id);
      const sections = doc.sections.map(s => ({
        id: s.id, sectionNumber: s.sectionNumber, title: s.title, page: s.page, category: s.category,
      }));
      return res.json({ sections });
    }
    res.status(404).json({ error: 'Document not found' });
  } catch (err) { next(err); }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided.' });

    const document = await DocumentProcessor.process(req.file);

    const service = getAIService();
    if (typeof service.registerDocument === 'function') {
      service.registerDocument(document);
    } else {
      DocumentStore.register(document, false);
    }

    res.json({ documentId: document.documentId, title: document.title, isUploaded: true });
  } catch (err) {
    // Forward structured errors (e.g. 413, 415, 422) without wrapping.
    next(err);
  }
};

exports.downloadSample = (_req, res, next) => {
  try {
    const samplePath = path.join(__dirname, '..', 'data', 'demo',
      'ClauseLens_Sample_Employment_Agreement.txt');

    if (!fs.existsSync(samplePath)) {
      return res.status(404).json({ error: 'Sample document not found.' });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="ClauseLens_Sample_Employment_Agreement.txt"');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.sendFile(samplePath);
  } catch (err) { next(err); }
};

exports.loadDemo = async (req, res, next) => {
  try {
    const demoId  = (req.body.documentId || 'employment-v2').toString().trim();
    const service = getAIService();
    if (typeof service.getDocument === 'function') {
      const doc = service.getDocument(demoId);
      return res.json({ documentId: doc.documentId, title: doc.title, isDemo: true });
    }
    res.status(404).json({ error: 'Demo document not found.' });
  } catch (err) { next(err); }
};
