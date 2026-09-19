const { getAIService } = require('../services/ai');
const DocumentStore    = require('../services/document/DocumentStore');

exports.generateBrief = async (req, res, next) => {
  try {
    const { documentId, concern } = req.body;

    if (!documentId) return res.status(400).json({ error: 'documentId is required' });
    if (concern !== undefined && typeof concern !== 'string') {
      return res.status(400).json({ error: 'concern must be a string' });
    }
    if (concern && concern.length > 1000) {
      return res.status(400).json({ error: 'concern exceeds 1000 characters' });
    }

    const service = getAIService();
    let docExists = false;
    try {
      if (typeof service.getDocument === 'function') { service.getDocument(documentId); docExists = true; }
    } catch { docExists = DocumentStore.has(documentId); }

    if (!docExists) {
      return res.status(404).json({ error: 'Document not found. Please re-upload your document.' });
    }

    res.json(await service.generateConsultationBrief(documentId, concern?.trim() || null));
  } catch (err) { next(err); }
};
