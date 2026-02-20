const { pool } = require('../config/db');

const listClasses = async (req, res) => {
    try {
        let query = `
      SELECT c.*, co.name as course_name, co.code as course_code,
             u.name as faculty_name, d.name as department_name
      FROM classes c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.faculty_id = u.id
      JOIN departments d ON co.department_id = d.id
      WHERE c.is_active = TRUE
    `;
        const params = [];

        if (req.user.role === 'faculty') {
            query += ' AND c.faculty_id = ?';
            params.push(req.user.id);
        }

        if (req.user.role === 'student') {
            query = `
        SELECT c.*, co.name as course_name, co.code as course_code,
               u.name as faculty_name, d.name as department_name
        FROM classes c
        JOIN courses co ON c.course_id = co.id
        JOIN users u ON c.faculty_id = u.id
        JOIN departments d ON co.department_id = d.id
        JOIN student_classes sc ON sc.class_id = c.id
        WHERE c.is_active = TRUE AND sc.student_id = ?
      `;
            params.push(req.user.id);
        }

        query += ' ORDER BY c.day_of_week, c.start_time';

        const [classes] = await pool.query(query, params);
        res.json({ classes });
    } catch (error) {
        console.error('List classes error:', error);
        res.status(500).json({ error: 'Failed to fetch classes.' });
    }
};

