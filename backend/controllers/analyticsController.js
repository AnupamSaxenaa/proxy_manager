const { pool } = require('../config/db');

const getOverview = async (req, res) => {
    try {
        const [totalStudents] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = TRUE");
        const [totalFaculty] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'faculty' AND is_active = TRUE");
        const [totalCourses] = await pool.query("SELECT COUNT(*) as count FROM courses");
        const [totalClasses] = await pool.query("SELECT COUNT(*) as count FROM classes WHERE is_active = TRUE");

        const today = new Date().toISOString().split('T')[0];
        const [todayAttendance] = await pool.query(
            `SELECT
         COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present,
         COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent,
         COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late,
         COUNT(*) as total
        FROM attendance_records ar
        JOIN class_sessions cs ON ar.session_id = cs.id
        WHERE cs.session_date = ?`,
            [today]
        );

        const [deptStats] = await pool.query(
            `SELECT d.name as department, d.code,
              COUNT(DISTINCT u.id) as total_students,
              ROUND(AVG(CASE WHEN ar.status = 'present' THEN 100 ELSE 0 END), 1) as avg_attendance
       FROM departments d
       LEFT JOIN users u ON u.department_id = d.id AND u.role = 'student'
       LEFT JOIN student_classes sc ON sc.student_id = u.id
       LEFT JOIN class_sessions cs ON cs.class_id = sc.class_id
       LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = u.id
       GROUP BY d.id, d.name, d.code
       ORDER BY d.name`
        );

        res.json({
            stats: {
                total_students: totalStudents[0].count,
                total_faculty: totalFaculty[0].count,
                total_courses: totalCourses[0].count,
                total_classes: totalClasses[0].count,
            },
            today_attendance: todayAttendance[0],
            department_stats: deptStats,
        });
    } catch (error) {
        console.error('Analytics overview error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics.' });
    }
};

const getStudentAnalytics = async (req, res) => {
    try {
        const studentId = req.params.id === 'me' ? req.user.id : req.params.id;

        const [overall] = await pool.query(
            `SELECT
         COUNT(cs.id) as total_classes,
         COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present,
         COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late,
         (COUNT(cs.id) - COUNT(CASE WHEN ar.status IN ('present', 'late', 'excused') THEN 1 END)) as absent,
         ROUND(COUNT(CASE WHEN ar.status = 'present' OR ar.status = 'late' THEN 1 END) * 100.0 / NULLIF(COUNT(cs.id), 0), 1) as percentage
        FROM student_classes sc
        JOIN class_sessions cs ON sc.class_id = cs.class_id
        LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = sc.student_id
        WHERE sc.student_id = ?`,
            [studentId]
        );

        const [courseWise] = await pool.query(
            `SELECT co.name as course_name, co.code as course_code,
              COUNT(cs.id) as total_sessions,
              COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present,
              ROUND(COUNT(CASE WHEN ar.status = 'present' OR ar.status = 'late' THEN 1 END) * 100.0 / NULLIF(COUNT(cs.id), 0), 1) as percentage
       FROM student_classes sc
       JOIN classes c ON sc.class_id = c.id
       JOIN courses co ON c.course_id = co.id
       LEFT JOIN class_sessions cs ON cs.class_id = c.id
       LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = sc.student_id
       WHERE sc.student_id = ?
       GROUP BY co.id, co.name, co.code
       ORDER BY percentage ASC`,
            [studentId]
        );

        const [weeklyTrend] = await pool.query(
            `SELECT
         YEARWEEK(cs.session_date, 1) as week,
         MIN(cs.session_date) as week_start,
         COUNT(cs.id) as total,
         COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present,
         ROUND(COUNT(CASE WHEN ar.status = 'present' OR ar.status = 'late' THEN 1 END) * 100.0 / NULLIF(COUNT(cs.id), 0), 1) as percentage
        FROM student_classes sc
        JOIN class_sessions cs ON sc.class_id = cs.class_id
        LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = sc.student_id
        WHERE sc.student_id = ?
        GROUP BY YEARWEEK(cs.session_date, 1)
        ORDER BY week DESC
        LIMIT 8`,
            [studentId]
        );

        res.json({
            overall: overall[0],
            course_wise: courseWise,
            weekly_trend: weeklyTrend.reverse(),
        });
    } catch (error) {
        console.error('Student analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch student analytics.' });
    }
};

