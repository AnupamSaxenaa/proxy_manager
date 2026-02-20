const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const register = async (req, res) => {
    try {
        const { name, email, password, role, department_id, enrollment_no, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        if (enrollment_no) {
            const [existingEnroll] = await pool.query('SELECT id FROM users WHERE enrollment_no = ?', [enrollment_no]);
            if (existingEnroll.length > 0) {
                return res.status(409).json({ error: 'Enrollment number already registered.' });
            }
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            `INSERT INTO users (name, email, password, role, department_id, enrollment_no, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, role || 'student', department_id || null, enrollment_no || null, phone || null]
        );

        const token = jwt.sign(
            { id: result.insertId, role: role || 'student' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        const [user] = await pool.query(
            'SELECT id, name, email, role, department_id, enrollment_no, phone, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            message: 'Registration successful!',
            token,
            user: user[0],
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account has been deactivated. Contact admin.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful!',
            token,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};

const getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.department_id, u.enrollment_no, u.phone, u.avatar, u.created_at,
              d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
};

module.exports = { register, login, getMe };
