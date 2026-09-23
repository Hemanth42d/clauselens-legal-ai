const { getAIService } = require('../services/ai');
const DocumentStore    = require('../services/document/DocumentStore');

async function resolveDocument(service, documentId) {
  if (typeof service.getDocument === 'function') {
    try {
      const doc = await service.getDocument(documentId);
      if (doc) return doc;
    } catch { /* fall through */ }
  }
  const doc = await DocumentStore.get(documentId);
  if (!doc) {
    const err = new Error(`Document not found: ${documentId}`);
    err.status = 404;
    throw err;
  }
  return doc;
}

exports.compareDocuments = async (req, res, next) => {
  try {
    const { documentAId, documentBId } = req.body;

    if (!documentAId || !documentBId) {
      return res.status(400).json({ error: 'documentAId and documentBId are required' });
    }
    if (documentAId === documentBId) {
      return res.status(400).json({ error: 'Cannot compare a document with itself' });
    }

    const service = await getAIService();
    const [docA, docB] = await Promise.all([
      resolveDocument(service, documentAId),
      resolveDocument(service, documentBId),
    ]);

    res.json(await service.compareDocuments(docA, docB));
  } catch (err) { next(err); }
};
