const crypto = require('crypto');
const QRCode = require('qrcode');
const { pool } = require('../config/db');

const generateQR = async (req, res) => {
    try {
        const { session_id, expiry_seconds = 60 } = req.body;

        if (!session_id) {
            return res.status(400).json({ error: 'Session ID is required.' });
        }

        await pool.query(
            'UPDATE qr_sessions SET is_active = FALSE WHERE session_id = ?',
            [session_id]
        );

        const qrToken = crypto.randomBytes(32).toString('hex');

        const [result] = await pool.query(
            'INSERT INTO qr_sessions (session_id, qr_token, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))',
            [session_id, qrToken, expiry_seconds]
        );

        const [newSession] = await pool.query(
            'SELECT expires_at FROM qr_sessions WHERE id = ?',
            [result.insertId]
        );

        // Standardize returning ISO string with Z
        let dbExpiresAt = newSession[0].expires_at;
        if (typeof dbExpiresAt === 'string' && !dbExpiresAt.endsWith('Z')) {
            dbExpiresAt = dbExpiresAt.replace(' ', 'T') + 'Z';
        }

        const qrData = JSON.stringify({
            token: qrToken,
            session_id: session_id,
            expires_at: dbExpiresAt,
        });

        const qrImageUrl = await QRCode.toDataURL(qrData, {
            width: 400,
            margin: 2,
            color: {
                dark: '#1a1a2e',
                light: '#ffffff',
            },
        });

        res.json({
            qr_id: result.insertId,
            qr_image: qrImageUrl,
            qr_token: qrToken,
            expires_at: dbExpiresAt,
            expiry_seconds,
        });
    } catch (error) {
        console.error('QR generate error:', error);
        res.status(500).json({ error: 'Failed to generate QR code.' });
    }
};

const validateQR = async (req, res) => {
    try {
        const { qr_token } = req.body;

        if (!qr_token) {
            return res.status(400).json({ error: 'QR token is required.' });
        }

        const [qrSessions] = await pool.query(
            'SELECT *, (expires_at < UTC_TIMESTAMP()) AS is_expired FROM qr_sessions WHERE qr_token = ? AND is_active = TRUE',
            [qr_token]
        );

        if (qrSessions.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired QR code.' });
        }

        const qrSession = qrSessions[0];

        if (qrSession.is_expired) {
            await pool.query('UPDATE qr_sessions SET is_active = FALSE WHERE id = ?', [qrSession.id]);
            return res.status(410).json({ error: 'QR code has expired. Please scan a new one.' });
        }

        const [session] = await pool.query(
            'SELECT cs.*, c.id as class_id FROM class_sessions cs JOIN classes c ON cs.class_id = c.id WHERE cs.id = ?',
            [qrSession.session_id]
        );

        if (session.length === 0) {
            return res.status(404).json({ error: 'Class session not found.' });
        }

        const [enrollment] = await pool.query(
            'SELECT * FROM student_classes WHERE student_id = ? AND class_id = ?',
            [req.user.id, session[0].class_id]
        );

        if (enrollment.length === 0) {
            return res.status(403).json({ error: 'You are not enrolled in this class.' });
        }

        await pool.query(
            `INSERT INTO attendance_records (session_id, student_id, status, marked_by, ip_address, device_info)
       VALUES (?, ?, 'present', 'qr', ?, ?)
       ON DUPLICATE KEY UPDATE status = 'present', marked_by = 'qr', marked_at = CURRENT_TIMESTAMP`,
            [qrSession.session_id, req.user.id, req.ip, req.headers['user-agent']]
        );

        res.json({
            message: 'Attendance marked successfully via QR code!',
            session_id: qrSession.session_id,
        });
    } catch (error) {
        console.error('QR validate error:', error);
        res.status(500).json({ error: 'Failed to validate QR code.' });
    }
};

const getActiveQR = async (req, res) => {
    try {
        const [qrSessions] = await pool.query(
            'SELECT * FROM qr_sessions WHERE session_id = ? AND is_active = TRUE AND expires_at > UTC_TIMESTAMP() ORDER BY created_at DESC LIMIT 1',
            [req.params.sessionId]
        );

        if (qrSessions.length === 0) {
            return res.json({ active: false });
        }

        res.json({ active: true, qr_session: qrSessions[0] });
    } catch (error) {
        console.error('Get active QR error:', error);
        res.status(500).json({ error: 'Failed to fetch QR status.' });
    }
};

module.exports = { generateQR, validateQR, getActiveQR };
