import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const EAR_THRESHOLD = 0.28;
const BLINK_FRAMES_REQUIRED = 1;
const LIVENESS_TIMEOUT = 30000;

function getEAR(landmarks) {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    return (computeEAR(leftEye) + computeEAR(rightEye)) / 2;
}

function computeEAR(eyePoints) {
    const v1 = dist(eyePoints[1], eyePoints[5]);
    const v2 = dist(eyePoints[2], eyePoints[4]);
    const h = dist(eyePoints[0], eyePoints[3]);
    return (v1 + v2) / (2.0 * h);
}

function dist(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

const FaceAttendance = () => {
    const { user } = useAuth();
    const [step, setStep] = useState('loading');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [windowInfo, setWindowInfo] = useState(null);
    const [faceRegistered, setFaceRegistered] = useState(false);
    const [networkInfo, setNetworkInfo] = useState(null);
    const [sessionWindows, setSessionWindows] = useState({});

    const [livenessStatus, setLivenessStatus] = useState('waiting');
    const [blinkCount, setBlinkCount] = useState(0);
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const blinkFramesRef = useRef(0);
    const lastEARRef = useRef(1.0);
    const livenessTimerRef = useRef(null);
    const detectionLoopRef = useRef(null);
    const livenessPassedRef = useRef(false);
    const selectedSessionRef = useRef(null);
    const detectingRef = useRef(false);

    useEffect(() => {
        selectedSessionRef.current = selectedSession;
    }, [selectedSession]);

    useEffect(() => {
        init();
        return () => cleanup();
    }, []);

    const cleanup = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
        if (livenessTimerRef.current) clearTimeout(livenessTimerRef.current);
        if (detectionLoopRef.current) cancelAnimationFrame(detectionLoopRef.current);
    };

    const init = async () => {
        try {
            const networkRes = await api.get('/face/network-check');
            setNetworkInfo(networkRes.data);

            if (!networkRes.data.allowed) {
                setStep('network-blocked');
                return;
            }

            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            setModelsLoaded(true);

            const [faceRes, sessRes] = await Promise.all([
                api.get('/face/status'),
                api.get('/classes/sessions/today'),
            ]);

            setFaceRegistered(faceRes.data.registered);
            const allSessions = sessRes.data.sessions || [];
            const ongoingSessions = allSessions.filter(s => s.computed_status === 'ongoing');
            setSessions(ongoingSessions);

            if (!faceRes.data.registered) {
                setStep('not-registered');
            } else if (ongoingSessions.length === 0) {
                setStep('no-sessions');
            } else {
                const windows = {};
                for (const s of ongoingSessions) {
                    try {
                        const wRes = await api.get(`/attendance-window/status/${s.session_id}`);
                        windows[s.session_id] = wRes.data;
                    } catch {
                        windows[s.session_id] = { active: false };
                    }
                }
                setSessionWindows(windows);
                setStep('select-session');
            }
        } catch (err) {
            console.error('Init error:', err);
            setStep('error');
        }
    };

    const selectSession = async (session) => {
        setSelectedSession(session);
        try {
            const res = await api.get(`/attendance-window/status/${session.session_id}`);
            if (!res.data.active) {
                toast.error('Attendance window is not open for this session.');
                return;
            }
            if (res.data.window.method === 'qr') {
                toast.error('This session only accepts QR-based attendance.');
                return;
            }
            setWindowInfo(res.data);
            startCamera();
        } catch (err) {
            toast.error('Failed to check attendance window status.');
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = stream;
            setStep('camera');
        } catch (err) {
            toast.error('Camera access denied.');
            setStep('error');
        }
    };

    useEffect(() => {
        if (step === 'camera' && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => { });
            setTimeout(() => {
                setStep('liveness');
                startLivenessCheck();
            }, 1500);
        }
    }, [step]);

    const startLivenessCheck = () => {
        setLivenessStatus('blink');
        setBlinkCount(0);
        blinkFramesRef.current = 0;
        lastEARRef.current = 1.0;
        livenessPassedRef.current = false;
        detectingRef.current = false;

        if (livenessTimerRef.current) clearTimeout(livenessTimerRef.current);
        livenessTimerRef.current = setTimeout(() => {
            if (!livenessPassedRef.current) {
                setLivenessStatus('failed');
                toast.error('Liveness check timed out. Please try again.');
                if (detectionLoopRef.current) cancelAnimationFrame(detectionLoopRef.current);
            }
        }, LIVENESS_TIMEOUT);

        runDetectionLoop();
    };

    const runDetectionLoop = async () => {
        if (livenessPassedRef.current) return;

        if (!videoRef.current || videoRef.current.readyState !== 4) {
            detectionLoopRef.current = requestAnimationFrame(runDetectionLoop);
            return;
        }

        if (detectingRef.current) {
            detectionLoopRef.current = requestAnimationFrame(runDetectionLoop);
            return;
        }

        detectingRef.current = true;

        try {
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
                .withFaceLandmarks();

            if (detection) {
                const ear = getEAR(detection.landmarks);

                if (lastEARRef.current > EAR_THRESHOLD && ear < EAR_THRESHOLD) {
                    blinkFramesRef.current++;
                    setBlinkCount(blinkFramesRef.current);
                }

                if (blinkFramesRef.current >= BLINK_FRAMES_REQUIRED && !livenessPassedRef.current) {
                    livenessPassedRef.current = true;
                    if (livenessTimerRef.current) clearTimeout(livenessTimerRef.current);
                    setLivenessStatus('passed');
                    detectingRef.current = false;
                    await performVerification();
                    return;
                }

                lastEARRef.current = ear;
            }
        } catch {
        }

        detectingRef.current = false;

        if (!livenessPassedRef.current) {
            detectionLoopRef.current = requestAnimationFrame(runDetectionLoop);
        }
    };

    const performVerification = async () => {
        setVerifying(true);
        setStep('verifying');

        try {
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                toast.error('Face lost during verification. Please try again.');
                setStep('liveness');
                setVerifying(false);
                livenessPassedRef.current = false;
                startLivenessCheck();
                return;
            }

            const canvas = canvasRef.current;
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
            const scanPhoto = canvas.toDataURL('image/jpeg', 0.6);

            const session = selectedSessionRef.current;
            const res = await api.post('/face/verify', {
                descriptor: Array.from(detection.descriptor),
                session_id: session.session_id,
                liveness_passed: true,
                scan_photo: scanPhoto,
            });

            setResult({
                success: true,
                message: res.data.message,
                score: res.data.score,
            });
            setStep('result');
            cleanup();
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Verification failed.';
            const score = err.response?.data?.score;
            setResult({
                success: false,
                message: errorMsg,
                score,
            });
            setStep('result');
            cleanup();
        } finally {
            setVerifying(false);
        }
    };

    const retryLiveness = () => {
        setLivenessStatus('waiting');
        setBlinkCount(0);
        blinkFramesRef.current = 0;
        lastEARRef.current = 1.0;
        livenessPassedRef.current = false;
        startCamera();
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title gradient-text">Face Attendance</h1>
                <p className="page-subtitle">Mark your attendance using face recognition</p>
            </div>
            <div className="page-content fade-in">
                <div style={{ maxWidth: 600, margin: '0 auto' }}>

                    {step === 'loading' && (
                        <div style={{ textAlign: 'center', padding: 60 }}>
                            <div className="loading-spinner"><div className="spinner" /></div>
                            <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Loading face recognition models...</p>
                        </div>
                    )}

                    {step === 'network-blocked' && networkInfo && (
                        <div style={{
                            padding: 40, textAlign: 'center', background: 'var(--bg-card)',
                            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)',
                        }}>
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
                                <path d="M1 1l22 22" />
                                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                                <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
                                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                                <line x1="12" y1="20" x2="12.01" y2="20" />
                            </svg>
                            <h3 style={{ marginBottom: 8, color: '#ef4444' }}>Not on College Network</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                                You must be connected to the <strong>college WiFi</strong> to mark attendance via face scan.
                            </p>
                            <div style={{
                                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                                borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 20,
                                fontSize: 13, color: 'var(--text-muted)', textAlign: 'left',
                            }}>
                                <div style={{ marginBottom: 6 }}><strong>Your IP:</strong> {networkInfo.ip}</div>
                                <div><strong>Required Network:</strong> {networkInfo.required_networks?.join(', ') || 'Not configured'}</div>
                            </div>
                            <button className="btn btn-primary" onClick={() => { setStep('loading'); init(); }}>
                                Check Again
                            </button>
                        </div>
                    )}

                    {step === 'not-registered' && (
                        <div style={{
                            padding: 40, textAlign: 'center', background: 'var(--bg-card)',
                            border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)',
                        }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" style={{ marginBottom: 16 }}>
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17.01" />
                            </svg>
                            <h3 style={{ marginBottom: 8 }}>Face Not Registered</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                                You need to register your face before marking attendance.
                            </p>
                            <a href="/dashboard/face-register" className="btn btn-primary">Register Face Now</a>
                        </div>
                    )}

                    {step === 'no-sessions' && (
                        <div className="empty-state" style={{ padding: 60 }}>
                            <div className="empty-state-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.3 }}>
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12" y2="16.01" />
                                </svg>
                            </div>
                            <div className="empty-state-title">No Ongoing Sessions</div>
                            <p>There are no ongoing sessions available for face attendance right now.</p>
                        </div>
                    )}

                    {step === 'select-session' && (
                        <div>
                            <h3 style={{ marginBottom: 16 }}>Select a Session</h3>
                            {networkInfo && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16,
                                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                                    fontSize: 13, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                                        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                                        <line x1="12" y1="20" x2="12.01" y2="20" />
                                    </svg>
                                    Connected to allowed network ({networkInfo.ip})
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {sessions.map(s => {
                                    const win = sessionWindows[s.session_id];
                                    const isWindowOpen = win?.active;
                                    const windowMethod = win?.window?.method;
                                    const faceAllowed = isWindowOpen && windowMethod !== 'qr';

                                    return (
                                        <button
                                            key={s.session_id}
                                            onClick={() => faceAllowed ? selectSession(s) : null}
                                            disabled={!faceAllowed}
                                            style={{
                                                background: 'var(--bg-card)',
                                                border: `1px solid ${faceAllowed ? 'var(--border-color)' : 'rgba(239,68,68,0.2)'}`,
                                                borderRadius: 'var(--radius-md)', padding: 20,
                                                textAlign: 'left',
                                                cursor: faceAllowed ? 'pointer' : 'not-allowed',
                                                opacity: faceAllowed ? 1 : 0.6,
                                                transition: 'border-color 0.2s, box-shadow 0.2s',
                                            }}
                                            onMouseOver={e => { if (faceAllowed) { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 16px rgba(99,102,241,0.12)'; } }}
                                            onMouseOut={e => { e.currentTarget.style.borderColor = faceAllowed ? 'var(--border-color)' : 'rgba(239,68,68,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 16 }}>{s.course_code}</div>
                                                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{s.course_name}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                                                        {s.start_time} – {s.end_time} • Room {s.room_no || 'TBA'} • {s.faculty_name}
                                                    </div>
                                                </div>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                                                    background: isWindowOpen
                                                        ? (faceAllowed ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)')
                                                        : 'rgba(239,68,68,0.12)',
                                                    color: isWindowOpen
                                                        ? (faceAllowed ? '#22c55e' : '#f59e0b')
                                                        : '#ef4444',
                                                    border: `1px solid ${isWindowOpen ? (faceAllowed ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)') : 'rgba(239,68,68,0.3)'}`,
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {!isWindowOpen && '🔒 Not Open'}
                                                    {isWindowOpen && !faceAllowed && '📱 QR Only'}
                                                    {faceAllowed && '✅ Ready'}
                                                </span>
                                            </div>
                                            {!isWindowOpen && (
                                                <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>
                                                    Teacher hasn't opened attendance yet. Please wait.
                                                </div>
                                            )}
                                            {isWindowOpen && !faceAllowed && (
                                                <div style={{ marginTop: 8, fontSize: 12, color: '#f59e0b' }}>
                                                    This session accepts QR only. Use "Scan QR" instead.
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {(step === 'camera' || step === 'liveness' || step === 'verifying') && (
                        <div style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)', overflow: 'hidden',
                            position: 'relative', zIndex: 1,
                        }}>
                            {selectedSession && (
                                <div style={{
                                    padding: '12px 20px', borderBottom: '1px solid var(--border-color)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <div>
                                        <span style={{ fontWeight: 700 }}>{selectedSession.course_code}</span>
                                        <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 13 }}>
                                            {selectedSession.course_name}
                                        </span>
                                    </div>
                                    <span style={{
                                        background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                    }}>
                                        Live
                                    </span>
                                </div>
                            )}

                            <div style={{ position: 'relative' }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }}
                                />
                                <canvas ref={canvasRef} style={{ display: 'none' }} />

                                {step === 'liveness' && (
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0,
                                        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
                                        padding: '16px 20px', color: '#fff',
                                    }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                                            {livenessStatus === 'blink' && '👁️ Please Blink'}
                                            {livenessStatus === 'passed' && '✅ Liveness Verified!'}
                                            {livenessStatus === 'failed' && '❌ Liveness Failed'}
                                        </div>
                                        <div style={{ fontSize: 13, opacity: 0.8 }}>
                                            {livenessStatus === 'blink' && 'Blink naturally to prove you are a real person'}
                                            {livenessStatus === 'passed' && 'Verifying your identity...'}
                                            {livenessStatus === 'failed' && 'Please try again'}
                                        </div>
                                    </div>
                                )}

                                {step === 'verifying' && (
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'rgba(0,0,0,0.5)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexDirection: 'column', gap: 12, color: '#fff',
                                    }}>
                                        <div className="spinner" style={{ width: 40, height: 40, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                                        <div style={{ fontSize: 16, fontWeight: 600 }}>Verifying Identity...</div>
                                    </div>
                                )}
                            </div>

                            {step === 'liveness' && livenessStatus === 'failed' && (
                                <div style={{ padding: 20, textAlign: 'center' }}>
                                    <button className="btn btn-primary" onClick={retryLiveness}>
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'result' && result && (
                        <div style={{
                            padding: 40, textAlign: 'center',
                            background: result.success ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                            border: `1px solid ${result.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <div style={{ marginBottom: 16 }}>
                                {result.success ? (
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
                                    </svg>
                                ) : (
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                )}
                            </div>
                            <h2 style={{
                                color: result.success ? '#22c55e' : '#ef4444',
                                marginBottom: 8,
                            }}>
                                {result.success ? 'Attendance Marked!' : 'Verification Failed'}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                                {result.message}
                            </p>
                            {result.score !== undefined && (
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                    Match confidence: {result.score}%
                                </p>
                            )}

                            {!result.success && (
                                <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
                                    <button className="btn btn-primary" onClick={retryLiveness}>
                                        Try Again
                                    </button>
                                    <a href="/dashboard/scan-qr" className="btn btn-secondary">
                                        Use QR Instead
                                    </a>
                                </div>
                            )}

                            {result.success && (
                                <a href="/dashboard" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
                                    Back to Dashboard
                                </a>
                            )}
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="empty-state" style={{ padding: 60 }}>
                            <div className="empty-state-title">Something went wrong</div>
                            <p>Please check camera permissions and try again.</p>
                            <button className="btn btn-primary" onClick={() => { setStep('loading'); init(); }} style={{ marginTop: 16 }}>
                                Retry
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default FaceAttendance;
