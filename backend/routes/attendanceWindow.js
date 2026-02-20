const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { openWindow, closeWindow, getWindowStatus } = require('../controllers/windowController');

const router = express.Router();

router.post('/open', authenticate, requireRole('faculty', 'admin'), openWindow);
router.post('/close', authenticate, requireRole('faculty', 'admin'), closeWindow);
router.get('/status/:sessionId', authenticate, getWindowStatus);

module.exports = router;
