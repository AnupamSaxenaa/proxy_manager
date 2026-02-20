import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import AIChatbot from '../components/AIChatbot';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const COLORS = ['var(--text-primary)', 'var(--text-secondary)', 'var(--text-muted)', 'var(--border-color)', '#000000'];

const IconChart = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const IconClipboard = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
);

const IconWarning = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12" y2="17.01" />
    </svg>
);

const IconBook = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

const EmptyChartIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const StudentDashboard = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [stats, setStats] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [statsRes, sessRes] = await Promise.all([
                    api.get('/analytics/student/me'),
                    api.get('/classes/sessions/today'),
                ]);
                setStats(statsRes.data);
                setSessions(sessRes.data.sessions || []);
            } catch {
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const getPercentageColor = (pct) => {
        return 'monochrome';
    };

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title gradient-text">Student Dashboard</h1>
                    <p className="page-subtitle">Welcome back, {user?.name}</p>
                </div>
                <div className="loading-spinner"><div className="spinner"></div></div>
            </>
        );
    }

    const overall = stats?.overall || { total_classes: 0, present: 0, absent: 0, late: 0, percentage: 0 };
    const courseWise = stats?.course_wise || [];
    const weeklyTrend = stats?.weekly_trend || [];

    const pieData = [
        { name: 'Present', value: overall.present || 0 },
        { name: 'Absent', value: overall.absent || 0 },
        { name: 'Late', value: overall.late || 0 },
    ].filter(d => d.value > 0);

    const tooltipStyle = {
        contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 },
        labelStyle: { color: 'var(--text-primary)' },
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title gradient-text">Student Dashboard</h1>
                <p className="page-subtitle">Welcome back, {user?.name}</p>
            </div>
            <div className="page-content fade-in">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon"><IconChart /></div>
                        <div>
                            <div className="stat-value">{overall.percentage || 0}%</div>
                            <div className="stat-label">Overall Attendance</div>
                            <div className="progress-bar" style={{ marginTop: 8, width: '100%', maxWidth: 120 }}>
                                <div
                                    className="progress-fill"
                                    style={{ width: `${overall.percentage || 0}%`, background: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon"><IconClipboard /></div>
                        <div>
                            <div className="stat-value">{overall.present || 0}</div>
                            <div className="stat-label">Classes Attended</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon"><IconWarning /></div>
                        <div>
                            <div className="stat-value">{overall.absent || 0}</div>
                            <div className="stat-label">Classes Missed</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon"><IconBook /></div>
                        <div>
                            <div className="stat-value">{overall.total_classes || 0}</div>
                            <div className="stat-label">Total Classes</div>
                        </div>
                    </div>
                </div>

                {sessions.length > 0 && (
                    <div className="chart-card" style={{ marginBottom: 20 }}>
                        <div className="chart-title">Today's Classes</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 12 }}>
                            {[...sessions].sort((a, b) => {
                                const order = { ongoing: 0, upcoming: 1, completed: 2 };
                                return (order[a.computed_status] ?? 1) - (order[b.computed_status] ?? 1);
                            }).map(s => {
                                const sc = {
                                    ongoing: { bg: 'var(--bg-input)', border: 'var(--text-primary)', dot: 'var(--text-primary)', label: 'Ongoing' },
                                    upcoming: { bg: 'rgba(0,0,0,0.02)', border: 'var(--border-color)', dot: 'var(--text-secondary)', label: 'Upcoming' },
                                    completed: { bg: 'transparent', border: 'var(--border-color)', dot: 'var(--text-muted)', label: 'Completed' },
                                }[s.computed_status] || { bg: 'transparent', border: 'var(--border-color)', dot: 'var(--text-muted)', label: s.computed_status };

                                return (
                                    <div key={s.session_id} style={{
                                        background: sc.bg,
                                        border: `1px solid ${sc.border}`,
                                        borderRadius: 'var(--radius-md)',
                                        padding: 16,
                                        display: 'flex', flexDirection: 'column', gap: 10,
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 16 }}>{s.course_code}</div>
                                                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.course_name}</div>
                                            </div>
                                            <span style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                fontSize: 12, fontWeight: 600, color: sc.dot,
                                                background: sc.bg, padding: '4px 10px', borderRadius: 20,
                                                border: `1px solid ${sc.border}`,
                                            }}>
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                                                {sc.label}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px 12px' }}>
                                            <span>{s.start_time} – {s.end_time}</span>
                                            <span>Room {s.room_no || 'TBA'}</span>
                                            <span style={{ gridColumn: '1 / -1' }}>{s.faculty_name}</span>
                                        </div>

                                        {s.student_present > 0 ? (
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>
                                                <span style={{ color: 'var(--text-primary)' }}>✓ Attendance Marked</span>
                                            </div>
                                        ) : s.computed_status === 'ongoing' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                                                <Link to="/dashboard/face-attendance" className="btn btn-primary" style={{ fontSize: 13, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                                        <line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                                                    </svg>
                                                    Scan Face to Mark Attendance
                                                </Link>
                                                <Link to="/dashboard/scan-qr" className="btn btn-secondary" style={{ fontSize: 13, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                                                        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="3" height="3" />
                                                    </svg>
                                                    Or Scan QR Code
                                                </Link>
                                            </div>
                                        )}

                                        {s.student_present === 0 && s.computed_status === 'completed' && (
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>— Not Marked (Missed)</span>
                                            </div>
                                        )}

                                        {s.student_present === 0 && s.computed_status === 'upcoming' && (
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                Attendance will open when class begins
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="charts-grid">
                    <div className="chart-card">
                        <div className="chart-title">Weekly Attendance Trend</div>
                        {weeklyTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={weeklyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="week_start" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} domain={[0, 100]} />
                                    <Tooltip {...tooltipStyle} />
                                    <Line type="monotone" dataKey="percentage" stroke="var(--text-primary)" strokeWidth={3} dot={{ fill: 'var(--bg-primary)', stroke: 'var(--text-primary)', r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon"><EmptyChartIcon /></div>
                                <div className="empty-state-title">No data yet</div>
                                <p>Attendance data will appear here as classes are conducted.</p>
                            </div>
                        )}
                    </div>

                    <div className="chart-card">
                        <div className="chart-title">Attendance Distribution</div>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon"><EmptyChartIcon /></div>
                                <div className="empty-state-title">No attendance records</div>
                            </div>
                        )}
                    </div>
                </div>

                {courseWise.length > 0 && (
                    <div className="chart-card" style={{ marginTop: 20 }}>
                        <div className="chart-title">Course-wise Attendance</div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={courseWise}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="course_code" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                                <Bar dataKey="percentage" fill="var(--text-primary)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {overall.percentage > 0 && overall.percentage < 75 && (
                    <div style={{
                        marginTop: 20,
                        padding: 20,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}>
                        <span style={{ color: 'var(--danger-400)', flexShrink: 0 }}><IconWarning /></span>
                        <div>
                            <strong style={{ color: 'var(--danger-400)' }}>Low Attendance Warning</strong>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                                Your attendance is below 75%. Please attend classes regularly to avoid academic consequences.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <AIChatbot />
        </>
    );
};

export default StudentDashboard;
