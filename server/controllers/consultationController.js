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

exports.generateBrief = async (req, res, next) => {
  try {
    const { documentId, concern } = req.body;

    if (!documentId) return res.status(400).json({ error: 'documentId is required' });
    if (concern !== undefined && typeof concern !== 'string') {
      return res.status(400).json({ error: 'concern must be a string' });
    }
    if (concern && concern.length > 500) {
      return res.status(400).json({ error: 'concern exceeds 500 characters' });
    }

    const service = await getAIService();
    const doc = await resolveDocument(service, documentId);

    res.json(await service.generateConsultationBrief(doc, concern?.trim() || null));
  } catch (err) { next(err); }
};
