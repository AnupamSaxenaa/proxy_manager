const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [rows] = await pool.query(
            'SELECT id, name, email, role, department_id, enrollment_no, phone, avatar, is_active FROM users WHERE id = ?',
            [decoded.id]
        );

        if (rows.length === 0 || !rows[0].is_active) {
            return res.status(401).json({ error: 'User not found or deactivated.' });
        }

        req.user = rows[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

module.exports = { authenticate, requireRole };
