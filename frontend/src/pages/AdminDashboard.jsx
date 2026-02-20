import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#22d3ee', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];

const IconUsers = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const IconGrad = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
);

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
    </svg>
);

const EmptyChartIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const res = await api.get('/analytics/overview');
                setData(res.data);
            } catch {

            } finally {
                setLoading(false);
            }
        };
        fetchOverview();
    }, []);

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title gradient-text">Admin Dashboard</h1>
                    <p className="page-subtitle">Institution-wide overview</p>
                </div>
                <div className="loading-spinner"><div className="spinner"></div></div>
            </>
        );
    }

    const stats = data?.stats || {};
    const todayAtt = data?.today_attendance || {};
    const deptStats = data?.department_stats || [];

    const todayPieData = [
        { name: 'Present', value: todayAtt.present || 0 },
        { name: 'Absent', value: todayAtt.absent || 0 },
        { name: 'Late', value: todayAtt.late || 0 },
    ].filter(d => d.value > 0);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title gradient-text">Admin Dashboard</h1>
                <p className="page-subtitle">
                    Institution-wide overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
            <div className="page-content fade-in">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon purple"><IconUsers /></div>
                        <div>
                            <div className="stat-value">{stats.total_students || 0}</div>
                            <div className="stat-label">Total Students</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon cyan"><IconGrad /></div>
                        <div>
                            <div className="stat-value">{stats.total_faculty || 0}</div>
                            <div className="stat-label">Total Faculty</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green"><IconBook /></div>
                        <div>
                            <div className="stat-value">{stats.total_courses || 0}</div>
                            <div className="stat-label">Courses</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon yellow"><IconClipboard /></div>
                        <div>
                            <div className="stat-value">{stats.total_classes || 0}</div>
                            <div className="stat-label">Active Classes</div>
                        </div>
                    </div>
                </div>

                <div className="charts-grid">
                    <div className="chart-card">
                        <div className="chart-title">Today's Attendance</div>
                        {todayPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={todayPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {todayPieData.map((entry, index) => (
                                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon"><EmptyChartIcon /></div>
                                <div className="empty-state-title">No attendance data today</div>
                            </div>
                        )}
                    </div>

                    <div className="chart-card">
                        <div className="chart-title">Department-wise Attendance</div>
                        {deptStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={deptStats}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="code" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                                    />
                                    <Bar dataKey="avg_attendance" fill="#6366f1" radius={[6, 6, 0, 0]} name="Avg Attendance %" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon"><EmptyChartIcon /></div>
                                <div className="empty-state-title">No department data yet</div>
                            </div>
                        )}
                    </div>
                </div>

                {deptStats.length > 0 && (
                    <div className="chart-card" style={{ marginTop: 20 }}>
                        <div className="chart-title">Department Summary</div>
                        <div className="data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Department</th>
                                        <th>Code</th>
                                        <th>Students</th>
                                        <th>Avg Attendance</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deptStats.map((d) => (
                                        <tr key={d.code}>
                                            <td><strong>{d.department}</strong></td>
                                            <td><span className="badge badge-faculty">{d.code}</span></td>
                                            <td>{d.total_students}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div className="progress-bar" style={{ width: 80 }}>
                                                        <div
                                                            className={`progress-fill ${d.avg_attendance >= 75 ? 'green' : d.avg_attendance >= 50 ? 'yellow' : 'red'}`}
                                                            style={{ width: `${d.avg_attendance || 0}%` }}
                                                        />
                                                    </div>
                                                    <span>{d.avg_attendance || 0}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${d.avg_attendance >= 75 ? 'badge-present' : d.avg_attendance >= 50 ? 'badge-late' : 'badge-absent'}`}>
                                                    {d.avg_attendance >= 75 ? 'Good' : d.avg_attendance >= 50 ? 'Average' : 'Low'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AdminDashboard;
