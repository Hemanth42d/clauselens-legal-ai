const { getAIService }  = require('../services/ai');
const DocumentStore     = require('../services/document/DocumentStore');

/**
 * Resolves a documentId to a full document object (async — works with MongoDB).
 * Checks the AI service store first (demo docs), then the shared DocumentStore (uploads).
 */
async function resolveDocument(service, documentId) {
  if (typeof service.getDocument === 'function') {
    try {
      const doc = await service.getDocument(documentId);
      if (doc) return doc;
    } catch { /* fall through to DocumentStore */ }
  }
  const doc = await DocumentStore.get(documentId);
  if (!doc) {
    const err = new Error(`Document not found: ${documentId}`);
    err.status = 404;
    throw err;
  }
  return doc;
}

exports.analyzeDocument = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'documentId is required' });

    const service = await getAIService();
    const doc     = await resolveDocument(service, documentId);
    res.json(await service.analyzeDocument(doc));
  } catch (err) { next(err); }
};

exports.extractClauses = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'documentId is required' });

    const service = await getAIService();
    const doc     = await resolveDocument(service, documentId);
    res.json(await service.extractClauses(doc));
  } catch (err) { next(err); }
};

exports.extractObligations = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'documentId is required' });

    const service = await getAIService();
    const doc     = await resolveDocument(service, documentId);
    res.json(await service.extractObligations(doc));
  } catch (err) { next(err); }
};

exports.extractTimeline = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'documentId is required' });

    const service = await getAIService();
    // Resolve doc so all services receive the full object, not just an ID string.
    const doc     = await resolveDocument(service, documentId);
    res.json(await service.extractTimeline(doc.documentId));
  } catch (err) { next(err); }
};
