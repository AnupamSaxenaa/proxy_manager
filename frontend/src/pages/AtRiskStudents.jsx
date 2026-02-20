import { useState, useEffect } from 'react';
import api from '../utils/api';

const SuccessIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const AtRiskStudents = () => {
    const [students, setStudents] = useState([]);
    const [threshold, setThreshold] = useState(75);
    const [loading, setLoading] = useState(true);

    const fetchAtRisk = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/analytics/at-risk?threshold=${threshold}`);
            setStudents(res.data.students);
        } catch {

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAtRisk(); }, [threshold]);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title gradient-text">At-Risk Students</h1>
                <p className="page-subtitle">Students with attendance below the threshold</p>
            </div>
            <div className="page-content fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Threshold:</label>
                    <select className="input-field" style={{ width: 120 }} value={threshold} onChange={e => setThreshold(e.target.value)}>
                        <option value={90}>90%</option>
                        <option value={75}>75%</option>
                        <option value={60}>60%</option>
                        <option value={50}>50%</option>
                    </select>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Showing {students.length} student(s) below {threshold}%
                    </span>
                </div>

                {loading ? (
                    <div className="loading-spinner"><div className="spinner"></div></div>
                ) : students.length > 0 ? (
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Enrollment No</th>
                                    <th>Department</th>
                                    <th>Sessions</th>
                                    <th>Present</th>
                                    <th>Attendance %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s, idx) => (
                                    <tr key={s.id}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            <strong>{s.name}</strong>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</div>
                                        </td>
                                        <td>{s.enrollment_no || '-'}</td>
                                        <td>{s.department_name || '-'}</td>
                                        <td>{s.total_sessions}</td>
                                        <td>{s.present}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="progress-bar" style={{ width: 80 }}>
                                                    <div
                                                        className={`progress-fill ${s.percentage >= 60 ? 'yellow' : 'red'}`}
                                                        style={{ width: `${s.percentage}%` }}
                                                    />
                                                </div>
                                                <span className={`badge ${s.percentage >= 60 ? 'badge-late' : 'badge-absent'}`}>
                                                    {s.percentage}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon"><SuccessIcon /></div>
                        <div className="empty-state-title">No at-risk students</div>
                        <p style={{ color: 'var(--text-muted)' }}>All students are above the {threshold}% threshold!</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default AtRiskStudents;
