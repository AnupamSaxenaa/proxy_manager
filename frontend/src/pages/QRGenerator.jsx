import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const IconQr = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="3" height="3" />
    </svg>
);

const QRGenerator = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [timer, setTimer] = useState(0);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [expirySeconds, setExpirySeconds] = useState(60);
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await api.get('/classes');
                setClasses(res.data.classes);
            } catch {

            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (timer > 0) {
            const t = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(t);
        } else if (timer === 0 && qrData && autoRefresh) {
            generateQR();
        }
    }, [timer]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const startSession = async () => {
        if (!selectedClass) return toast.error('Select a class first');
        try {
            const res = await api.post(`/classes/${selectedClass}/session`, {});
            setSessionId(res.data.sessionId);
            toast.success('Session started!');
        } catch {
            toast.error('Failed to start session');
        }
    };

    const generateQR = async () => {
        if (!sessionId) return toast.error('Start a session first');
        setLoading(true);
        try {
            const res = await api.post('/qr/generate', {
                session_id: sessionId,
                expiry_seconds: expirySeconds,
            });
            setQrData(res.data);
            setTimer(expirySeconds);
            if (!autoRefresh) toast.success('QR Code generated!');
        } catch {
            toast.error('Failed to generate QR');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title gradient-text">Generate QR Code</h1>
                <p className="page-subtitle">Generate dynamic QR codes for attendance tracking</p>
            </div>
            <div className="page-content fade-in">
                {!sessionId ? (
                    <div className="chart-card" style={{ maxWidth: 500 }}>
                        <div className="chart-title">Start a Session</div>
                        <div className="input-group">
                            <label>Select Class</label>
                            <select
                                className="input-field"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="">Choose a class...</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.course_code} - {c.course_name} ({c.day_of_week} {c.start_time})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>QR Expiry (seconds)</label>
                            <select
                                className="input-field"
                                value={expirySeconds}
                                onChange={(e) => setExpirySeconds(parseInt(e.target.value))}
                            >
                                <option value={30}>30 seconds</option>
                                <option value={60}>60 seconds</option>
                                <option value={120}>2 minutes</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    style={{ width: 16, height: 16, accentColor: 'var(--primary-500)' }}
                                />
                                Auto-refresh QR code
                            </label>
                        </div>
                        <button className="btn btn-primary" onClick={startSession} disabled={!selectedClass}>
                            Start Session & Generate QR
                        </button>
                    </div>
                ) : (
                    <div className="qr-container glass-card">
                        {qrData ? (
                            <>
                                <div className="qr-code-wrapper">
                                    <img src={qrData.qr_image} alt="QR Code" style={{ width: 300, height: 300, display: 'block' }} />
                                </div>
                                <div className={`qr-timer ${timer <= 10 ? 'expiring' : ''}`}>
                                    {timer}s
                                </div>
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                                    {autoRefresh ? 'QR code auto-refreshes on expiry' : 'Click refresh to generate new QR'}
                                </p>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button className="btn btn-primary" onClick={generateQR} disabled={loading}>
                                        Refresh Now
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => { setSessionId(null); setQrData(null); setTimer(0); }}>
                                        End Session
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="empty-state-icon"><IconQr /></div>
                                <p style={{ color: 'var(--text-secondary)' }}>Click below to generate the first QR code</p>
                                <button className="btn btn-primary btn-lg" onClick={generateQR}>
                                    Generate QR Code
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default QRGenerator;
