import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const IconCamera = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const IconCheck = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
    </svg>
);

const IconFail = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);

const QRScanner = () => {
    const { user } = useAuth();
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [scanning, setScanning] = useState(false);
    const [processing, setProcessing] = useState(false);
    const scannerRef = useRef(null);

    const startScanner = () => {
        setScanning(true);
        setResult(null);
        setError('');

        setTimeout(() => {
            const scanner = new Html5QrcodeScanner('qr-reader', {
                fps: 10,
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1,
                rememberLastUsedCamera: true,
            });

            scanner.render(
                async (decodedText) => {
                    scanner.clear();
                    setScanning(false);
                    await handleQRScanned(decodedText);
                },
                () => { }
            );

            scannerRef.current = scanner;
        }, 100);
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear();
        }
        setScanning(false);
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                try { scannerRef.current.clear(); } catch { }
            }
        };
    }, []);

    const handleQRScanned = async (data) => {
        setProcessing(true);
        try {
            const parsed = JSON.parse(data);
            const res = await api.post('/qr/validate', { qr_token: parsed.token });
            setResult({ success: true, message: res.data.message });
            toast.success('Attendance marked!');
        } catch (err) {
            const message = err.response?.data?.error || 'Failed to validate QR code';
            setResult({ success: false, message });
            setError(message);
            toast.error(message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Scan QR Code</h1>
                <p className="page-subtitle">Scan the QR code displayed by your faculty to mark attendance</p>
            </div>
            <div className="page-content fade-in">
                <div style={{ maxWidth: 500, margin: '0 auto' }}>
                    {result && (
                        <div
                            style={{
                                padding: 24,
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 24,
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                textAlign: 'center',
                            }}
                        >
                            <div style={{ color: result.success ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                                {result.success ? <IconCheck /> : <IconFail />}
                            </div>
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
                                {result.success ? 'Attendance Marked!' : 'Scan Failed'}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{result.message}</p>
                            <button
                                className="btn btn-secondary"
                                style={{ marginTop: 16 }}
                                onClick={() => { setResult(null); setError(''); }}
                            >
                                Scan Another
                            </button>
                        </div>
                    )}

                    {!result && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 32, textAlign: 'center' }}>
                            {!scanning ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                                        <IconCamera />
                                    </div>
                                    <h3 style={{ marginBottom: 8 }}>Ready to Scan</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                                        Point your camera at the QR code displayed on the screen
                                    </p>
                                    <button className="btn btn-primary btn-lg" onClick={startScanner}>
                                        Start Scanner
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div id="qr-reader" style={{ width: '100%', marginBottom: 16 }}></div>
                                    {processing && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                                            <div className="spinner" style={{ width: 20, height: 20 }}></div>
                                            <span style={{ color: 'var(--text-secondary)' }}>Validating...</span>
                                        </div>
                                    )}
                                    <button className="btn btn-secondary" onClick={stopScanner}>
                                        Stop Scanner
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    <div style={{ marginTop: 20, padding: 20, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ marginBottom: 12, color: 'var(--text-primary)' }}>Instructions</h4>
                        <ol style={{ color: 'var(--text-secondary)', fontSize: 14, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <li>Tap "Start Scanner" to activate your camera</li>
                            <li>Point your camera at the QR code on the projector/screen</li>
                            <li>Wait for the code to be scanned and validated</li>
                            <li>You'll see a confirmation once attendance is marked</li>
                        </ol>
                    </div>
                </div>
            </div>
        </>
    );
};

export default QRScanner;
