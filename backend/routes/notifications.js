const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationsController');

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markAsRead);
router.put('/read-all', authenticate, markAllAsRead);

module.exports = router;
