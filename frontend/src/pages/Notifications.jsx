import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const getTypeIcon = (type) => {
    if (type === 'alert') {
        return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12" y2="16.01" />
            </svg>
        );
    }
    if (type === 'warning') {
        return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12" y2="17.01" />
            </svg>
        );
    }
    if (type === 'attendance') {
        return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <polyline points="9 14 11 16 15 12" />
            </svg>
        );
    }
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="8.01" />
        </svg>
    );
};

const EmptyBellIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unread_count);
        } catch {

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {
            toast.error('Failed to mark as read');
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success('All marked as read');
        } catch {
            toast.error('Failed to mark all as read');
        }
    };

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title gradient-text">Notifications</h1>
                </div>
                <div className="loading-spinner"><div className="spinner"></div></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="page-title gradient-text">Notifications</h1>
                    <p className="page-subtitle">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                        Mark All Read
                    </button>
                )}
            </div>
            <div className="page-content fade-in">
                {notifications.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {notifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => !n.is_read && markAsRead(n.id)}
                                style={{
                                    padding: 16,
                                    background: n.is_read ? 'var(--bg-card)' : 'rgba(99, 102, 241, 0.08)',
                                    border: `1px solid ${n.is_read ? 'var(--border-color)' : 'var(--primary-500)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    cursor: n.is_read ? 'default' : 'pointer',
                                    display: 'flex',
                                    gap: 12,
                                    alignItems: 'start',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <span>{getTypeIcon(n.type)}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: n.is_read ? 500 : 700, marginBottom: 4 }}>{n.title}</div>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>{n.message}</p>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {new Date(n.created_at).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                {!n.is_read && (
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)', flexShrink: 0, marginTop: 8 }} />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon"><EmptyBellIcon /></div>
                        <div className="empty-state-title">No notifications</div>
                        <p style={{ color: 'var(--text-muted)' }}>You're all caught up!</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default Notifications;
