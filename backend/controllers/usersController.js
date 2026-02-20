const { pool } = require('../config/db');

const listUsers = async (req, res) => {
    try {
        const { role, department_id, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT u.id, u.name, u.email, u.role, u.enrollment_no, u.phone, u.is_active, u.created_at,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
        const params = [];

        if (role) {
            query += ' AND u.role = ?';
            params.push(role);
        }
        if (department_id) {
            query += ' AND u.department_id = ?';
            params.push(department_id);
        }
        if (search) {
            query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.enrollment_no LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await pool.query(query, params);

        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const countParams = [];
        if (role) { countQuery += ' AND role = ?'; countParams.push(role); }
        if (department_id) { countQuery += ' AND department_id = ?'; countParams.push(department_id); }

        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit),
            },
        });
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

const getUserById = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.department_id, u.enrollment_no, u.phone, u.avatar, u.is_active, u.created_at,
              d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user.' });
    }
};

const updateUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        const { name, phone, department_id } = req.body;

        await pool.query(
            'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), department_id = COALESCE(?, department_id) WHERE id = ?',
            [name, phone, department_id, req.params.id]
        );

        res.json({ message: 'User updated successfully.' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user.' });
    }
};

const deactivateUser = async (req, res) => {
    try {
        await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deactivated successfully.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to deactivate user.' });
    }
};

const activateUser = async (req, res) => {
    try {
        await pool.query('UPDATE users SET is_active = TRUE WHERE id = ?', [req.params.id]);
        res.json({ message: 'User activated successfully.' });
    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({ error: 'Failed to activate user.' });
    }
};

const getAllDepartments = async (req, res) => {
    try {
        const [departments] = await pool.query('SELECT * FROM departments ORDER BY name');
        res.json({ departments });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Failed to fetch departments.' });
    }
};

module.exports = { listUsers, getUserById, updateUser, deactivateUser, activateUser, getAllDepartments };
