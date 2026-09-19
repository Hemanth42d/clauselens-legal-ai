const { getAIService } = require('../services/ai');
const DocumentStore    = require('../services/document/DocumentStore');

exports.compareDocuments = async (req, res, next) => {
  try {
    const { documentAId, documentBId } = req.body;

    if (!documentAId || !documentBId) {
      return res.status(400).json({ error: 'documentAId and documentBId are required' });
    }
    if (documentAId === documentBId) {
      return res.status(400).json({ error: 'Cannot compare a document with itself' });
    }

    const service  = getAIService();
    const exists   = (id) => {
      try { if (typeof service.getDocument === 'function') { service.getDocument(id); return true; } }
      catch { return DocumentStore.has(id); }
      return DocumentStore.has(id);
    };

    if (!exists(documentAId)) return res.status(404).json({ error: `Document not found: ${documentAId}` });
    if (!exists(documentBId)) return res.status(404).json({ error: `Document not found: ${documentBId}` });

    res.json(await service.compareDocuments(documentAId, documentBId));
  } catch (err) { next(err); }
};
