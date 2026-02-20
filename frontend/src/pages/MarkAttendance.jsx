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
    const [todayClasses, setTodayClasses] = useState([]);
    const [historicalClasses, setHistoricalClasses] = useState([]);

    // Core Session State
    const [selectedClass, setSelectedClass] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const [todayRes, histRes] = await Promise.all([
                    api.get('/classes/sessions/today'),
                    api.get('/classes/sessions/historical')
                ]);
                setTodayClasses(todayRes.data.sessions || []);
                setHistoricalClasses(histRes.data.history || []);
                setSelectedClass('');
            } catch {
                toast.error('Failed to load schedule');
            }
        };
        fetchSchedule();
    }, []);

    // Group historical classes by Month YYYY
    const groupedHistory = historicalClasses.reduce((acc, session) => {
        const d = new Date(session.session_date);
        const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(session);
        return acc;
    }, {});

    const startSession = async (classId, specificSessionId = null) => {
        try {
            let sId = specificSessionId;
            if (!sId) {
                const sessionRes = await api.post(`/classes/${classId}/session`, {});
                sId = sessionRes.data.sessionId;
            }

            setSessionId(sId);
            setSelectedClass(classId);

            const [studentRes, attendanceRes] = await Promise.all([
                api.get(`/classes/${classId}/students`),
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
                    <div className="attendance-layout">
                        <h2 className="section-title" style={{ marginTop: 0, fontSize: 18, marginBottom: 12 }}>Today's Classes</h2>
                        {todayClasses.length === 0 ? (
                            <div className="chart-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                                No classes scheduled for today.
                            </div>
                        ) : (
                            <div className="horizontal-scroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
                                {todayClasses.map(c => (
                                    <div key={c.class_id} className="stat-card" style={{ minWidth: 200, cursor: 'pointer', border: '1px solid var(--border-color)' }} onClick={() => startSession(c.class_id, c.session_id)}>
                                        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{c.course_code}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{c.course_name}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{c.start_time} - {c.end_time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <h2 className="section-title" style={{ marginTop: 32, fontSize: 18, marginBottom: 16 }}>Previous Classes Timeline</h2>
                        {Object.keys(groupedHistory).length === 0 ? (
                            <div className="chart-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                                No historical class sessions found.
                            </div>
                        ) : (
                            <div className="timeline-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {Object.entries(groupedHistory).map(([monthYear, sessions]) => (
                                    <div key={monthYear} className="timeline-month-group">
                                        <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{monthYear}</h3>
                                        <div className="horizontal-scroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
                                            {sessions.map(s => {
                                                const d = new Date(s.session_date);
                                                const dayNum = d.getDate();
                                                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

                                                return (
                                                    <div
                                                        key={s.session_id}
                                                        className="stat-card"
                                                        style={{ minWidth: 160, padding: '12px 16px', cursor: 'pointer', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}
                                                        onClick={() => startSession(s.class_id, s.session_id)}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                            <div>
                                                                <div style={{ fontSize: 24, fontWeight: 'bold', lineHeight: 1 }}>{dayNum}</div>
                                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{dayName}</div>
                                                            </div>
                                                            <div style={{ fontSize: 11, background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>
                                                                {s.start_time}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.course_code}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 'auto', paddingTop: 8 }}>
                                                            {s.present_count} / {s.total_students} Present
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
