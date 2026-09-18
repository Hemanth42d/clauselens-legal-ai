const { getAIService } = require('../services/ai');
const retrieval = require('../services/retrieval/RetrievalService');
const DocumentStore = require('../services/document/DocumentStore');

exports.askQuestion = async (req, res, next) => {
  try {
    const { question, documentId } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'A non-empty question is required' });
    }
    if (question.trim().length > 500) {
      return res.status(400).json({ error: 'Question is too long (max 500 characters)' });
    }
    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    const service = getAIService();

    // Retrieve relevant clauses — look in service store then DocumentStore
    let relevantClauses = [];
    let doc = null;
    try {
      if (typeof service.getDocument === 'function') {
        doc = service.getDocument(documentId);
      }
    } catch (e) {
      doc = DocumentStore.get(documentId);
    }

    if (doc && doc.clauses) {
      relevantClauses = retrieval.retrieve(question, doc.clauses, 5);
    }

    const result = await service.answerQuestion(question.trim(), documentId, relevantClauses);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getSuggestedQuestions = async (req, res, next) => {
  try {
    const service = getAIService();
    const questions = typeof service.getSuggestedQuestions === 'function'
      ? service.getSuggestedQuestions()
      : [];
    res.json({ questions });
  } catch (err) {
    next(err);
  }
};
