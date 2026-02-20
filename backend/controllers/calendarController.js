const { pool } = require('../config/db');

const getEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Fetch user's section and sub_section
        const [userRows] = await pool.query('SELECT section, sub_section FROM users WHERE id = ?', [userId]);
        const user = userRows[0];

        let classQuery = '';
        let classParams = [];

        if (userRole === 'student') {
            const section = user?.section || null;
            const subSection = user?.sub_section || null;

            // 1. Get calendar events
            query = `
                SELECT c.*, u.name as creator_name 
                FROM calendar_events c
                LEFT JOIN users u ON c.created_by = u.id
                WHERE c.created_by = ? 
                   OR (c.is_global = 1 AND (c.target_section IS NULL OR (c.target_section = ? AND (c.target_sub_section IS NULL OR c.target_sub_section = ?))))
            `;
            params = [userId, section, subSection];

            // 2. Get enrolled classes for Student
            classQuery = `
                SELECT 
                    cs.id, 
                    cs.session_date as event_date, 
                    c.course_name as title,
                    CONCAT('Room ', c.room_no, ' • ', c.start_time, ' - ', c.end_time) as description,
                    'class' as event_type,
                    1 as is_class,
                    c.start_time,
                    c.end_time
                FROM class_sessions cs
                JOIN classes c ON cs.class_id = c.id
                JOIN student_classes sc ON sc.class_id = c.id
                WHERE sc.student_id = ?
            `;
            classParams = [userId];

        } else {
            // For faculty/admin, show their created events AND all global events
            query = `
                SELECT c.*, u.name as creator_name 
                FROM calendar_events c
                LEFT JOIN users u ON c.created_by = u.id
                WHERE c.created_by = ? OR c.is_global = 1
            `;
            params = [userId];

            // For faculty, get classes they are teaching
            classQuery = `
                SELECT 
                    cs.id, 
                    cs.session_date as event_date, 
                    c.course_name as title,
                    CONCAT('Room ', c.room_no, ' • ', c.start_time, ' - ', c.end_time) as description,
                    'class' as event_type,
                    1 as is_class,
                    c.start_time,
                    c.end_time
                FROM class_sessions cs
                JOIN classes c ON cs.class_id = c.id
                WHERE c.faculty_id = ?
            `;
            classParams = [userId];
        }

        const [calEvents] = await pool.query(query, params);

        let classEvents = [];
        if (classQuery) {
            const [cEvents] = await pool.query(classQuery, classParams);
            classEvents = cEvents;
        }

        // Format dates correctly to avoid timezone shifting when sent to frontend
        const formatEvents = (evtArr) => evtArr.map(e => {
            let dateStr = e.event_date;
            if (e.event_date instanceof Date) {
                // Force extract exact local date components instead of using ISO strings which shift by timezone
                const year = e.event_date.getFullYear();
                const month = String(e.event_date.getMonth() + 1).padStart(2, '0');
                const day = String(e.event_date.getDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
            } else if (typeof e.event_date === 'string') {
                // If it's already a string, just take the date part
                dateStr = e.event_date.split('T')[0];
            }

            return {
                ...e,
                event_date: dateStr
            };
        });

        const unifiedEvents = [...formatEvents(calEvents), ...formatEvents(classEvents)].sort((a, b) => {
            const dateA = new Date(a.event_date);
            const dateB = new Date(b.event_date);
            return dateA - dateB;
        });

        res.json({ events: unifiedEvents });

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

        // To absolutely prevent timezone boundary shifting when MySQL saves a DATE type, 
        // we append 12:00 PM (Noon) to the string so even extreme offsets don't slide it into the previous/next day.
        const safeDateString = `${event_date} 12:00:00`;

        const [result] = await pool.query(
            `INSERT INTO calendar_events 
            (title, description, event_type, event_date, is_global, target_section, target_sub_section, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description || null, event_type || 'other', safeDateString, is_global ? 1 : 0, target_section || null, target_sub_section || null, userId]
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
