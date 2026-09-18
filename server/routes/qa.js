const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qaController');

// POST /api/qa/ask — ask a question about a document
router.post('/ask', qaController.askQuestion);

// GET /api/qa/suggested — get suggested questions
router.get('/suggested', qaController.getSuggestedQuestions);

module.exports = router;
