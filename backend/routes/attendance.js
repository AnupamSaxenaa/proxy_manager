const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const {
    markAttendance,
    markBulkAttendance,
    getSessionAttendance,
    getStudentAttendance,
    updateAttendance,
} = require('../controllers/attendanceController');

const router = express.Router();

router.post('/mark', authenticate, markAttendance);
router.post('/mark-bulk', authenticate, requireRole('faculty', 'admin'), markBulkAttendance);
router.get('/session/:sessionId', authenticate, getSessionAttendance);
router.get('/student/:studentId', authenticate, getStudentAttendance);
router.put('/:id', authenticate, requireRole('faculty', 'admin'), updateAttendance);

module.exports = router;
