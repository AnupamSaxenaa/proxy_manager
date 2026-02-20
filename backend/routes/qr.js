const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { generateQR, validateQR, getActiveQR } = require('../controllers/qrController');

const router = express.Router();

router.post('/generate', authenticate, requireRole('faculty', 'admin'), generateQR);
router.post('/validate', authenticate, validateQR);
router.get('/active/:sessionId', authenticate, requireRole('faculty', 'admin'), getActiveQR);

module.exports = router;
