import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AttendanceWindow = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeWindows, setActiveWindows] = useState({});
    const [openingFor, setOpeningFor] = useState(null);
    const [method, setMethod] = useState('face');
    const [duration, setDuration] = useState(10);
    const [customDuration, setCustomDuration] = useState(false);
    const timerRefs = useRef({});

    useEffect(() => {
        fetchSessions();
        return () => {
            Object.values(timerRefs.current).forEach(clearInterval);
        };
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/classes/sessions/today');
            const sessionsData = res.data.sessions || [];
            setSessions(sessionsData);

            for (const s of sessionsData) {
                if (s.computed_status === 'ongoing' || s.computed_status === 'upcoming') {
                    await checkWindowStatus(s.session_id);
                }
            }
        } catch {
            toast.error('Failed to fetch sessions');
        } finally {
            setLoading(false);
        }
    };

    const checkWindowStatus = async (sessionId) => {
        try {
            const res = await api.get(`/attendance-window/status/${sessionId}`);
            if (res.data.active) {
                setActiveWindows(prev => ({
                    ...prev,
                    [sessionId]: {
                        ...res.data.window,
                        marked: res.data.marked,
                        total_students: res.data.total_students,
                    },
                }));
                startPolling(sessionId);
            }
        } catch {

        }
    };

    const startPolling = (sessionId) => {
        if (timerRefs.current[sessionId]) clearInterval(timerRefs.current[sessionId]);
        timerRefs.current[sessionId] = setInterval(async () => {
            try {
                const res = await api.get(`/attendance-window/status/${sessionId}`);
                if (res.data.active) {
                    setActiveWindows(prev => ({
                        ...prev,
                        [sessionId]: {
                            ...res.data.window,
                            marked: res.data.marked,
                            total_students: res.data.total_students,
                        },
                    }));
                } else {
                    setActiveWindows(prev => {
                        const next = { ...prev };
                        delete next[sessionId];
                        return next;
                    });
                    clearInterval(timerRefs.current[sessionId]);
                }
            } catch {

            }
        }, 5000);
    };

    const openWindow = async (sessionId) => {
        try {
            const res = await api.post('/attendance-window/open', {
                session_id: sessionId,
                method,
                duration_minutes: customDuration ? duration : duration,
            });
            toast.success(res.data.message);
            setOpeningFor(null);
            await checkWindowStatus(sessionId);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to open window');
        }
    };

    const closeWindow = async (sessionId) => {
        try {
            await api.post('/attendance-window/close', { session_id: sessionId });
            toast.success('Attendance window closed');
            setActiveWindows(prev => {
                const next = { ...prev };
                delete next[sessionId];
                return next;
            });
            if (timerRefs.current[sessionId]) {
                clearInterval(timerRefs.current[sessionId]);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to close window');
        }
    };

    const formatTimeRemaining = (closesAt) => {
        if (!closesAt) return 'Manual close';
        const diff = new Date(closesAt) - new Date();
        if (diff <= 0) return 'Expired';
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return `${mins}m ${secs}s remaining`;
    };

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title gradient-text">Attendance Window</h1>
                    <p className="page-subtitle">Control when students can mark attendance</p>
                </div>
                <div className="loading-spinner"><div className="spinner" /></div>
            </>
        );
    }

    const ongoingSessions = sessions.filter(s => s.computed_status === 'ongoing');
    const upcomingSessions = sessions.filter(s => s.computed_status === 'upcoming');

    return (
        <>
            <div className="page-header">
                <h1 className="page-title gradient-text">Attendance Window</h1>
                <p className="page-subtitle">Open or close attendance marking for your sessions</p>
            </div>
            <div className="page-content fade-in">
                {ongoingSessions.length === 0 && upcomingSessions.length === 0 && (
                    <div className="empty-state" style={{ padding: 60 }}>
                        <div className="empty-state-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.3 }}>
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12" y2="16.01" />
                            </svg>
                        </div>
                        <div className="empty-state-title">No Active Sessions</div>
                        <p>You don't have any ongoing or upcoming sessions today.</p>
                    </div>
                )}

                {ongoingSessions.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                            Ongoing Sessions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {ongoingSessions.map(s => (
                                <SessionCard
                                    key={s.session_id}
                                    session={s}
                                    activeWindow={activeWindows[s.session_id]}
                                    openingFor={openingFor}
                                    setOpeningFor={setOpeningFor}
                                    method={method}
                                    setMethod={setMethod}
                                    duration={duration}
                                    setDuration={setDuration}
                                    customDuration={customDuration}
                                    setCustomDuration={setCustomDuration}
                                    onOpen={openWindow}
                                    onClose={closeWindow}
                                    formatTimeRemaining={formatTimeRemaining}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {upcomingSessions.length > 0 && (
                    <div>
                        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
                            Upcoming Sessions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {upcomingSessions.map(s => (
                                <SessionCard
                                    key={s.session_id}
                                    session={s}
                                    activeWindow={activeWindows[s.session_id]}
                                    openingFor={openingFor}
                                    setOpeningFor={setOpeningFor}
                                    method={method}
                                    setMethod={setMethod}
                                    duration={duration}
                                    setDuration={setDuration}
                                    customDuration={customDuration}
                                    setCustomDuration={setCustomDuration}
                                    onOpen={openWindow}
                                    onClose={closeWindow}
                                    formatTimeRemaining={formatTimeRemaining}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

const SessionCard = ({
    session: s, activeWindow, openingFor, setOpeningFor,
    method, setMethod, duration, setDuration,
    customDuration, setCustomDuration,
    onOpen, onClose, formatTimeRemaining,
}) => {
    const isActive = !!activeWindow;
    const isConfiguring = openingFor === s.session_id;

    return (
        <div style={{
            background: 'var(--bg-card)', border: `1px solid ${isActive ? 'rgba(34,197,94,0.4)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)', padding: 24,
            boxShadow: isActive ? '0 0 20px rgba(34,197,94,0.08)' : 'none',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{s.course_code}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{s.course_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                        {s.start_time} – {s.end_time} • Room {s.room_no || 'TBA'} • Section {s.section}
                    </div>
                </div>
                {isActive && (
                    <span style={{
                        background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 6,
                        border: '1px solid rgba(34,197,94,0.3)',
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                        Window Open
                    </span>
                )}
            </div>

            {isActive && (
                <div style={{
                    background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16,
                }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 14, marginBottom: 12 }}>
                        <div>
                            <span style={{ color: 'var(--text-muted)' }}>Method: </span>
                            <strong style={{ textTransform: 'capitalize' }}>{activeWindow.method}</strong>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-muted)' }}>Time: </span>
                            <strong>{formatTimeRemaining(activeWindow.closes_at)}</strong>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-muted)' }}>Marked: </span>
                            <strong>{activeWindow.marked}/{activeWindow.total_students}</strong>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{
                            flex: 1, height: 6, borderRadius: 3, background: 'rgba(34,197,94,0.15)',
                        }}>
                            <div style={{
                                height: '100%', borderRadius: 3, background: '#22c55e',
                                width: `${activeWindow.total_students ? (activeWindow.marked / activeWindow.total_students) * 100 : 0}%`,
                                transition: 'width 0.3s',
                            }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 40, textAlign: 'right' }}>
                            {activeWindow.total_students ? Math.round((activeWindow.marked / activeWindow.total_students) * 100) : 0}%
                        </span>
                    </div>
                </div>
            )}

            {isActive ? (
                <button
                    className="btn btn-secondary"
                    onClick={() => onClose(s.session_id)}
                    style={{ width: '100%', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}
                >
                    ✕ Close Attendance Window
                </button>
            ) : isConfiguring ? (
                <div style={{
                    background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 'var(--radius-sm)', padding: 20,
                }}>
                    <h4 style={{ marginBottom: 16 }}>Configure Attendance Window</h4>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-secondary)' }}>
                            Attendance Method
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[{ value: 'face', label: '🔬 Face Scan' }, { value: 'qr', label: '📱 QR Code' }, { value: 'both', label: '🔄 Both' }].map(opt => (
                                <button
                                    key={opt.value}
                                    className={`btn ${method === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setMethod(opt.value)}
                                    style={{ fontSize: 13, flex: 1, padding: '8px 12px' }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-secondary)' }}>
                            Duration
                        </label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {[5, 10, 15, 30].map(min => (
                                <button
                                    key={min}
                                    className={`btn ${!customDuration && duration === min ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => { setDuration(min); setCustomDuration(false); }}
                                    style={{ fontSize: 13, padding: '8px 16px' }}
                                >
                                    {min} min
                                </button>
                            ))}
                            <button
                                className={`btn ${customDuration ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setCustomDuration(true)}
                                style={{ fontSize: 13, padding: '8px 16px' }}
                            >
                                Custom
                            </button>
                        </div>
                        {customDuration && (
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={duration}
                                    onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                                    min={1}
                                    max={120}
                                    style={{ width: 80, fontSize: 14, padding: '6px 10px' }}
                                />
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>minutes</span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => onOpen(s.session_id)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            </svg>
                            Open Window
                        </button>
                        <button className="btn btn-secondary" onClick={() => setOpeningFor(null)}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    className="btn btn-primary"
                    onClick={() => setOpeningFor(s.session_id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Open Attendance Window
                </button>
            )}
        </div>
    );
};

export default AttendanceWindow;