const createClass = async (req, res) => {
    try {
        const { course_id, faculty_id, room_no, day_of_week, start_time, end_time, section, semester, academic_year } = req.body;

        if (!course_id || !day_of_week || !start_time || !end_time) {
            return res.status(400).json({ error: 'Course, day, start time, and end time are required.' });
        }

        const fId = req.user.role === 'faculty' ? req.user.id : faculty_id;

        const [result] = await pool.query(
            `INSERT INTO classes (course_id, faculty_id, room_no, day_of_week, start_time, end_time, section, semester, academic_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [course_id, fId, room_no, day_of_week, start_time, end_time, section || 'A', semester, academic_year]
        );

        res.status(201).json({ message: 'Class created successfully.', classId: result.insertId });
    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({ error: 'Failed to create class.' });
    }
};

const enrollStudents = async (req, res) => {
    try {
        const { student_ids } = req.body;

        if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({ error: 'Student IDs array is required.' });
        }

        const values = student_ids.map(sid => [sid, req.params.id]);
        await pool.query(
            'INSERT IGNORE INTO student_classes (student_id, class_id) VALUES ?',
            [values]
        );

        res.json({ message: `${student_ids.length} students enrolled successfully.` });
    } catch (error) {
        console.error('Enroll error:', error);
        res.status(500).json({ error: 'Failed to enroll students.' });
    }
};

const getClassStudents = async (req, res) => {
    try {
        const [students] = await pool.query(
            `SELECT u.id, u.name, u.email, u.enrollment_no, u.phone
       FROM users u
       JOIN student_classes sc ON sc.student_id = u.id
       WHERE sc.class_id = ? AND u.is_active = TRUE
       ORDER BY u.name`,
            [req.params.id]
        );

        res.json({ students });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Failed to fetch students.' });
    }
};

const getAllCourses = async (req, res) => {
    try {
        const [courses] = await pool.query(
            `SELECT c.*, d.name as department_name FROM courses c
       JOIN departments d ON c.department_id = d.id
       ORDER BY c.name`
        );
        res.json({ courses });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: 'Failed to fetch courses.' });
    }
};

const createCourse = async (req, res) => {
    try {
        const { name, code, department_id, semester, credits } = req.body;

        if (!name || !code || !department_id) {
            return res.status(400).json({ error: 'Name, code, and department are required.' });
        }

        const [result] = await pool.query(
            'INSERT INTO courses (name, code, department_id, semester, credits) VALUES (?, ?, ?, ?, ?)',
            [name, code, department_id, semester, credits || 3]
        );

        res.status(201).json({ message: 'Course created.', courseId: result.insertId });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ error: 'Failed to create course.' });
    }
};

const createSession = async (req, res) => {
    try {
        const { session_date, topic } = req.body;
        const classId = req.params.id;

        const istNow = new Date(Date.now() + (5.5 * 60 * 60 * 1000));
        const todayIST = istNow.toISOString().split('T')[0];
        const date = session_date || todayIST;

        const [result] = await pool.query(
            'INSERT INTO class_sessions (class_id, session_date, topic, status) VALUES (?, ?, ?, ?)',
            [classId, date, topic || null, 'ongoing']
        );

        res.status(201).json({ message: 'Session created.', sessionId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const istNow = new Date(Date.now() + (5.5 * 60 * 60 * 1000));
            const todayIST = istNow.toISOString().split('T')[0];
            const date = req.body.session_date || todayIST;

            const [existing] = await pool.query(
                'SELECT * FROM class_sessions WHERE class_id = ? AND session_date = ?',
                [req.params.id, date]
            );
            return res.json({ message: 'Session already exists.', sessionId: existing[0]?.id });
        }
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Failed to create session.' });
    }
};

const getTodaySessions = async (req, res) => {
    try {
        const istNow = new Date(Date.now() + (5.5 * 60 * 60 * 1000));
        const today = istNow.toISOString().split('T')[0];
        const targetDate = req.query.date || today;

        // Parse the target string into a Date object so we can extract the weekday.
        // Appending T12:00:00Z ensures the timezone doesn't shift the day backwards if running natively in UTC
        const targetObj = new Date(`${targetDate}T12:00:00Z`);
        const dayName = targetObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });

        let classQuery = `
      SELECT c.id as class_id, c.course_id, c.faculty_id, c.room_no, c.day_of_week,
             c.start_time, c.end_time, c.section,
             co.name as course_name, co.code as course_code,
             u.name as faculty_name,
             (SELECT COUNT(*) FROM student_classes WHERE class_id = c.id) as student_count
      FROM classes c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.faculty_id = u.id
      WHERE c.is_active = TRUE AND c.day_of_week = ?
    `;
        const params = [dayName];

        if (req.user.role === 'faculty') {
            classQuery += ' AND c.faculty_id = ?';
            params.push(req.user.id);
        }
        if (req.user.role === 'student') {
            classQuery += ' AND c.id IN (SELECT class_id FROM student_classes WHERE student_id = ?)';
            params.push(req.user.id);
        }

        classQuery += ' ORDER BY c.start_time';
        const [classes] = await pool.query(classQuery, params);

        for (const cls of classes) {
            await pool.query(
                `INSERT IGNORE INTO class_sessions (class_id, session_date, status) VALUES (?, ?, 'scheduled')`,
                [cls.class_id, today]
            );
        }

        const [sessions] = await pool.query(
            `SELECT cs.id as session_id, cs.class_id, cs.session_date, cs.topic, cs.status,
              c.start_time, c.end_time, c.room_no, c.section,
              co.name as course_name, co.code as course_code,
              u.name as faculty_name,
              (SELECT COUNT(*) FROM student_classes WHERE class_id = c.id) as total_students,
              (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = cs.id AND ar.status = 'present') as present_count,
              ${req.user.role === 'student' ? `(SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = cs.id AND ar.student_id = ${Number(req.user.id)} AND ar.status = 'present')` : '0'} as student_present
       FROM class_sessions cs
       JOIN classes c ON cs.class_id = c.id
       JOIN courses co ON c.course_id = co.id
       JOIN users u ON c.faculty_id = u.id
       WHERE cs.session_date = ? AND c.day_of_week = ?
         ${req.user.role === 'faculty' ? 'AND c.faculty_id = ?' : ''}
         ${req.user.role === 'student' ? 'AND c.id IN (SELECT class_id FROM student_classes WHERE student_id = ?)' : ''}
       ORDER BY c.start_time`,
            req.user.role === 'admin' ? [targetDate, dayName] : [targetDate, dayName, req.user.id]
        );

        const now = new Date();
        const istOffset = 5.5 * 60;
        const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
        const currentMinutes = (utcMinutes + istOffset) % (24 * 60);

        const enriched = sessions.map(s => {
            const [sh, sm] = (s.start_time || '00:00').split(':').map(Number);
            const [eh, em] = (s.end_time || '23:59').split(':').map(Number);
            const startMin = sh * 60 + sm;
            const endMin = eh * 60 + em;

            let computed_status = 'upcoming';

            if (targetDate < today) {
                computed_status = 'completed';
            } else if (targetDate > today) {
                computed_status = 'upcoming';
            } else {
                if (startMin > endMin) {
                    // Class spans midnight (e.g. 21:00 to 12:00)
                    if (currentMinutes >= startMin) computed_status = 'ongoing';
                } else {
                    // Normal class
                    if (currentMinutes >= startMin && currentMinutes < endMin) computed_status = 'ongoing';
                    else if (currentMinutes >= endMin) computed_status = 'completed';
                }
            }

            return {
                ...s,
                computed_status,
                student_present: Number(s.student_present || 0),
                present_count: Number(s.present_count || 0)
            };
        });

        res.json({ sessions: enriched });
    } catch (error) {
        console.error('Get today sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch today sessions.' });
    }
};

const getHistoricalSessions = async (req, res) => {
    try {
        if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to view historical sessions' });
        }

        const istNow = new Date(Date.now() + (5.5 * 60 * 60 * 1000));
        const today = istNow.toISOString().split('T')[0];

        let query = `
            SELECT cs.id as session_id, cs.session_date, cs.topic,
                   c.start_time, c.end_time, c.room_no, c.section, c.course_id,
                   co.name as course_name, co.code as course_code,
                   (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = cs.id AND ar.status = 'present') as present_count,
                   (SELECT COUNT(*) FROM student_classes WHERE class_id = c.id) as total_students
            FROM class_sessions cs
            JOIN classes c ON cs.class_id = c.id
            JOIN courses co ON c.course_id = co.id
            WHERE cs.session_date < ?
        `;
        const params = [today];

        if (req.user.role === 'faculty') {
            query += ' AND c.faculty_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY cs.session_date DESC, c.start_time DESC LIMIT 100';

        const [history] = await pool.query(query, params);
        res.json({ history });
    } catch (error) {
        console.error('Get historical sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch historical sessions.' });
    }
};

const getSessionsByClass = async (req, res) => {
    try {
        const [sessions] = await pool.query(
            `SELECT cs.*,
              (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = cs.id AND ar.status = 'present') as present_count,
              (SELECT COUNT(*) FROM student_classes WHERE class_id = cs.class_id) as total_students
       FROM class_sessions cs
       WHERE cs.class_id = ?
       ORDER BY cs.session_date DESC
       LIMIT 50`,
            [req.params.id]
        );
        res.json({ sessions });
    } catch (error) {
        console.error('Get sessions by class error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions.' });
    }
};

const deleteClass = async (req, res) => {
    try {
        await pool.query('DELETE FROM classes WHERE id = ?', [req.params.id]);
        res.json({ message: 'Class deleted successfully.' });
    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({ error: 'Failed to delete class.' });
    }
};

const clearClasses = async (req, res) => {
    try {
        await pool.query('DELETE FROM classes');
        res.json({ message: 'All classes cleared successfully.' });
    } catch (error) {
        console.error('Clear classes error:', error);
        res.status(500).json({ error: 'Failed to clear classes.' });
    }
};

const deleteCourse = async (req, res) => {
    try {
        await pool.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
        res.json({ message: 'Course deleted successfully.' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: 'Failed to delete course.' });
    }
};

const clearCourses = async (req, res) => {
    try {
        await pool.query('DELETE FROM courses');
        res.json({ message: 'All courses cleared successfully.' });
    } catch (error) {
        console.error('Clear courses error:', error);
        res.status(500).json({ error: 'Failed to clear courses.' });
    }
};

const removeStudentFromClass = async (req, res) => {
    try {
        await pool.query('DELETE FROM student_classes WHERE class_id = ? AND student_id = ?', [req.params.classId, req.params.studentId]);
        res.json({ message: 'Student removed from class.' });
    } catch (error) {
        console.error('Remove student error:', error);
        res.status(500).json({ error: 'Failed to remove student.' });
    }
};

const clearStudentsFromClass = async (req, res) => {
    try {
        await pool.query('DELETE FROM student_classes WHERE class_id = ?', [req.params.classId]);
        res.json({ message: 'All students cleared from class.' });
    } catch (error) {
        console.error('Clear students error:', error);
        res.status(500).json({ error: 'Failed to clear students.' });
    }
};

module.exports = {
    listClasses,
    createClass,
    enrollStudents,
    getClassStudents,
    getAllCourses,
    createCourse,
    createSession,
    getTodaySessions,
    getHistoricalSessions,
    getSessionsByClass,
    deleteClass,
    clearClasses,
    deleteCourse,
    clearCourses,
    removeStudentFromClass,
    clearStudentsFromClass
};

