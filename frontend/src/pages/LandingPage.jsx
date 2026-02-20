import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthModal from '../components/AuthModal';

const IconLogo = () => (
    <svg width="20" height="20" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 326 148 A 118 118 0 1 0 326 364" stroke="currentColor" strokeWidth="52" strokeLinecap="round" fill="none" />
        <polyline points="296,340 326,364 390,290" stroke="currentColor" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
);

const IconSun = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const IconMoon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const IconMenu = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

const IconClose = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconArrow = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);

const IconCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const FEATURES = [
    {
        icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M2 2l2 2" /><path d="M22 2l-2 2" /><path d="M15 11l2 2" /><path d="M7 11l-2 2" /></svg>),
        title: 'Face Recognition',
        desc: 'Our primary method — AI-powered facial recognition instantly verifies and marks student attendance. No manual input needed.',
    },
    {
        icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="3" height="3" /></svg>),
        title: 'QR Backup Scanning',
        desc: 'If face recognition is unavailable, dynamic time-limited QR codes serve as a reliable fallback — scan once, done.',
    },
    {
        icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>),
        title: 'Real-time Analytics',
        desc: 'Live dashboards for students, faculty, and admins. Track attendance trends by course, section, or department.',
    },
    {
        icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>),
        title: 'Smart Alerts',
        desc: 'Automated notifications for low attendance, upcoming classes, and session summaries sent in real time.',
    },
    {
        icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
        title: 'Proxy-proof System',
        desc: 'Biometric face verification, time-expiry QR codes, and session locking eliminate proxy attendance entirely.',
    },
    {
        icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
        title: 'Role-based Access',
        desc: 'Students, faculty, and admins each get a tailored dashboard with exactly the controls they need.',
    },
    {
        icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17.01" /></svg>),
        title: 'At-risk Detection',
        desc: 'Automatically flags students falling below the attendance threshold so faculty can intervene early.',
    },
];

