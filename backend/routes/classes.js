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
    deleteClass,
    clearClasses,
    deleteCourse,
    clearCourses,
    removeStudentFromClass,
    clearStudentsFromClass
} = require('../controllers/classesController');

const router = express.Router();

router.get('/sessions/today', authenticate, getTodaySessions);
router.get('/courses/all', authenticate, getAllCourses);
router.delete('/courses', authenticate, requireRole('admin'), clearCourses);
router.post('/courses', authenticate, requireRole('admin'), createCourse);
router.delete('/courses/:id', authenticate, requireRole('admin'), deleteCourse);
router.get('/', authenticate, listClasses);
router.post('/', authenticate, requireRole('admin', 'faculty'), createClass);
router.delete('/', authenticate, requireRole('admin'), clearClasses);
router.delete('/:id', authenticate, requireRole('admin'), deleteClass);
router.post('/:id/enroll', authenticate, requireRole('admin', 'faculty'), enrollStudents);
router.delete('/:id/students', authenticate, requireRole('admin'), clearStudentsFromClass);
router.delete('/:id/students/:studentId', authenticate, requireRole('admin'), removeStudentFromClass);
router.get('/:id/students', authenticate, getClassStudents);
router.get('/:id/sessions', authenticate, getSessionsByClass);
router.post('/:id/session', authenticate, requireRole('admin', 'faculty'), createSession);

module.exports = router;
