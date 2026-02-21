import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const EmptyClipboardIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
);

const MyAttendance = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await api.get('/attendance/student/me');
                setRecords(res.data.records);
            } catch {

            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title">My Attendance</h1>
                    <p className="page-subtitle">Your attendance history</p>
                </div>
                <div className="loading-spinner"><div className="spinner"></div></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">My Attendance</h1>
                <p className="page-subtitle">Your complete attendance history</p>
            </div>
            <div className="page-content fade-in">
                {records.length > 0 ? (
                    <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -16px', padding: '0 16px' }}>
                        <table className="data-table" style={{ minWidth: 600 }}>
                            <thead>
                                <tr>
                                    <th style={{ whiteSpace: 'nowrap' }}>Date</th>
                                    <th>Course</th>
                                    <th>Topic</th>
                                    <th>Faculty</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                    <th style={{ textAlign: 'center' }}>Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r) => (
                                    <tr key={r.id}>
                                        <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.session_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td style={{ minWidth: 150 }}>
                                            <strong>{r.course_code}</strong>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.course_name}</div>
                                        </td>
                                        <td style={{ minWidth: 120 }}>{r.topic || '-'}</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>{r.faculty_name}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`badge badge-${r.status}`} style={{ minWidth: 64, justifyContent: 'center' }}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="badge badge-faculty" style={{ whiteSpace: 'nowrap' }}>{r.marked_by}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon"><EmptyClipboardIcon /></div>
                        <div className="empty-state-title">No attendance records yet</div>
                        <p style={{ color: 'var(--text-muted)' }}>Your attendance will appear here once classes begin.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default MyAttendance;
