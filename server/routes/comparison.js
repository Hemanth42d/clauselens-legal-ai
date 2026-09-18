const express = require('express');
const router = express.Router();
const comparisonController = require('../controllers/comparisonController');

// POST /api/comparison/compare — compare two documents
router.post('/compare', comparisonController.compareDocuments);

module.exports = router;
