import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const IconChevronLeft = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const IconChevronRight = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

const IconPlus = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const IconClose = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconTrash = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    </svg>
);

const Calendar = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewingDayEvents, setViewingDayEvents] = useState([]);

    const [form, setForm] = useState({
        title: '',
        description: '',
        event_type: 'class',
        is_global: false,
        target_section: '',
        target_sub_section: ''
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/calendar');
            setEvents(res.data.events || []);
        } catch (err) {
            toast.error('Failed to load classes and events');
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    };

    const getEventsForDay = (day) => {
        // Construct the strict local date string
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${d}`;
        return events.filter(e => {
            // Compare the YYYY-MM-DD prefix purely as a string
            return e.event_date && e.event_date.startsWith(dateStr);
        });
    };

    const handleDayClick = (day) => {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${d}`;

        const dayEvents = getEventsForDay(day);
        setSelectedDate(dateStr);
        setViewingDayEvents(dayEvents);
        setShowModal(true);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/calendar', { ...form, event_date: selectedDate });
            toast.success('Event added successfully!');
            setForm({ title: '', description: '', event_type: 'class', is_global: false, target_section: '', target_sub_section: '' });
            fetchEvents();

            // Update viewing list optimistically or refetch
            const newEventsList = [...events, { ...form, event_date: selectedDate, created_by: user.id, id: Date.now() }];
            setEvents(newEventsList);
            const dateStr = selectedDate;
            setViewingDayEvents(newEventsList.filter(ev => ev.event_date.startsWith(dateStr)));

        } catch (err) {
            toast.error('Failed to add event');
        }
    };

    const handleDeleteEvent = async (id) => {
        try {
            await api.delete(`/calendar/${id}`);
            toast.success('Event deleted');
            setEvents(events.filter(e => e.id !== id));
            setViewingDayEvents(viewingDayEvents.filter(e => e.id !== id));
        } catch (err) {
            toast.error('Failed to delete event');
        }
    };

    return (
        <>
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 className="page-title gradient-text">Calendar</h1>
                        <p className="page-subtitle">Track your classes, labs, and deadlines</p>
                    </div>
                </div>
            </div>

            <div className="page-content fade-in">
                <div className="chart-card" style={{ padding: 24 }}>
                    {/* Header Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%' }} onClick={handlePrevMonth}>
                                <IconChevronLeft />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%' }} onClick={handleNextMonth}>
                                <IconChevronRight />
                            </button>
                        </div>
                    </div>

                    {/* Grid Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
                        {dayNames.map(day => (
                            <div key={day} style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Grid Days */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                        {/* Empty slots for start of month */}
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} style={{ minHeight: 100, background: 'rgba(0,0,0,0.02)', borderRadius: 12, border: '1px solid transparent' }} />
                        ))}

                        {/* Actual days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayEvents = getEventsForDay(day);
                            const today = isToday(day);

                            return (
                                <div
                                    key={day}
                                    onClick={() => handleDayClick(day)}
                                    style={{
                                        minHeight: 110,
                                        background: today ? 'var(--text-primary)' : 'var(--bg-input)',
                                        color: today ? 'var(--bg-primary)' : 'var(--text-primary)',
                                        borderRadius: 12,
                                        border: today ? '1px solid var(--text-primary)' : '1px solid var(--border-color)',
                                        padding: 8,
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4
                                    }}
                                    className="calendar-day-hover"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontSize: 14, fontWeight: today ? 800 : 600 }}>{day}</span>
                                        {dayEvents.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: today ? 'var(--bg-primary)' : 'var(--text-primary)', color: today ? 'var(--text-primary)' : 'var(--bg-primary)', padding: '2px 6px', borderRadius: 10 }}>{dayEvents.length}</span>}
                                    </div>

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
                                        {dayEvents.slice(0, 3).map((ev, idx) => (
                                            <div key={idx} style={{
                                                fontSize: 11,
                                                padding: '4px 6px',
                                                background: today ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)',
                                                borderRadius: 4,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                border: today ? 'none' : '1px solid var(--border-color)'
                                            }}>
                                                • {ev.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div style={{ fontSize: 10, color: today ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', textAlign: 'center' }}>
                                                +{dayEvents.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Event Details & Creation Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div className="chart-card" style={{ width: '100%', maxWidth: 450, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Events for {selectedDate}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <IconClose />
                            </button>
                        </div>

                        <div style={{ padding: 20 }}>
                            {/* List Events */}
                            <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {viewingDayEvents.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No events scheduled for this day.</p>
                                ) : (
                                    viewingDayEvents.map(ev => {
                                        if (ev.is_class) {
                                            return (
                                                <div key={ev.id} style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: 15 }}>{ev.title}</div>
                                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                            {ev.start_time} - {ev.end_time}
                                                        </div>
                                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            {ev.description}
                                                        </div>
                                                        <div style={{ marginTop: 8 }}>
                                                            <span className="badge" style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>CLASS</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={ev.id} style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-input)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{ev.title}</div>
                                                    {ev.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{ev.description}</div>}
                                                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                                        <span className="badge">{ev.event_type}</span>
                                                        {ev.is_global === 1 && <span className="badge" style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>GLOBAL</span>}
                                                    </div>
                                                </div>
                                                {(ev.created_by === user.id || user.role === 'admin') && (
                                                    <button onClick={() => handleDeleteEvent(ev.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                                                        <IconTrash />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />

                            {/* Create Event Form */}
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Add New Event</h3>
                            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <input className="input-field" type="text" placeholder="Event Title (e.g., Database Lab)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={{ width: '100%' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <select className="input-field" value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })} style={{ width: '100%' }}>
                                        <option value="class">Class</option>
                                        <option value="lab">Lab</option>
                                        <option value="assignment">Assignment Due</option>
                                        <option value="exam">Exam</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <textarea className="input-field" placeholder="Description (Optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', minHeight: 60, resize: 'vertical' }} />
                                </div>

                                {(user.role === 'faculty' || user.role === 'admin') && (
                                    <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={form.is_global} onChange={e => setForm({ ...form, is_global: e.target.checked })} style={{ width: 16, height: 16 }} />
                                            Make this a Global Event
                                        </label>

                                        {form.is_global && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                <div>
                                                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Target Section (Optional)</label>
                                                    <input className="input-field" type="text" placeholder="e.g., A" value={form.target_section} onChange={e => setForm({ ...form, target_section: e.target.value.toUpperCase() })} style={{ width: '100%' }} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Sub-Section (Optional)</label>
                                                    <input className="input-field" type="text" placeholder="e.g., G1" value={form.target_sub_section} onChange={e => setForm({ ...form, target_sub_section: e.target.value.toUpperCase() })} style={{ width: '100%' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                                    <IconPlus /> Add to Calendar
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .calendar-day-hover:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
            `}</style>
        </>
    );
};

export default Calendar;
