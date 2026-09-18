const { getAIService } = require('../services/ai');
const DocumentStore = require('../services/document/DocumentStore');

exports.compareDocuments = async (req, res, next) => {
  try {
    const { documentAId, documentBId } = req.body;

    if (!documentAId || !documentBId) {
      return res.status(400).json({ error: 'documentAId and documentBId are required' });
    }
    if (documentAId === documentBId) {
      return res.status(400).json({ error: 'Cannot compare a document with itself' });
    }

    // Verify both exist (in either store)
    const service = getAIService();
    const hasDoc = (id) => {
      try {
        if (typeof service.getDocument === 'function') {
          service.getDocument(id);
          return true;
        }
      } catch (e) { /* fall through */ }
      return DocumentStore.has(id);
    };

    if (!hasDoc(documentAId)) {
      return res.status(404).json({ error: `Document not found: ${documentAId}` });
    }
    if (!hasDoc(documentBId)) {
      return res.status(404).json({ error: `Document not found: ${documentBId}` });
    }

    const result = await service.compareDocuments(documentAId, documentBId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
