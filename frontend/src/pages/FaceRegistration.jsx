import { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import api from '../utils/api';
import toast from 'react-hot-toast';

const IconCamera = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const IconCheck = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const IconFace = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
);

const REQUIRED_CAPTURES = 5;

const CAPTURE_LABELS = [
    'Look straight at the camera',
    'Turn your head slightly left',
    'Turn your head slightly right',
    'Tilt your head slightly up',
    'Tilt your head slightly down',
];

const FaceRegistration = () => {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [cameraActive, setCameraActive] = useState(false);
    const [captures, setCaptures] = useState([]);
    const [faceStatus, setFaceStatus] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const detectionIntervalRef = useRef(null);

    useEffect(() => {
        loadModels();
        checkFaceStatus();
        return () => stopCamera();
    }, []);

    useEffect(() => {
        if (cameraActive && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => { });
            startFaceDetection();
        }
    }, [cameraActive]);

    const loadModels = async () => {
        try {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            setModelsLoaded(true);
        } catch (err) {
            console.error('Failed to load face models:', err);
            toast.error('Failed to load face recognition models.');
        } finally {
            setLoading(false);
        }
    };

    const checkFaceStatus = async () => {
        try {
            const res = await api.get('/face/status');
            setFaceStatus(res.data);
        } catch {

        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = stream;
            setCameraActive(true);
        } catch (err) {
            console.error('Camera access denied:', err);
            toast.error('Camera access denied. Please allow camera permissions.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }
        setCameraActive(false);
        setFaceDetected(false);
    };

    const startFaceDetection = useCallback(() => {
        if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

        detectionIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState !== 4) return;

            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }));

            setFaceDetected(!!detection);
        }, 300);
    }, []);

    const captureFrame = async () => {
        if (!videoRef.current || detecting) return;

        setDetecting(true);
        try {
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                toast.error('No face detected! Make sure your face is clearly visible.');
                return;
            }

            const canvas = canvasRef.current;
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
            const photoData = canvas.toDataURL('image/jpeg', 0.7);

            const newCapture = {
                descriptor: Array.from(detection.descriptor),
                photo: photoData,
                label: CAPTURE_LABELS[captures.length] || `capture_${captures.length + 1}`,
                timestamp: Date.now(),
            };

            setCaptures(prev => [...prev, newCapture]);
            toast.success(`Capture ${captures.length + 1}/${REQUIRED_CAPTURES} saved!`);
        } catch (err) {
            console.error('Capture error:', err);
            toast.error('Failed to capture face. Try again.');
        } finally {
            setDetecting(false);
        }
    };

    const removeCapture = (index) => {
        setCaptures(prev => prev.filter((_, i) => i !== index));
    };

    const submitRegistration = async () => {
        if (captures.length < 3) {
            toast.error('Please capture at least 3 face images.');
            return;
        }

        setSubmitting(true);
        try {
            const embeddings = captures.map(c => ({
                descriptor: c.descriptor,
                photo: c.photo,
                label: c.label,
            }));

            const res = await api.post('/face/register', { embeddings });
            toast.success(res.data.message);
            stopCamera();
            setCaptures([]);
            await checkFaceStatus();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to register face.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetRegistration = async () => {
        try {
            await api.delete('/face/reset');
            toast.success('Face data reset. Please register again.');
            setFaceStatus(null);
            setCaptures([]);
            await checkFaceStatus();
        } catch (err) {
            toast.error('Failed to reset face data.');
        }
    };

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title">Face Registration</h1>
                    <p className="page-subtitle">Loading face recognition models...</p>
                </div>
                <div className="loading-spinner"><div className="spinner" /></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Face Registration</h1>
                <p className="page-subtitle">Register your face for automated attendance marking</p>
            </div>
            <div className="page-content fade-in">
                <div style={{ maxWidth: 600, margin: '0 auto' }}>

                    {faceStatus?.registered && !cameraActive && captures.length === 0 && (
                        <div style={{
                            padding: 24, borderRadius: 'var(--radius-md)', marginBottom: 24,
                            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                            textAlign: 'center',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#22c55e' }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
                                </svg>
                            </div>
                            <h3 style={{ marginBottom: 8 }}>Face Already Registered</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                                {faceStatus.message}
                            </p>
                            <button className="btn btn-secondary" onClick={resetRegistration}>
                                Re-register Face
                            </button>
                        </div>
                    )}

                    {!faceStatus?.registered && !cameraActive && captures.length === 0 && (
                        <div style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)', padding: 40, textAlign: 'center',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                                <IconFace />
                            </div>
                            <h3 style={{ marginBottom: 8 }}>Face Not Registered</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                                Register your face to enable automated attendance via face scan.
                                You'll need to capture {REQUIRED_CAPTURES} photos from different angles.
                            </p>
                            <button className="btn btn-primary btn-lg" onClick={startCamera} disabled={!modelsLoaded}>
                                {modelsLoaded ? 'Start Registration' : 'Loading Models...'}
                            </button>
                        </div>
                    )}

                    {(cameraActive || captures.length > 0) && (
                        <>
                            <div style={{
                                display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
                            }}>
                                {Array.from({ length: REQUIRED_CAPTURES }).map((_, i) => (
                                    <div key={i} style={{
                                        flex: 1, minWidth: 80, height: 6, borderRadius: 3,
                                        background: i < captures.length
                                            ? '#22c55e'
                                            : 'var(--border-color)',
                                        transition: 'background 0.3s',
                                    }} />
                                ))}
                            </div>

                            {cameraActive && captures.length < REQUIRED_CAPTURES && (
                                <div style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 20,
                                    position: 'relative', zIndex: 1,
                                }}>
                                    <div style={{ position: 'relative' }}>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }}
                                        />
                                        <div style={{
                                            position: 'absolute', bottom: 12, left: 12, right: 12,
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}>
                                            <span style={{
                                                background: faceDetected ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)',
                                                color: '#fff', padding: '6px 14px', borderRadius: 20,
                                                fontSize: 13, fontWeight: 600,
                                                display: 'flex', alignItems: 'center', gap: 6,
                                            }}>
                                                <span style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: '#fff', display: 'inline-block',
                                                    animation: faceDetected ? 'pulse 2s infinite' : 'none',
                                                }} />
                                                {faceDetected ? 'Face Detected' : 'No Face Detected'}
                                            </span>
                                            <span style={{
                                                background: 'rgba(0,0,0,0.6)', color: '#fff',
                                                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                                            }}>
                                                {captures.length}/{REQUIRED_CAPTURES}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ padding: 20, textAlign: 'center' }}>
                                        <p style={{
                                            color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16,
                                            fontWeight: 500,
                                        }}>
                                            {CAPTURE_LABELS[captures.length] || 'Capture another angle'}
                                        </p>
                                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                            <button
                                                className="btn btn-primary"
                                                onClick={captureFrame}
                                                disabled={!faceDetected || detecting}
                                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                            >
                                                {detecting ? (
                                                    <><div className="spinner" style={{ width: 16, height: 16 }} /> Processing...</>
                                                ) : (
                                                    <><IconCamera /> Capture</>
                                                )}
                                            </button>
                                            <button className="btn btn-secondary" onClick={stopCamera}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            {captures.length > 0 && (
                                <div style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 20,
                                }}>
                                    <h4 style={{ marginBottom: 16 }}>Captured Photos ({captures.length}/{REQUIRED_CAPTURES})</h4>
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12,
                                    }}>
                                        {captures.map((cap, i) => (
                                            <div key={cap.timestamp} style={{ position: 'relative' }}>
                                                <img
                                                    src={cap.photo}
                                                    alt={cap.label}
                                                    style={{
                                                        width: '100%', aspectRatio: '1', objectFit: 'cover',
                                                        borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)',
                                                        transform: 'scaleX(-1)',
                                                    }}
                                                />
                                                <button
                                                    onClick={() => removeCapture(i)}
                                                    style={{
                                                        position: 'absolute', top: 4, right: 4,
                                                        background: 'rgba(239,68,68,0.85)', color: '#fff',
                                                        border: 'none', borderRadius: '50%', width: 22, height: 22,
                                                        fontSize: 12, cursor: 'pointer', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center',
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                                <div style={{
                                                    fontSize: 11, color: 'var(--text-muted)', textAlign: 'center',
                                                    marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {cap.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {captures.length >= 3 && (
                                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                                    {captures.length < REQUIRED_CAPTURES && !cameraActive && (
                                        <button className="btn btn-secondary" onClick={startCamera} style={{ flex: 1 }}>
                                            Capture More
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-primary"
                                        onClick={submitRegistration}
                                        disabled={submitting}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    >
                                        {submitting ? (
                                            <><div className="spinner" style={{ width: 16, height: 16 }} /> Registering...</>
                                        ) : (
                                            <><IconCheck /> Register Face ({captures.length} captures)</>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    <div style={{
                        marginTop: 20, padding: 20, background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                    }}>
                        <h4 style={{ marginBottom: 12 }}>How it works</h4>
                        <ol style={{
                            color: 'var(--text-secondary)', fontSize: 14, paddingLeft: 20,
                            display: 'flex', flexDirection: 'column', gap: 8,
                        }}>
                            <li>Allow camera access when prompted</li>
                            <li>Capture {REQUIRED_CAPTURES} photos from different angles</li>
                            <li>Your face data is securely stored as mathematical embeddings</li>
                            <li>During class, scan your face to mark attendance instantly</li>
                        </ol>
                    </div>

                    <div style={{
                        marginTop: 12, padding: 16, fontSize: 13, color: 'var(--text-muted)',
                        background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(99,102,241,0.15)',
                    }}>
                        <strong>Privacy:</strong> Your actual photos are not stored permanently.
                        Only 128-dimensional mathematical vectors (face descriptors) are saved,
                        which cannot be reverse-engineered back to your face image.
                    </div>
                </div>
            </div>
        </>
    );
};

export default FaceRegistration;
