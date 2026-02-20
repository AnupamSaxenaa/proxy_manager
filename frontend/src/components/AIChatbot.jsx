import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const IconBot = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
);

const IconClose = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconSend = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Hi! I'm Classiq Assist. Ask me about your attendance, schedule, or anything campus-related!" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: userMsg });
            if (res.data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', text: "I'm sorry, I couldn't process that. Try asking something else!" }]);
            }
        } catch (error) {
            console.error(error);
            const errText = error.response?.data?.error || "Connection error. Please try again later.";
            setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${errText}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
            {/* FAB Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="btn btn-primary"
                    style={{
                        width: 60, height: 60, borderRadius: 30, padding: 0,
                        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white',
                        animation: 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                >
                    <IconBot />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    width: 350,
                    height: 500,
                    maxWidth: 'calc(100vw - 48px)',
                    maxHeight: 'calc(100vh - 100px)',
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--glass-shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'slideUp 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05))',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 18,
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white'
                            }}>
                                <IconBot />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 15 }}>Classiq Assist</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Powered by AI</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        >
                            <IconClose />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1, overflowY: 'auto', padding: 20,
                        display: 'flex', flexDirection: 'column', gap: 16
                    }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                padding: '12px 16px',
                                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                background: msg.role === 'user' ? 'var(--text-primary)' : 'var(--bg-input)',
                                color: msg.role === 'user' ? 'var(--bg-primary)' : 'var(--text-primary)',
                                fontSize: 14,
                                lineHeight: 1.5,
                                border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{
                                alignSelf: 'flex-start', padding: '12px 16px',
                                borderRadius: '20px 20px 20px 4px', background: 'var(--bg-input)',
                                border: '1px solid var(--border-color)', display: 'flex', gap: 6
                            }}>
                                <div className="typing-dot"></div>
                                <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                                <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} style={{
                        padding: 16, borderTop: '1px solid var(--border-color)',
                        display: 'flex', gap: 10, background: 'var(--bg-card)'
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            disabled={isLoading}
                            style={{
                                flex: 1, padding: '12px 16px', borderRadius: 24,
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-input)', color: 'var(--text-primary)',
                                outline: 'none', fontSize: 14
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            style={{
                                width: 42, height: 42, borderRadius: 21,
                                background: input.trim() && !isLoading ? 'var(--text-primary)' : 'var(--bg-input)',
                                color: input.trim() && !isLoading ? 'var(--bg-primary)' : 'var(--text-muted)',
                                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s'
                            }}
                        >
                            <IconSend />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AIChatbot;
