const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');

// POST /api/consultation/brief — generate consultation brief
router.post('/brief', consultationController.generateBrief);

module.exports = router;
