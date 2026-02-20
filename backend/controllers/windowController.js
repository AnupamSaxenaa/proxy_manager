const { pool } = require('../config/db');

const openWindow = async (req, res) => {
    try {
        const { session_id, method = 'face', duration_minutes, allowed_network } = req.body;

        if (!session_id) {
            return res.status(400).json({ error: 'session id required : ' });
        }

        const [session] = await pool.query(
            `SELECT cs.*, c.faculty_id FROM class_sessions cs
             JOIN classes c ON cs.class_id = c.id
             WHERE cs.id = ?`,
            [session_id]
        );

        if (session.length === 0) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        if (req.user.role === 'faculty' && session[0].faculty_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only open windows for your own sessions.' });
        }

        await pool.query(
            'UPDATE attendance_windows SET is_active = FALSE WHERE session_id = ? AND is_active = TRUE',
            [session_id]
        );

        const durationVal = duration_minutes && duration_minutes > 0 ? duration_minutes : null;

        const [result] = await pool.query(
            `INSERT INTO attendance_windows (session_id, opened_by, method, opens_at, closes_at, is_active, allowed_network)
             VALUES (?, ?, ?, UTC_TIMESTAMP(), IF(? IS NOT NULL, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), NULL), TRUE, ?)`,
            [session_id, req.user.id, method, durationVal, durationVal, allowed_network || null]
        );

        // Fetch back the created row to return the correct DB computed timestamps
        const [newWindow] = await pool.query(
            'SELECT opens_at, closes_at FROM attendance_windows WHERE id = ?',
            [result.insertId]
        );

        const formatUTC = (val) => {
            if (!val) return null;
            return typeof val === 'string' && !val.endsWith('Z') ? val.replace(' ', 'T') + 'Z' : val;
        };

        res.json({
            message: 'Attendance window opened!',
            window_id: result.insertId,
            method,
            opens_at: formatUTC(newWindow[0].opens_at),
            closes_at: formatUTC(newWindow[0].closes_at),
            duration_minutes: duration_minutes || 'manual',
        });
    } catch (error) {
        console.error('Open window error:', error);
        res.status(500).json({ error: 'Failed to open attendance window.' });
    }
};

const closeWindow = async (req, res) => {
    try {
        const { session_id } = req.body;

        if (!session_id) {
            return res.status(400).json({ error: 'Session ID is required.' });
        }

        const [updated] = await pool.query(
            `UPDATE attendance_windows
             SET is_active = FALSE, closes_at = UTC_TIMESTAMP()
             WHERE session_id = ? AND is_active = TRUE`,
            [session_id]
        );

        if (updated.affectedRows === 0) {
            return res.status(404).json({ error: 'No active window found for this session.' });
        }

        res.json({ message: 'Attendance window closed.' });
    } catch (error) {
        console.error('Close window error:', error);
        res.status(500).json({ error: 'Failed to close attendance window.' });
    }
};

const getWindowStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const [windows] = await pool.query(
            `SELECT aw.*, u.name as opened_by_name
             FROM attendance_windows aw
             JOIN users u ON aw.opened_by = u.id
             WHERE aw.session_id = ? AND aw.is_active = TRUE
             AND (aw.closes_at IS NULL OR aw.closes_at > UTC_TIMESTAMP())
             ORDER BY aw.created_at DESC LIMIT 1`,
            [sessionId]
        );

        if (windows.length === 0) {
            return res.json({ active: false, message: 'No active attendance window.' });
        }

        const window = windows[0];

        const [attendanceCount] = await pool.query(
            `SELECT COUNT(*) as marked FROM attendance_records WHERE session_id = ?`,
            [sessionId]
        );

        const [session] = await pool.query(
            `SELECT c.id as class_id FROM class_sessions cs JOIN classes c ON cs.class_id = c.id WHERE cs.id = ?`,
            [sessionId]
        );

        let totalStudents = 0;
        if (session.length > 0) {
            const [count] = await pool.query(
                'SELECT COUNT(*) as total FROM student_classes WHERE class_id = ?',
                [session[0].class_id]
            );
            totalStudents = count[0].total;
        }

        const formatUTC = (val) => {
            if (!val) return null;
            return typeof val === 'string' && !val.endsWith('Z') ? val.replace(' ', 'T') + 'Z' : val;
        };

        res.json({
            active: true,
            window: {
                id: window.id,
                method: window.method,
                opens_at: formatUTC(window.opens_at),
                closes_at: formatUTC(window.closes_at),
                allowed_network: window.allowed_network,
                opened_by: window.opened_by_name,
            },
            marked: attendanceCount[0].marked,
            total_students: totalStudents,
        });
    } catch (error) {
        console.error('Window status error:', error);
        res.status(500).json({ error: 'Failed to get window status.' });
    }
};

module.exports = { openWindow, closeWindow, getWindowStatus };
