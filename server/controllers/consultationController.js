const { getAIService } = require('../services/ai');
const DocumentStore = require('../services/document/DocumentStore');

exports.generateBrief = async (req, res, next) => {
  try {
    const { documentId, concern } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }
    if (concern && typeof concern !== 'string') {
      return res.status(400).json({ error: 'concern must be a string' });
    }
    if (concern && concern.length > 1000) {
      return res.status(400).json({ error: 'concern is too long (max 1000 characters)' });
    }

    const sanitisedConcern = concern ? concern.trim() : null;
    const service = getAIService();

    // Ensure the document exists (uploaded or demo)
    let docExists = false;
    try {
      if (typeof service.getDocument === 'function') {
        service.getDocument(documentId);
        docExists = true;
      }
    } catch (e) {
      docExists = DocumentStore.has(documentId);
    }

    if (!docExists) {
      return res.status(404).json({ error: 'Document not found. Please re-upload your document.' });
    }

    const result = await service.generateConsultationBrief(documentId, sanitisedConcern);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
