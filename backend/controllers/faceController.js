const { pool } = require('../config/db');

const registerFace = async (req, res) => {
    try {
        const userId = req.user.id;
        const { embeddings } = req.body;

        if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
            return res.status(400).json({ error: 'At least one face embedding is required.' });
        }

        if (embeddings.length < 3) {
            return res.status(400).json({ error: 'Please provide at least 3 face captures for accuracy.' });
        }

        if (embeddings.length > 10) {
            return res.status(400).json({ error: 'Maximum 10 face captures allowed.' });
        }

        for (const emb of embeddings) {
            if (!emb.descriptor || !Array.isArray(emb.descriptor) || emb.descriptor.length !== 128) {
                return res.status(400).json({ error: 'Each embedding must have a 128-dimensional descriptor.' });
            }
        }

        await pool.query('DELETE FROM face_embeddings WHERE user_id = ?', [userId]);

        for (let i = 0; i < embeddings.length; i++) {
            const emb = embeddings[i];
            await pool.query(
                `INSERT INTO face_embeddings (user_id, embedding, photo_data, label, is_primary)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    userId,
                    JSON.stringify(emb.descriptor),
                    emb.photo || null,
                    emb.label || `capture_${i + 1}`,
                    i === 0,
                ]
            );
        }

        res.json({
            message: 'Face registered successfully!',
            count: embeddings.length,
        });
    } catch (error) {
        console.error('Face register error:', error);
        res.status(500).json({ error: 'Failed to register face.' });
    }
};

const getFaceStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM face_embeddings WHERE user_id = ?',
            [userId]
        );

        const registered = rows[0].count > 0;

        res.json({
            registered,
            count: rows[0].count,
            message: registered
                ? `Face registered with ${rows[0].count} captures.`
                : 'Face not registered yet.',
        });
    } catch (error) {
        console.error('Face status error:', error);
        res.status(500).json({ error: 'Failed to check face status.' });
    }
};

const verifyFace = async (req, res) => {
    try {
        const userId = req.user.id;
        const { descriptor, session_id, liveness_passed, scan_photo } = req.body;

        if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
            return res.status(400).json({ error: 'Valid 128-dimensional face descriptor is required.' });
        }

        if (!session_id) {
            return res.status(400).json({ error: 'Session ID is required.' });
        }

        if (!liveness_passed) {
            await pool.query(
                `INSERT INTO face_scan_logs (user_id, session_id, match_score, liveness_passed, result, ip_address, device_info, scan_photo)
                 VALUES (?, ?, 0, FALSE, 'liveness_fail', ?, ?, ?)`,
                [userId, session_id, req.ip, req.headers['user-agent'], scan_photo || null]
            );
            return res.status(403).json({ error: 'Liveness check failed. Please blink when prompted.' });
        }

        const [window] = await pool.query(
            `SELECT * FROM attendance_windows
             WHERE session_id = ? AND is_active = TRUE
             AND (closes_at IS NULL OR closes_at > NOW())`,
            [session_id]
        );

        if (window.length === 0) {
            return res.status(410).json({ error: 'Attendance window is closed.' });
        }

        const activeWindow = window[0];
        if (activeWindow.method === 'qr') {
            return res.status(400).json({ error: 'This session only accepts QR-based attendance.' });
        }

        const [session] = await pool.query(
            'SELECT cs.*, c.id as class_id FROM class_sessions cs JOIN classes c ON cs.class_id = c.id WHERE cs.id = ?',
            [session_id]
        );

        if (session.length === 0) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        const [enrollment] = await pool.query(
            'SELECT * FROM student_classes WHERE student_id = ? AND class_id = ?',
            [userId, session[0].class_id]
        );

        if (enrollment.length === 0) {
            return res.status(403).json({ error: 'You are not enrolled in this class.' });
        }

        const [storedEmbeddings] = await pool.query(
            'SELECT embedding FROM face_embeddings WHERE user_id = ?',
            [userId]
        );

        if (storedEmbeddings.length === 0) {
            return res.status(400).json({ error: 'Face not registered. Please register your face first.' });
        }

        let bestScore = 0;

        for (const row of storedEmbeddings) {
            const stored = typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding;
            const distance = euclideanDistance(descriptor, stored);
            const score = Math.max(0, 1 - distance / 2);
            if (score > bestScore) bestScore = score;
        }

        const matchThreshold = 0.6;
        const matched = bestScore >= matchThreshold;

        await pool.query(
            `INSERT INTO face_scan_logs (user_id, session_id, match_score, liveness_passed, result, ip_address, device_info, scan_photo)
             VALUES (?, ?, ?, TRUE, ?, ?, ?, ?)`,
            [
                userId, session_id, bestScore,
                matched ? 'success' : 'no_match',
                req.ip, req.headers['user-agent'],
                scan_photo || null,
            ]
        );

        if (!matched) {
            return res.status(403).json({
                error: 'Face does not match registered profile.',
                score: Math.round(bestScore * 100),
            });
        }

        await pool.query(
            `INSERT INTO attendance_records (session_id, student_id, status, marked_by, ip_address, device_info)
             VALUES (?, ?, 'present', 'facial', ?, ?)
             ON DUPLICATE KEY UPDATE status = 'present', marked_by = 'facial', marked_at = CURRENT_TIMESTAMP`,
            [session_id, userId, req.ip, req.headers['user-agent']]
        );

        res.json({
            message: 'Attendance marked successfully via face recognition!',
            score: Math.round(bestScore * 100),
            session_id,
        });
    } catch (error) {
        console.error('Face verify error:', error);
        res.status(500).json({ error: 'Failed to verify face.' });
    }
};

const resetFace = async (req, res) => {
    try {
        const targetUserId = req.params.userId || req.user.id;

        if (req.params.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can reset other users\' face data.' });
        }

        await pool.query('DELETE FROM face_embeddings WHERE user_id = ?', [targetUserId]);

        res.json({ message: 'Face data reset successfully.' });
    } catch (error) {
        console.error('Face reset error:', error);
        res.status(500).json({ error: 'Failed to reset face data.' });
    }
};

function euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
}

module.exports = { registerFace, getFaceStatus, verifyFace, resetFace };
