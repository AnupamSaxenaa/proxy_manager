const { pool } = require('../config/db');

const markAttendance = async (req, res) => {
    try {
        const { session_id, student_id, status, marked_by } = req.body;

        if (!session_id) {
            return res.status(400).json({ error: 'Session ID is required.' });
        }

        const sId = student_id || req.user.id;
        const method = marked_by || 'manual';

        const [session] = await pool.query(
            'SELECT * FROM class_sessions WHERE id = ? AND status IN ("ongoing", "scheduled")',
            [session_id]
        );

        if (session.length === 0) {
            return res.status(404).json({ error: 'Session not found or already completed.' });
        }

        await pool.query(
            `INSERT INTO attendance_records (session_id, student_id, status, marked_by, ip_address, device_info)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by), marked_at = CURRENT_TIMESTAMP`,
            [session_id, sId, status || 'present', method, req.ip, req.headers['user-agent']]
        );

        res.json({ message: 'Attendance marked successfully.' });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ error: 'Failed to mark attendance.' });
    }
};

const markBulkAttendance = async (req, res) => {
    try {
        const { session_id, records } = req.body;

        if (!session_id || !records || !Array.isArray(records)) {
            return res.status(400).json({ error: 'Session ID and records array are required.' });
        }

        for (const record of records) {
            await pool.query(
                `INSERT INTO attendance_records (session_id, student_id, status, marked_by)
         VALUES (?, ?, ?, 'manual')
         ON DUPLICATE KEY UPDATE 
            marked_by = IF(status != VALUES(status), VALUES(marked_by), marked_by),
            marked_at = IF(status != VALUES(status), CURRENT_TIMESTAMP, marked_at),
            status = VALUES(status)`,
                [session_id, record.student_id, record.status || 'present']
            );
        }

        res.json({ message: `Attendance marked for ${records.length} students.` });
    } catch (error) {
        console.error('Bulk mark error:', error);
        res.status(500).json({ error: 'Failed to mark attendance.' });
    }
};

const getSessionAttendance = async (req, res) => {
    try {
        const [records] = await pool.query(
            `SELECT ar.*, u.name as student_name, u.enrollment_no
       FROM attendance_records ar
       JOIN users u ON ar.student_id = u.id
       WHERE ar.session_id = ?
       ORDER BY u.name`,
            [req.params.sessionId]
        );

        res.json({ records });
    } catch (error) {
        console.error('Get session attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance.' });
    }
};

const getStudentAttendance = async (req, res) => {
    try {
        const studentId = req.params.studentId === 'me' ? req.user.id : req.params.studentId;

        const [records] = await pool.query(
            `SELECT ar.*, cs.session_date, cs.topic, c.room_no, c.day_of_week,
              co.name as course_name, co.code as course_code,
              u.name as faculty_name
       FROM attendance_records ar
       JOIN class_sessions cs ON ar.session_id = cs.id
       JOIN classes c ON cs.class_id = c.id
       JOIN courses co ON c.course_id = co.id
       JOIN users u ON c.faculty_id = u.id
       WHERE ar.student_id = ?
       ORDER BY cs.session_date DESC`,
            [studentId]
        );

        res.json({ records });
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance.' });
    }
};

const updateAttendance = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required.' });
        }

        await pool.query(
            'UPDATE attendance_records SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        res.json({ message: 'Attendance updated.' });
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({ error: 'Failed to update attendance.' });
    }
};

module.exports = {
    markAttendance,
    markBulkAttendance,
    getSessionAttendance,
    getStudentAttendance,
    updateAttendance,
};
