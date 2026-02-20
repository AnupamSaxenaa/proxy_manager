import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CalendarIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

const RoomIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const TeacherIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const DeptIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

const EmptyBooksIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

const MyClasses = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await api.get('/classes');
                setClasses(res.data.classes);
            } catch {

            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const groupedByDay = classes.reduce((acc, c) => {
        if (!acc[c.day_of_week]) acc[c.day_of_week] = [];
        acc[c.day_of_week].push(c);
        return acc;
    }, {});

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title gradient-text">My Classes</h1>
                    <p className="page-subtitle">Your class schedule</p>
                </div>
                <div className="loading-spinner"><div className="spinner"></div></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title gradient-text">My Classes</h1>
                <p className="page-subtitle">Your weekly class schedule</p>
            </div>
            <div className="page-content fade-in">
                {classes.length > 0 ? (
                    dayOrder.filter(day => groupedByDay[day]).map(day => (
                        <div key={day} style={{ marginBottom: 24 }}>
                            <h3 style={{ marginBottom: 12, color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CalendarIcon /> {day}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                {groupedByDay[day].map(c => (
                                    <div
                                        key={c.id}
                                        className="stat-card"
                                        style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 16 }}>{c.course_code}</div>
                                                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.course_name}</div>
                                            </div>
                                            <span className="badge badge-faculty">{c.section || 'A'}</span>
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ClockIcon /> {c.start_time} - {c.end_time}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><RoomIcon /> Room: {c.room_no || 'TBA'}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TeacherIcon /> {c.faculty_name}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><DeptIcon /> {c.department_name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon"><EmptyBooksIcon /></div>
                        <div className="empty-state-title">No classes found</div>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {user?.role === 'student' ? 'You are not enrolled in any classes yet.' : 'No classes assigned yet.'}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default MyClasses;
