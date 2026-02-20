import React, { useState } from 'react';

const TypeToConfirmModal = ({ isOpen, title, message, confirmText, expectedText, onConfirm, onCancel }) => {
    const [inputValue, setInputValue] = useState('');

    if (!isOpen) return null;

    const isMatch = inputValue === expectedText;

    const handleConfirm = () => {
        if (isMatch) {
            setInputValue('');
            onConfirm();
        }
    };

    const handleCancel = () => {
        setInputValue('');
        onCancel();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="chart-card" style={{ maxWidth: 400, width: '90%', margin: 16 }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                    {message}
                </p>

                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: 12, marginBottom: 20 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                        Please type <strong>{expectedText}</strong> to confirm.
                    </p>
                </div>

                <input
                    type="text"
                    className="input-field"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={expectedText}
                    style={{ marginBottom: 20, width: '100%' }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        className="btn"
                        onClick={handleConfirm}
                        disabled={!isMatch}
                        style={{
                            background: isMatch ? '#ef4444' : 'var(--border-color)',
                            color: isMatch ? 'white' : 'var(--text-muted)',
                            cursor: isMatch ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TypeToConfirmModal;
