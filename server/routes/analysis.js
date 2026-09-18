const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// POST /api/analysis/analyze — analyze a document by ID
router.post('/analyze', analysisController.analyzeDocument);

// POST /api/analysis/clauses — extract and classify clauses
router.post('/clauses', analysisController.extractClauses);

// POST /api/analysis/obligations — extract obligations
router.post('/obligations', analysisController.extractObligations);

// POST /api/analysis/timeline — extract timeline
router.post('/timeline', analysisController.extractTimeline);

module.exports = router;
