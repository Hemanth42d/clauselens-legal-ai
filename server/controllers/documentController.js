const { getAIService }   = require('../services/ai');
const DocumentProcessor  = require('../services/document/DocumentProcessor');
const DocumentStore      = require('../services/document/DocumentStore');
const path = require('path');
const fs   = require('fs');

exports.listDocuments = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const service = await getAIService();
    if (typeof service.listDocuments === 'function') {
      const docs = await service.listDocuments(userId);
      return res.json({ documents: docs, mode: 'demo' });
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
    const service = await getAIService();
    if (typeof service.getDocument === 'function') {
      const doc = await service.getDocument(id);
      return res.json({ document: doc });
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
    const service = await getAIService();
    if (typeof service.getDocument === 'function') {
      const doc      = await service.getDocument(id);
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
    document.userId = req.user?.id; // Associate with the logged-in user

    const service = await getAIService();
    if (typeof service.registerDocument === 'function') {
      await service.registerDocument(document);
    } else {
      await DocumentStore.register(document, false);
    }

    res.json({ documentId: document.documentId, title: document.title, isUploaded: true });
  } catch (err) {
    next(err);
  }
};

exports.downloadSample = (_req, res, next) => {
  try {
    const samplePath = path.resolve(
      __dirname, '..', 'data', 'demo',
      'ClauseLens_Sample_Employment_Agreement.txt'
    );

    if (!fs.existsSync(samplePath)) {
      return res.status(404).json({ error: 'Sample document not found.' });
    }

    res.download(samplePath, 'ClauseLens_Sample_Employment_Agreement.txt', (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (err) { next(err); }
};

exports.loadDemo = async (req, res, next) => {
  try {
    const demoId  = (req.body.documentId || 'employment-v2').toString().trim();
    const service = await getAIService();
    if (typeof service.getDocument === 'function') {
      const doc = await service.getDocument(demoId);
      return res.json({ documentId: doc.documentId, title: doc.title, isDemo: true });
    }
    res.status(404).json({ error: 'Demo document not found.' });
  } catch (err) { next(err); }
};
