import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const IconCheck = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const IconX = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconUsers = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const IconSave = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const MarkAttendance = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { 1: { status: 'present', marked_by: 'facial' } }
    const [loading, setLoading] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchClassesForDate = async () => {
            try {
                const res = await api.get(`/classes/sessions/today?date=${selectedDate}`);
                setClasses(res.data.sessions || []);
                setSelectedClass('');
            } catch {
                toast.error('Failed to load schedule for date');
            }
        };
        fetchClassesForDate();
    }, [selectedDate]);

    const startSession = async () => {
        if (!selectedClass) return;
        try {
            const sessionRes = await api.post(`/classes/${selectedClass}/session`, {
                session_date: selectedDate
            });
            const sId = sessionRes.data.sessionId;
            setSessionId(sId);

            const [studentRes, attendanceRes] = await Promise.all([
                api.get(`/classes/${selectedClass}/students`),
                api.get(`/attendance/session/${sId}`)
            ]);

            setStudents(studentRes.data.students);

            const initial = {};
            const existingRecords = attendanceRes.data.records || [];

            studentRes.data.students.forEach(s => {
                const existing = existingRecords.find(r => r.student_id === s.id);
                initial[s.id] = {
                    status: existing ? existing.status : 'absent',
                    marked_by: existing ? existing.marked_by : 'manual'
                };
            });
            setAttendance(initial);

            toast.success('Session started. Mark attendance below.');
        } catch {
            toast.error('Failed to start session');
        }
    };

    const toggleAttendance = (studentId) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: {
                status: prev[studentId]?.status === 'present' ? 'absent' : 'present',
                marked_by: 'manual'
            }
        }));
    };

    const markAllPresent = () => {
        const updated = { ...attendance };
        students.forEach(s => {
            if (updated[s.id]?.status !== 'present') {
                updated[s.id] = { status: 'present', marked_by: 'manual' };
            }
        });
        setAttendance(updated);
    };

    const markAllAbsent = () => {
        const updated = { ...attendance };
        students.forEach(s => {
            if (updated[s.id]?.status !== 'absent') {
                updated[s.id] = { status: 'absent', marked_by: 'manual' };
            }
        });
        setAttendance(updated);
    };

    const submitAttendance = async () => {
        setLoading(true);
        try {
            const records = Object.entries(attendance).map(([student_id, data]) => ({
                student_id: parseInt(student_id),
                status: data.status,
            }));
            await api.post('/attendance/mark-bulk', { session_id: sessionId, records });
            toast.success('Attendance saved successfully!');
        } catch {
            toast.error('Failed to save attendance');
        } finally {
            setLoading(false);
        }
    };

    const presentCount = Object.values(attendance).filter(v => v.status === 'present').length;
    const absentCount = Object.values(attendance).filter(v => v.status === 'absent').length;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title gradient-text">Mark Attendance</h1>
                <p className="page-subtitle">Manually mark attendance for your class</p>
            </div>
            <div className="page-content fade-in">
                {!sessionId ? (
                    <div className="chart-card" style={{ maxWidth: 500 }}>
                        <div className="chart-title">Select Class & Date</div>
                        <div className="input-group">
                            <label>Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label>Class</label>
                            <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                                <option value="">Choose a class...</option>
                                {classes.map(c => (
                                    <option key={c.class_id} value={c.class_id}>
                                        {c.course_code} - {c.course_name} ({c.start_time})
                                    </option>
                                ))}
                            </select>
                            {classes.length === 0 && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                    No classes scheduled for this date.
                                </div>
                            )}
                        </div>
                        <button className="btn btn-primary" onClick={startSession} disabled={!selectedClass}>
                            Load Attendance Roster
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="stats-grid" style={{ marginBottom: 20 }}>
                            <div className="stat-card">
                                <div className="stat-icon green"><IconCheck /></div>
                                <div>
                                    <div className="stat-value">{presentCount}</div>
                                    <div className="stat-label">Present</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon red"><IconX /></div>
                                <div>
                                    <div className="stat-value">{absentCount}</div>
                                    <div className="stat-label">Absent</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon cyan"><IconUsers /></div>
                                <div>
                                    <div className="stat-value">{students.length}</div>
                                    <div className="stat-label">Total Students</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                            <button className="btn btn-success btn-sm" onClick={markAllPresent}>Mark All Present</button>
                            <button className="btn btn-danger btn-sm" onClick={markAllAbsent}>Mark All Absent</button>
                        </div>

                        <div className="data-table-wrapper" style={{ marginBottom: 20 }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Enrollment No</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((s, idx) => (
                                        <tr key={s.id} onClick={() => toggleAttendance(s.id)} style={{ cursor: 'pointer' }}>
                                            <td>{idx + 1}</td>
                                            <td>
                                                <strong>{s.name}</strong>
                                                {attendance[s.id]?.marked_by !== 'manual' && attendance[s.id]?.status === 'present' && (
                                                    <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                                                        {attendance[s.id]?.marked_by}
                                                    </span>
                                                )}
                                            </td>
                                            <td>{s.enrollment_no || '-'}</td>
                                            <td>
                                                <span
                                                    className={`badge ${attendance[s.id]?.status === 'present' ? 'badge-present' : 'badge-absent'}`}
                                                    style={{ cursor: 'pointer', minWidth: 70, justifyContent: 'center' }}
                                                >
                                                    {attendance[s.id]?.status === 'present' ? 'Present' : 'Absent'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-primary btn-lg" onClick={submitAttendance} disabled={loading}>
                                {loading ? 'Saving...' : <><IconSave /> Save Attendance</>}
                            </button>
                            <button className="btn btn-secondary btn-lg" onClick={() => { setSessionId(null); setStudents([]); }}>
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default MarkAttendance;
