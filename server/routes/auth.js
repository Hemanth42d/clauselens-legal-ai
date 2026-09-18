const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/authController');
const authenticate = require('../middleware/auth');

// Public
router.post('/register', controller.register);
router.post('/login',    controller.login);
router.post('/logout',   controller.logout);

// Protected — requires valid JWT
router.get('/me', authenticate, controller.me);

module.exports = router;
