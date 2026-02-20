import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const IconMail = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const IconLock = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconAlert = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12" y2="16.01" />
    </svg>
);

const IconLogo = () => (
    <svg width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 326 148 A 118 118 0 1 0 326 364" stroke="currentColor" strokeWidth="52" strokeLinecap="round" fill="none" />
        <polyline points="296,340 326,364 390,290" stroke="currentColor" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" fill="none" />
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

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeRole, setActiveRole] = useState(null);
    const { login } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const roleOptions = {
        faculty: { label: 'Faculty', icon: '👨‍🏫' },
        student: { label: 'Student', icon: '🎓' },
    };

    const selectRole = (role) => {
        setActiveRole(role);
        setEmail('');
        setPassword('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password);
            toast.success(`Welcome back, ${user.name}!`);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page" style={{ position: 'relative' }}>
            <button className="auth-theme-toggle" onClick={toggleTheme} title="Toggle theme">
                {isDark ? <IconSun /> : <IconMoon />}
            </button>

            <div className="auth-container fade-in">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">
                            <IconLogo />
                        </div>
                        <h1 className="auth-title">Welcome Back</h1>
                        <p className="auth-subtitle">Sign in to your attendance portal</p>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        {Object.entries(roleOptions).map(([role, opt]) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => selectRole(role)}
                                style={{
                                    flex: 1,
                                    padding: '10px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: activeRole === role ? '2px solid var(--primary-500)' : '1px solid var(--border-color)',
                                    background: activeRole === role ? 'rgba(99,102,241,0.12)' : 'var(--bg-secondary)',
                                    color: activeRole === role ? 'var(--primary-400)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: activeRole === role ? 700 : 500,
                                    fontSize: 13,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 4,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <span style={{ fontSize: 20 }}>{opt.icon}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="auth-error">
                            <IconAlert />
                            {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{ paddingLeft: '40px', width: '100%' }}
                                />
                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                    <IconMail />
                                </span>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ paddingLeft: '40px', width: '100%' }}
                                />
                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                    <IconLock />
                                </span>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don't have an account? <Link to="/register">Sign Up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
