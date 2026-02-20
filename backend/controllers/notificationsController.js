const { pool } = require('../config/db');

const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [notifications] = await pool.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [req.user.id, parseInt(limit), parseInt(offset)]
        );

        const [unreadCount] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [req.user.id]
        );

        res.json({ notifications, unread_count: unreadCount[0].count });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
};

const markAsRead = async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Notification marked as read.' });
    } catch (error) {
        console.error('Read notification error:', error);
        res.status(500).json({ error: 'Failed to update notification.' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [req.user.id]
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        console.error('Read all notifications error:', error);
        res.status(500).json({ error: 'Failed to update notifications.' });
    }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
