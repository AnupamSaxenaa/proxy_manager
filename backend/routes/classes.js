const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const {
    listClasses,
    createClass,
    enrollStudents,
    getClassStudents,
    getAllCourses,
    createCourse,
    createSession,
    getTodaySessions,
    getSessionsByClass,
} = require('../controllers/classesController');

const router = express.Router();

router.get('/sessions/today', authenticate, getTodaySessions);
router.get('/courses/all', authenticate, getAllCourses);
router.post('/courses', authenticate, requireRole('admin'), createCourse);
router.get('/', authenticate, listClasses);
router.post('/', authenticate, requireRole('admin', 'faculty'), createClass);
router.post('/:id/enroll', authenticate, requireRole('admin', 'faculty'), enrollStudents);
router.get('/:id/students', authenticate, getClassStudents);
router.get('/:id/sessions', authenticate, getSessionsByClass);
router.post('/:id/session', authenticate, requireRole('admin', 'faculty'), createSession);

module.exports = router;