const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [authTab, setAuthTab] = useState('login');

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        setMobileOpen(false);
    };

    const openAuth = (tab) => {
        setAuthTab(tab);
        setAuthOpen(true);
        setMobileOpen(false);
    };

    return (
        <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

            <AuthModal open={authOpen} tab={authTab} onClose={() => setAuthOpen(false)} />

            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
                background: scrolled ? 'var(--nav-glass-bg)' : 'transparent',
                borderBottom: scrolled ? '1px solid var(--border-color)' : '1px solid transparent',
                backdropFilter: scrolled ? 'blur(16px)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
                transition: 'all 0.3s ease',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 18, cursor: 'pointer', letterSpacing: '-0.4px' }} onClick={() => scrollTo('home')}>
                        <div style={{ width: 34, height: 34, background: 'var(--text-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-primary)' }}>
                            <IconLogo />
                        </div>
                        Classiq
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="nav-desktop">
                        <button onClick={() => scrollTo('home')} style={navLinkStyle}>Home</button>
                        <button onClick={() => scrollTo('features')} style={navLinkStyle}>Features</button>
                        <button onClick={() => scrollTo('about')} style={navLinkStyle}>About</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={toggleTheme} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                            {isDark ? <IconSun /> : <IconMoon />}
                        </button>
                        {isAuthenticated ? (
                            <button onClick={() => navigate('/dashboard')} style={btnPrimary}>Dashboard</button>
                        ) : (
                            <>
                                <button onClick={() => openAuth('login')} style={btnOutline}>Sign In</button>
                                <button onClick={() => openAuth('register')} style={btnPrimary}>Get Started</button>
                            </>
                        )}
                        <button onClick={() => setMobileOpen(!mobileOpen)} className="mob-menu-btn" style={{ display: 'none', background: 'none', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                            {mobileOpen ? <IconClose /> : <IconMenu />}
                        </button>
                    </div>
                </div>

                {mobileOpen && (
                    <div style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button onClick={() => scrollTo('home')} style={{ ...navLinkStyle, textAlign: 'left', width: '100%' }}>Home</button>
                        <button onClick={() => scrollTo('features')} style={{ ...navLinkStyle, textAlign: 'left', width: '100%' }}>Features</button>
                        <button onClick={() => scrollTo('about')} style={{ ...navLinkStyle, textAlign: 'left', width: '100%' }}>About</button>
                        <div style={{ height: 1, background: 'var(--border-color)', margin: '8px 0' }} />
                        {isAuthenticated ? (
                            <button onClick={() => navigate('/dashboard')} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>Dashboard</button>
                        ) : (
                            <>
                                <button onClick={() => openAuth('login')} style={{ ...btnOutline, width: '100%', justifyContent: 'center' }}>Sign In</button>
                                <button onClick={() => openAuth('register')} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>Get Started</button>
                            </>
                        )}
                    </div>
                )}
            </nav>

            <section id="home" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px' }}>
                <div style={{ maxWidth: 760 }}>
                    <div style={{ display: 'inline-block', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 999, padding: '6px 18px', fontSize: 13, color: 'var(--text-muted)', marginBottom: 36, fontWeight: 500 }}>
                        Smart Attendance Management — Classiq
                    </div>
                    <h1 style={{ fontSize: 'clamp(38px, 7vw, 76px)', fontWeight: 900, lineHeight: 1.08, marginBottom: 24, letterSpacing: '-2px' }}>
                        Attendance without<br />
                        <span style={{ color: 'var(--text-muted)' }}>the headache.</span>
                    </h1>
                    <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 48, maxWidth: 540, margin: '0 auto 48px' }}>
                        Face recognition-powered, proxy-proof, real-time attendance tracking for colleges. QR backup built in. Designed for students, faculty, and admins.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => openAuth('register')} style={{ ...btnPrimary, padding: '14px 32px', fontSize: 16, borderRadius: 10, display: 'inline-flex', gap: 8 }}>
                            Get Started Free <IconArrow />
                        </button>
                        <button onClick={() => scrollTo('features')} style={{ ...btnOutline, padding: '14px 32px', fontSize: 16, borderRadius: 10 }}>
                            See Features
                        </button>
                    </div>

                    <div style={{ marginTop: 80, display: 'flex', justifyContent: 'center', gap: 56, flexWrap: 'wrap' }}>
                        {[['AI', 'Face ID'], ['< 2s', 'Scan Time'], ['3', 'User Roles'], ['Live', 'Analytics']].map(([val, label]) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>{val}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '20px 24px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
                    {['Face Recognition', 'QR Backup', 'Student Dashboard', 'Admin Analytics', 'At-risk Alerts'].map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                            <span style={{ color: 'var(--text-primary)', display: 'flex' }}><IconCheck /></span>
                            {f}
                        </div>
                    ))}
                </div>
            </div>

            <section id="features" style={{ padding: '100px 24px', background: 'var(--bg-primary)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>Features</div>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 16 }}>Everything you need</h2>
                        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto', lineHeight: 1.65 }}>
                            A complete attendance ecosystem — from face recognition to analytics — with QR backup built in.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                        {FEATURES.map((f) => (
                            <div key={f.title} className="lp-glass" style={{ borderRadius: 16, padding: '32px 28px' }}>
                                <div style={{ color: 'var(--text-primary)', marginBottom: 18, opacity: 0.85 }}>{f.icon}</div>
                                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section style={{ padding: '100px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 64, alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>How it works</div>
                        <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 24 }}>Three roles, one system.</h2>
                        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40 }}>
                            Classiq is built around three distinct user roles — each with their own tailored experience and tools.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {[
                                ['01', 'Student', 'Walk into class — face recognition marks you present automatically. QR scan available as backup. View your full attendance history anytime.'],
                                ['02', 'Faculty', 'Start a session and let face recognition handle the rest. Generate a QR code as a fallback, or mark attendance manually. View class-level analytics.'],
                                ['03', 'Admin', 'Institution-wide oversight. Manage users, courses, departments, and access comprehensive analytics reports.'],
                            ].map(([n, role, desc]) => (
                                <div key={role} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', minWidth: 24, paddingTop: 3, letterSpacing: '0.5px' }}>{n}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, marginBottom: 5, color: 'var(--text-primary)' }}>{role}</div>
                                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lp-glass" style={{ borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>Live session — CS301</div>
                        {[
                            { label: 'Session started', sub: 'Today 10:00 AM', time: 'just now' },
                            { label: 'Face scan activated', sub: 'AI model loaded · camera ready', time: '10:01 AM' },
                            { label: '24 students verified', sub: '3 absent · QR fallback for 1', time: '10:03 AM' },
                            { label: 'Session closed', sub: 'Attendance report saved', time: '11:00 AM' },
                        ].map((item, i) => (
                            <div key={i} className="lp-glass-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 16px', borderRadius: 10, gap: 12 }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-primary)', marginTop: 5, flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, color: 'var(--text-primary)' }}>{item.label}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.sub}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{item.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="about" style={{ padding: '100px 24px', background: 'var(--bg-primary)' }}>
                <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>About</div>
                    <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 24 }}>Why Classiq?</h2>
                    <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 24 }}>
                        Classiq was built to solve a real problem — manual attendance sheets are slow, proxy-prone, and produce no useful data. We built a face recognition-first system with QR backup, making attendance frictionless for students, comprehensive for faculty, and insightful for institutions.
                    </p>
                    <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 48 }}>
                        Walk in, get recognized, done. If the camera is unavailable, scan a QR code instead. It never forgets. And it gives everyone exactly the data they need.
                    </p>
                    <button onClick={() => openAuth('register')} style={{ ...btnPrimary, padding: '13px 32px', fontSize: 15, borderRadius: 10, display: 'inline-flex', gap: 8 }}>
                        Get started for free <IconArrow />
                    </button>
                </div>
            </section>

            <section style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', padding: '90px 24px', textAlign: 'center' }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                    <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 16 }}>
                        Ready to ditch the attendance sheet?
                    </h2>
                    <p style={{ fontSize: 16, opacity: 0.65, marginBottom: 44, lineHeight: 1.6 }}>
                        Set up your institution in minutes. No credit card required.
                    </p>
                    <button
                        onClick={() => openAuth('register')}
                        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: 'none', borderRadius: 10, padding: '14px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif' }}
                    >
                        Create Free Account <IconArrow />
                    </button>
                </div>
            </section>

            <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', padding: '52px 24px 32px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 48 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 18, marginBottom: 14, letterSpacing: '-0.4px' }}>
                                <div style={{ width: 30, height: 30, background: 'var(--text-primary)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-primary)' }}>
                                    <IconLogo />
                                </div>
                                Classiq
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                                Smart, proxy-proof attendance management for modern educational institutions.
                            </p>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 13, color: 'var(--text-primary)' }}>Product</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {['Features', 'How it works'].map(l => (
                                    <button key={l} onClick={() => scrollTo('features')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, textAlign: 'left', padding: 0, fontFamily: 'Inter, sans-serif' }}>{l}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 13, color: 'var(--text-primary)' }}>Account</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <button onClick={() => openAuth('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, textAlign: 'left', padding: 0, fontFamily: 'Inter, sans-serif' }}>Sign In</button>
                                <button onClick={() => openAuth('register')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, textAlign: 'left', padding: 0, fontFamily: 'Inter, sans-serif' }}>Register</button>
                                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, textAlign: 'left', padding: 0, fontFamily: 'Inter, sans-serif' }}>Dashboard</button>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 13, color: 'var(--text-primary)' }}>Company</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <button onClick={() => scrollTo('about')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, textAlign: 'left', padding: 0, fontFamily: 'Inter, sans-serif' }}>About</button>
                            </div>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>© 2025 Classiq. All rights reserved.</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Made for better classrooms.</div>
                    </div>
                </div>
            </footer>

            <style>{`
                @media (max-width: 768px) {
                    .nav-desktop { display: none !important; }
                    .mob-menu-btn { display: flex !important; }
                }
                .lp-glass {
                    background: rgba(255, 255, 255, 0.06);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    transition: background 0.2s ease, border-color 0.2s ease;
                }
                .lp-glass:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                }
                .lp-glass-inner {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                [data-theme="light"] .lp-glass {
                    background: rgba(255, 255, 255, 0.72);
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.07);
                }
                [data-theme="light"] .lp-glass:hover {
                    background: rgba(255, 255, 255, 0.9);
                    border-color: rgba(0, 0, 0, 0.12);
                }
                [data-theme="light"] .lp-glass-inner {
                    background: rgba(0, 0, 0, 0.03);
                    border: 1px solid rgba(0, 0, 0, 0.07);
                }
                :root { --nav-glass-bg: rgba(249, 249, 249, 0.85); }
                [data-theme="dark"] { --nav-glass-bg: rgba(33, 33, 33, 0.85); }
            `}</style>
        </div>
    );
};

const navLinkStyle = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
    padding: '8px 14px', borderRadius: 8, fontFamily: 'Inter, sans-serif',
};

const btnPrimary = {
    background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none',
    borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    display: 'inline-flex', alignItems: 'center', gap: 6,
};

const btnOutline = {
    background: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)',
    borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    display: 'inline-flex', alignItems: 'center', gap: 6,
};

export default LandingPage;
