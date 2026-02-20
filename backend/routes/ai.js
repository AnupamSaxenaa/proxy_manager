const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { handleChat } = require('../controllers/aiController');

const router = express.Router();

// Only students should be able to chat with Classiq Assist for now based on context
router.post('/chat', authenticate, requireRole('student'), handleChat);

module.exports = router;
