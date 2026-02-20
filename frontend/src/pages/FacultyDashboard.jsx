import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const IconBook = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

const IconClipboard = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
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

const IconQr = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="3" height="3" />
    </svg>
);

const CalendarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const EmptyCalendarIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const statusColors = {
    ongoing: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', dot: '#22c55e', label: 'Ongoing' },
    upcoming: { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.30)', dot: '#6366f1', label: 'Upcoming' },
    completed: { bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.25)', dot: '#94a3b8', label: 'Completed' },
};

const SessionCard = ({ session, navigate }) => {
    const sc = statusColors[session.computed_status] || statusColors.upcoming;
    return (
        <div style={{
            background: sc.bg,
            border: `1px solid ${sc.border}`,
            borderRadius: 'var(--radius-md)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{session.course_code}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{session.course_name}</div>
                </div>
                <span style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 600,
                    color: sc.dot,
                    background: sc.bg,
                    padding: '4px 10px',
                    borderRadius: 20,
                    border: `1px solid ${sc.border}`,
                }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                    {sc.label}
                </span>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ClockIcon /> {session.start_time} – {session.end_time}</span>
                <span>Room {session.room_no || 'TBA'}</span>
                <span>Section {session.section || 'A'}</span>
                <span>{session.present_count || 0}/{session.total_students || 0} present</span>
            </div>

            {session.computed_status === 'ongoing' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                        className="btn btn-primary"
                        style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => navigate('/dashboard/generate-qr')}
                    >
                        <IconQr /> Generate QR
                    </button>
                    <button
                        className="btn btn-secondary"
                        style={{ fontSize: 13 }}
                        onClick={() => navigate('/dashboard/mark-attendance')}
                    >
                        Mark Attendance
                    </button>
                </div>
            )}
        </div>
    );
};

const FacultyDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [classCount, setClassCount] = useState(0);
    const [totalStudents, setTotalStudents] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sessRes, dashRes] = await Promise.all([
                    api.get('/classes/sessions/today'),
                    api.get('/analytics/faculty/dashboard'),
                ]);
                setSessions(sessRes.data.sessions || []);
                setClassCount(dashRes.data.classes?.length || 0);
                setTotalStudents(dashRes.data.classes?.reduce((s, c) => s + (c.student_count || 0), 0) || 0);
            } catch {

            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const ongoing = sessions.filter(s => s.computed_status === 'ongoing');
    const upcoming = sessions.filter(s => s.computed_status === 'upcoming');
    const completed = sessions.filter(s => s.computed_status === 'completed');

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title gradient-text">Faculty Dashboard</h1>
                    <p className="page-subtitle">Welcome, {user?.name}</p>
                </div>
                <div className="loading-spinner"><div className="spinner"></div></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title gradient-text">Faculty Dashboard</h1>
                <p className="page-subtitle">
                    Welcome, {user?.name} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
            <div className="page-content fade-in">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon purple"><IconBook /></div>
                        <div>
                            <div className="stat-value">{classCount}</div>
                            <div className="stat-label">Active Classes</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon cyan"><IconClipboard /></div>
                        <div>
                            <div className="stat-value">{sessions.length}</div>
                            <div className="stat-label">Today's Sessions</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green"><IconUsers /></div>
                        <div>
                            <div className="stat-value">{totalStudents}</div>
                            <div className="stat-label">Total Students</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon yellow"><IconQr /></div>
                        <div>
                            <div className="stat-value" style={{ fontSize: 18, color: 'var(--primary-400)' }}>
                                <Link to="/dashboard/generate-qr" style={{ color: 'inherit', textDecoration: 'none' }}>Generate QR →</Link>
                            </div>
                            <div className="stat-label">Quick Action</div>
                        </div>
                    </div>
                </div>

                {ongoing.length > 0 && (
                    <div className="chart-card" style={{ marginBottom: 24 }}>
                        <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                            Ongoing Sessions ({ongoing.length})
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 12 }}>
                            {ongoing.map(s => <SessionCard key={s.session_id} session={s} navigate={navigate} />)}
                        </div>
                    </div>
                )}

                {upcoming.length > 0 && (
                    <div className="chart-card" style={{ marginBottom: 24 }}>
                        <div className="chart-title">Upcoming Sessions ({upcoming.length})</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 12 }}>
                            {upcoming.map(s => <SessionCard key={s.session_id} session={s} navigate={navigate} />)}
                        </div>
                    </div>
                )}

                {completed.length > 0 && (
                    <div className="chart-card" style={{ marginBottom: 24 }}>
                        <div className="chart-title">Completed Sessions ({completed.length})</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 12 }}>
                            {completed.map(s => <SessionCard key={s.session_id} session={s} navigate={navigate} />)}
                        </div>
                    </div>
                )}

                {sessions.length === 0 && (
                    <div className="chart-card">
                        <div className="empty-state">
                            <div className="empty-state-icon"><EmptyCalendarIcon /></div>
                            <div className="empty-state-title">No sessions today</div>
                            <p style={{ color: 'var(--text-muted)' }}>No classes are scheduled for today.</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default FacultyDashboard;
