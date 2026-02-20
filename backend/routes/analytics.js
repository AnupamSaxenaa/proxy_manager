const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const {
    getOverview,
    getStudentAnalytics,
    getClassAnalytics,
    getAtRiskStudents,
    getFacultyDashboard,
} = require('../controllers/analyticsController');

const router = express.Router();

router.get('/overview', authenticate, requireRole('admin'), getOverview);
router.get('/student/:id', authenticate, getStudentAnalytics);
router.get('/class/:id', authenticate, getClassAnalytics);
router.get('/at-risk', authenticate, requireRole('faculty', 'admin'), getAtRiskStudents);
router.get('/faculty/dashboard', authenticate, requireRole('faculty'), getFacultyDashboard);

module.exports = router;
