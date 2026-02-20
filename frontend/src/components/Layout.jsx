import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const IconDashboard = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
);

const IconQrCode = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="3" height="3" />
        <line x1="21" y1="14" x2="21" y2="14.01" />
        <line x1="21" y1="21" x2="21" y2="21.01" />
        <line x1="17" y1="21" x2="17" y2="21.01" />
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

const IconChart = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
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

const IconBell = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const IconLogout = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const IconBook = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
);

const IconWarning = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12" y2="17.01" />
    </svg>
);

const IconReport = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
);

const IconMenu = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

const IconClose = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconSun = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const IconMoon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const IconHome = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const IconLogo = () => (
    <svg width="20" height="20" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 326 148 A 118 118 0 1 0 326 364" stroke="currentColor" strokeWidth="52" strokeLinecap="round" fill="none" />
        <polyline points="296,340 326,364 390,290" stroke="currentColor" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
);

const IconCalendar = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const Layout = () => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/');
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
    };

    const closeSidebar = () => setSidebarOpen(false);

    const getNavItems = () => {
        const common = [
            { to: '/dashboard', icon: <IconDashboard />, label: 'Dashboard', exact: true },
        ];

        if (user?.role === 'student') {
            return [
                ...common,
                { to: '/dashboard/face-register', icon: <IconUsers />, label: 'Face Register' },
                { to: '/dashboard/face-attendance', icon: <IconQrCode />, label: 'Face Attendance' },
                { to: '/dashboard/scan-qr', icon: <IconQrCode />, label: 'Scan QR Code' },
                { to: '/dashboard/my-attendance', icon: <IconClipboard />, label: 'My Attendance' },
                { to: '/dashboard/my-classes', icon: <IconBook />, label: 'My Classes' },
                { to: '/dashboard/calendar', icon: <IconCalendar />, label: 'Calendar' },
            ];
        }

        if (user?.role === 'faculty') {
            return [
                ...common,
                { to: '/dashboard/attendance-window', icon: <IconUsers />, label: 'Attendance Window' },
                { to: '/dashboard/generate-qr', icon: <IconQrCode />, label: 'Generate QR' },
                { to: '/dashboard/mark-attendance', icon: <IconClipboard />, label: 'Manual Attendance' },
                { to: '/dashboard/my-classes', icon: <IconBook />, label: 'My Classes' },
                { to: '/dashboard/students', icon: <IconUsers />, label: 'My Students' },
                { to: '/dashboard/class-analytics', icon: <IconChart />, label: 'Class Analytics' },
                { to: '/dashboard/at-risk', icon: <IconWarning />, label: 'At-Risk Students' },
                { to: '/dashboard/calendar', icon: <IconCalendar />, label: 'Calendar' },
            ];
        }

        return [
            ...common,
            { to: '/dashboard/users', icon: <IconUsers />, label: 'Users' },
            { to: '/dashboard/manage-classes', icon: <IconBook />, label: 'Classes & Courses' },
            { to: '/dashboard/analytics', icon: <IconChart />, label: 'Analytics' },
            { to: '/dashboard/at-risk', icon: <IconWarning />, label: 'At-Risk Students' },
            { to: '/dashboard/calendar', icon: <IconCalendar />, label: 'Calendar' },
        ];
    };

    return (
        <div className="app-layout">
            <button className={`mobile-menu-btn ${sidebarOpen ? 'sidebar-open' : ''}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <IconClose /> : <IconMenu />}
            </button>

            <div
                className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
                onClick={closeSidebar}
            />

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo"><IconLogo /></div>
                    <div>
                        <div className="sidebar-title">Classiq</div>
                        <h1 className="page-title gradient-text">Manual Attendance</h1>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Menu</div>
                        {getNavItems().map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.exact}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={closeSidebar}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Other</div>
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <span className="nav-icon"><IconHome /></span>
                            Home
                        </NavLink>
                        <NavLink
                            to="/dashboard/notifications"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <span className="nav-icon"><IconBell /></span>
                            Notifications
                        </NavLink>
                        <button className="theme-toggle" onClick={toggleTheme}>
                            <span className="theme-toggle-icon">{isDark ? <IconMoon /> : <IconSun />}</span>
                            {isDark ? 'Dark Mode' : 'Light Mode'}
                            <div className="theme-toggle-track">
                                <div className="theme-toggle-thumb" />
                            </div>
                        </button>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info" onClick={handleLogout} title="Click to logout">
                        <div className="user-avatar">{getInitials(user?.name)}</div>
                        <div>
                            <div className="user-name">{user?.name}</div>
                            <div className="user-role">{user?.role}</div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}><IconLogout /></span>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
