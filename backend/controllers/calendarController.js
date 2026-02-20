const { pool } = require('../config/db');

const getEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Fetch user's section and sub_section
        const [userRows] = await pool.query('SELECT section, sub_section FROM users WHERE id = ?', [userId]);
        const user = userRows[0];

        let query = '';
        let params = [];

        if (userRole === 'student') {
            const section = user?.section || null;
            const subSection = user?.sub_section || null;
            // Get personal events or global events targeting their section (or all sections if target_section is NULL)
            query = `
                SELECT c.*, u.name as creator_name 
                FROM calendar_events c
                LEFT JOIN users u ON c.created_by = u.id
                WHERE c.created_by = ? 
                   OR (c.is_global = 1 AND (c.target_section IS NULL OR (c.target_section = ? AND (c.target_sub_section IS NULL OR c.target_sub_section = ?))))
                ORDER BY c.event_date ASC
            `;
            params = [userId, section, subSection];
        } else {
            // For faculty/admin, show their created events AND all global events
            query = `
                SELECT c.*, u.name as creator_name 
                FROM calendar_events c
                LEFT JOIN users u ON c.created_by = u.id
                WHERE c.created_by = ? OR c.is_global = 1
                ORDER BY c.event_date ASC
            `;
            params = [userId];
        }

        const [events] = await pool.query(query, params);
        res.json({ events });

    } catch (error) {
        console.error('Get calendar events error:', error);
        res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
};

const createEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        let { title, description, event_type, event_date, is_global, target_section, target_sub_section } = req.body;

        if (!title || !event_date) {
            return res.status(400).json({ error: 'Title and event date are required' });
        }

        // Only faculty and admin can create global events
        if (userRole === 'student') {
            is_global = 0;
            target_section = null;
            target_sub_section = null;
        }

        const [result] = await pool.query(
            `INSERT INTO calendar_events 
            (title, description, event_type, event_date, is_global, target_section, target_sub_section, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description || null, event_type || 'other', event_date, is_global ? 1 : 0, target_section || null, target_sub_section || null, userId]
        );

        res.status(201).json({ message: 'Event created successfully', eventId: result.insertId });

    } catch (error) {
        console.error('Create calendar event error:', error);
        res.status(500).json({ error: 'Failed to create calendar event' });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const eventId = req.params.id;

        // Check if event exists and user has permission
        const [events] = await pool.query('SELECT created_by FROM calendar_events WHERE id = ?', [eventId]);
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (events[0].created_by !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this event' });
        }

        await pool.query('DELETE FROM calendar_events WHERE id = ?', [eventId]);
        res.json({ message: 'Event deleted successfully' });

    } catch (error) {
        console.error('Delete calendar event error:', error);
        res.status(500).json({ error: 'Failed to delete calendar event' });
    }
};

module.exports = {
    getEvents,
    createEvent,
    deleteEvent
};
