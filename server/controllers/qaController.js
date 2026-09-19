const { getAIService } = require('../services/ai');
const retrieval        = require('../services/retrieval/RetrievalService');
const DocumentStore    = require('../services/document/DocumentStore');

exports.askQuestion = async (req, res, next) => {
  try {
    const { question, documentId } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'A non-empty question is required' });
    }
    if (question.trim().length > 500) {
      return res.status(400).json({ error: 'Question exceeds 500 characters' });
    }
    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    const service = getAIService();

    // Resolve document for clause retrieval (RAG context).
    let doc = null;
    try {
      if (typeof service.getDocument === 'function') doc = service.getDocument(documentId);
    } catch { doc = DocumentStore.get(documentId); }

    if (!doc) {
      return res.status(404).json({ error: 'Document not found. Please re-upload your document.' });
    }

    const relevantClauses = retrieval.retrieve(question, doc.clauses || [], 5);
    res.json(await service.answerQuestion(question.trim(), documentId, relevantClauses));
  } catch (err) { next(err); }
};

exports.getSuggestedQuestions = async (req, res, next) => {
  try {
    const service   = getAIService();
    const questions = typeof service.getSuggestedQuestions === 'function'
      ? service.getSuggestedQuestions()
      : [];
    res.json({ questions });
  } catch (err) { next(err); }
};
