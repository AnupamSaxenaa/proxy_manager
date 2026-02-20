import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const IconClose = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconMail = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const IconLock = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconUser = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const IconAlert = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12" y2="16.01" />
    </svg>
);

const IconArrow = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);

const ClassiqMark = () => (
    <svg width="26" height="26" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 326 148 A 118 118 0 1 0 326 364" stroke="currentColor" strokeWidth="52" strokeLinecap="round" fill="none" />
        <polyline points="296,340 326,364 390,290" stroke="currentColor" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
);

const InputField = ({ icon, ...props }) => (
    <div style={{ position: 'relative' }}>
        {icon && (
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
                {icon}
            </span>
        )}
        <input
            {...props}
            style={{
                width: '100%',
                padding: icon ? '11px 14px 11px 40px' : '11px 14px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                color: 'var(--text-primary)',
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box',
                ...props.style,
            }}
            onFocus={e => e.target.style.borderColor = 'var(--text-secondary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
        />
    </div>
);

const SelectField = ({ children, ...props }) => (
    <select
        {...props}
        style={{
            width: '100%',
            padding: '11px 14px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10,
            color: 'var(--text-primary)',
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            cursor: 'pointer',
            boxSizing: 'border-box',
        }}
    >
        {children}
    </select>
);

const AuthModal = ({ open, tab: initialTab = 'login', onClose }) => {
    const [tab, setTab] = useState(initialTab);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);

    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [selectedRole, setSelectedRole] = useState(null);
    const [regData, setRegData] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        role: 'student', department_id: '', enrollment_no: '', phone: '',
    });

    const roleCreds = {
        admin: { email: 'aadmin@gmail.com', password: 'admin123', label: 'Admin' },
        faculty: { email: 'rahul.makkar@iiitk.ac.in', password: 'faculty123', label: 'Faculty' },
        student: { email: '', password: '', label: 'Student' },
    };

    const selectRole = (role) => {
        setSelectedRole(role);
        setLoginData({ email: roleCreds[role].email, password: roleCreds[role].password });
        setError('');
    };

    const { login, register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setTab(initialTab);
        setError('');
    }, [initialTab, open]);

    useEffect(() => {
        if (!open) return;
        api.get('/users/departments/all').then(r => setDepartments(r.data.departments)).catch(() => { });
    }, [open]);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(loginData.email, loginData.password);
            toast.success(`Welcome back, ${user.name}!`);
            onClose();
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (regData.password !== regData.confirmPassword) return setError('Passwords do not match.');
        if (regData.password.length < 6) return setError('Password must be at least 6 characters.');
        setLoading(true);
        try {
            const { confirmPassword, ...data } = regData;
            const user = await register(data);
            toast.success(`Welcome, ${user.name}! Account created.`);
            onClose();
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                animation: 'modalFadeIn 0.2s ease',
            }}
        >
            <div style={{
                width: '100%', maxWidth: 480,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 20,
                boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                maxHeight: '92vh',
                overflowY: 'auto',
                position: 'relative',
            }}>

                <div style={{ padding: '28px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: 'var(--text-primary)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-primary)', flexShrink: 0 }}>
                            <ClassiqMark />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>Classiq</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Smart Attendance</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', lineHeight: 0 }}>
                        <IconClose />
                    </button>
                </div>

                <div style={{ margin: '24px 28px 0', display: 'flex', background: 'var(--bg-primary)', borderRadius: 10, padding: 4, border: '1px solid var(--border-color)' }}>
                    {[['login', 'Sign In'], ['register', 'Create Account']].map(([t, label]) => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setError(''); }}
                            style={{
                                flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
                                background: tab === t ? 'var(--text-primary)' : 'none',
                                color: tab === t ? 'var(--bg-primary)' : 'var(--text-muted)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div style={{ padding: '24px 28px 28px' }}>
                    {tab === 'login' ? (
                        <form onSubmit={handleLogin}>
                            <div style={{ marginBottom: 20 }}>
                                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>Welcome back</h2>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sign in to your Classiq account</p>
                            </div>

                            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                                {Object.entries(roleCreds).map(([role, cred]) => {
                                    const active = selectedRole === role;
                                    return (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => selectRole(role)}
                                            style={{
                                                flex: 1, padding: '12px 6px',
                                                borderRadius: 10,
                                                border: active ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                                                background: active ? 'var(--text-primary)' : 'var(--bg-primary)',
                                                color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontFamily: 'Inter, sans-serif',
                                                fontWeight: active ? 700 : 500,
                                                fontSize: 12,
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {role === 'admin' && (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                                </svg>
                                            )}
                                            {role === 'faculty' && (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                </svg>
                                            )}
                                            {role === 'student' && (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                                    <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
                                                </svg>
                                            )}
                                            {cred.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {error && (
                                <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--text-primary)', display: 'flex' }}><IconAlert /></span>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                                    <InputField icon={<IconMail />} type="email" placeholder="your@email.com" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                                    <InputField icon={<IconLock />} type="password" placeholder="Your password" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} required />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 20, padding: '13px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s' }}>
                                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span>Sign In</span><IconArrow /></>}
                            </button>

                            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
                                No account?{' '}
                                <button type="button" onClick={() => { setTab('register'); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, fontFamily: 'Inter, sans-serif', padding: 0 }}>
                                    Create one free
                                </button>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister}>
                            <div style={{ marginBottom: 20 }}>
                                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>Create account</h2>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Join your institution on Classiq</p>
                            </div>

                            {error && (
                                <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--text-primary)', display: 'flex' }}><IconAlert /></span>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <label style={labelStyle}>Full Name</label>
                                    <InputField icon={<IconUser />} type="text" placeholder="Your full name" value={regData.name} onChange={e => setRegData({ ...regData, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>Email Address</label>
                                    <InputField icon={<IconMail />} type="email" placeholder="your@college.edu" value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <label style={labelStyle}>Password</label>
                                        <InputField icon={<IconLock />} type="password" placeholder="Min 6 chars" value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Confirm</label>
                                        <InputField icon={<IconLock />} type="password" placeholder="Repeat" value={regData.confirmPassword} onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })} required />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <label style={labelStyle}>Role</label>
                                        <SelectField name="role" value={regData.role} onChange={e => setRegData({ ...regData, role: e.target.value })}>
                                            <option value="student">Student</option>
                                            <option value="faculty">Faculty</option>
                                            <option value="admin">Admin</option>
                                        </SelectField>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Department</label>
                                        <SelectField name="department_id" value={regData.department_id} onChange={e => setRegData({ ...regData, department_id: e.target.value })}>
                                            <option value="">Select</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                                        </SelectField>
                                    </div>
                                </div>
                                {regData.role === 'student' && (
                                    <div>
                                        <label style={labelStyle}>Enrollment Number</label>
                                        <InputField type="text" placeholder="e.g. 2024CSE001" value={regData.enrollment_no} onChange={e => setRegData({ ...regData, enrollment_no: e.target.value })} />
                                    </div>
                                )}
                                <div>
                                    <label style={labelStyle}>Phone</label>
                                    <InputField type="tel" placeholder="e.g. 9876543210" value={regData.phone} onChange={e => setRegData({ ...regData, phone: e.target.value })} />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 20, padding: '13px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
                                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><span>Create Account</span><IconArrow /></>}
                            </button>

                            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
                                Already have an account?{' '}
                                <button type="button" onClick={() => { setTab('login'); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, fontFamily: 'Inter, sans-serif', padding: 0 }}>
                                    Sign in
                                </button>
                            </p>
                        </form>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideUp {
                    from { opacity: 0; transform: translateY(24px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
};

export default AuthModal;
