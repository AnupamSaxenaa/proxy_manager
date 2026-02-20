const express = require('express');
const router = express.Router();
const { getEvents, createEvent, deleteEvent } = require('../controllers/calendarController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getEvents);
router.post('/', createEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
