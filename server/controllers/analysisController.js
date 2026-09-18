const { getAIService } = require('../services/ai');
const DocumentStore = require('../services/document/DocumentStore');

/**
 * Helper: resolve a documentId to a document object.
 * Checks the AI service first (demo), then falls back to DocumentStore (uploads).
 */
function resolveDocument(service, documentId) {
  if (typeof service.getDocument === 'function') {
    try {
      return service.getDocument(documentId);
    } catch (e) {
      // Not in demo store — try DocumentStore (uploaded docs)
    }
  }
  const doc = DocumentStore.get(documentId);
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

    const service = getAIService();
    const doc = resolveDocument(service, documentId);
    const result = await service.analyzeDocument(doc);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.extractClauses = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'documentId is required' });

    const service = getAIService();
    const doc = resolveDocument(service, documentId);
    const result = await service.extractClauses(doc);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.extractObligations = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'documentId is required' });

    const service = getAIService();
    const doc = resolveDocument(service, documentId);
    const result = await service.extractObligations(doc);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.extractTimeline = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'documentId is required' });

    const service = getAIService();
    // extractTimeline accepts a documentId string directly
    const result = await service.extractTimeline(documentId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
