const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');

// Memory storage — files never touch disk unnecessarily
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard limit
  fileFilter: (req, file, cb) => {
    const isPDF = file.mimetype === 'application/pdf' ||
                  file.mimetype === 'application/x-pdf' ||
                  (file.originalname || '').toLowerCase().endsWith('.pdf');
    const isTXT = file.mimetype === 'text/plain' ||
                  (file.originalname || '').toLowerCase().endsWith('.txt');

    if (isPDF || isTXT) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Please upload a PDF file.'), { status: 415 }), false);
    }
  },
});

// Handle multer errors gracefully
function handleUpload(req, res, next) {
  upload.single('document')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File exceeds the 10 MB limit.' });
      }
      return res.status(err.status || 400).json({ error: err.message || 'Upload failed.' });
    }
    next();
  });
}

// GET  /api/documents          — list available documents
router.get('/', documentController.listDocuments);

// GET  /api/documents/sample   — download sample agreement
router.get('/sample', documentController.downloadSample);

// POST /api/documents/demo     — load a demo document by ID
router.post('/demo', documentController.loadDemo);

// POST /api/documents/upload   — upload + process a PDF
router.post('/upload', handleUpload, documentController.uploadDocument);

// GET  /api/documents/:id      — get full document by ID
router.get('/:id', documentController.getDocument);

// GET  /api/documents/:id/sections — lightweight section list for nav
router.get('/:id/sections', documentController.getSections);

module.exports = router;