const getClassAnalytics = async (req, res) => {
    try {
        const [sessions] = await pool.query(
            `SELECT cs.id, cs.session_date, cs.topic,
              COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present,
              COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent,
              COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late,
              COUNT(*) as total
       FROM class_sessions cs
       LEFT JOIN attendance_records ar ON ar.session_id = cs.id
       WHERE cs.class_id = ?
       GROUP BY cs.id, cs.session_date, cs.topic
       ORDER BY cs.session_date DESC`,
            [req.params.id]
        );

        const [students] = await pool.query(
            `SELECT u.id, u.name, u.enrollment_no,
              COUNT(*) as total_sessions,
              COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present,
              ROUND(COUNT(CASE WHEN ar.status = 'present' OR ar.status = 'late' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as percentage
       FROM users u
       JOIN student_classes sc ON sc.student_id = u.id
       LEFT JOIN class_sessions cs ON cs.class_id = sc.class_id
       LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = u.id
       WHERE sc.class_id = ?
       GROUP BY u.id, u.name, u.enrollment_no
       ORDER BY percentage ASC`,
            [req.params.id]
        );

        res.json({ sessions, students });
    } catch (error) {
        console.error('Class analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch class analytics.' });
    }
};

const getAtRiskStudents = async (req, res) => {
    try {
        const threshold = req.query.threshold || 75;

        const [students] = await pool.query(
            `SELECT u.id, u.name, u.email, u.enrollment_no, d.name as department_name,
              COUNT(*) as total_sessions,
              COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present,
              ROUND(COUNT(CASE WHEN ar.status = 'present' OR ar.status = 'late' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as percentage
       FROM users u
       JOIN attendance_records ar ON ar.student_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.role = 'student' AND u.is_active = TRUE
       GROUP BY u.id, u.name, u.email, u.enrollment_no, d.name
       HAVING percentage < ?
       ORDER BY percentage ASC`,
            [threshold]
        );

        res.json({ students, threshold });
    } catch (error) {
        console.error('At-risk analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch at-risk students.' });
    }
};

const getFacultyDashboard = async (req, res) => {
    try {
        const facultyId = req.user.id;

        const [classes] = await pool.query(
            `SELECT c.id, co.name as course_name, co.code as course_code, c.section,
              c.day_of_week, c.start_time, c.end_time, c.room_no,
              (SELECT COUNT(*) FROM student_classes WHERE class_id = c.id) as student_count
       FROM classes c
       JOIN courses co ON c.course_id = co.id
       WHERE c.faculty_id = ? AND c.is_active = TRUE
       ORDER BY FIELD(c.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), c.start_time`,
            [facultyId]
        );

        const today = new Date().toISOString().split('T')[0];

        const [todaySessions] = await pool.query(
            `SELECT cs.id as session_id, cs.session_date, cs.status, cs.topic,
              c.id as class_id, co.name as course_name, co.code as course_code,
              c.start_time, c.end_time, c.room_no, c.section,
              (SELECT COUNT(CASE WHEN ar.status = 'present' THEN 1 END) FROM attendance_records ar WHERE ar.session_id = cs.id) as present_count,
              (SELECT COUNT(*) FROM student_classes WHERE class_id = c.id) as total_students
       FROM class_sessions cs
       JOIN classes c ON cs.class_id = c.id
       JOIN courses co ON c.course_id = co.id
       WHERE c.faculty_id = ? AND cs.session_date = ?
       ORDER BY c.start_time`,
            [facultyId, today]
        );

        res.json({ classes, today_sessions: todaySessions });
    } catch (error) {
        console.error('Faculty dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
};

module.exports = {
    getOverview,
    getStudentAnalytics,
    getClassAnalytics,
    getAtRiskStudents,
    getFacultyDashboard,
};
