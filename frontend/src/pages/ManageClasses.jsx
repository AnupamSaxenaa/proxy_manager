import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import TypeToConfirmModal from '../components/TypeToConfirmModal';

const IconPlus = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const ManageClasses = () => {
    const [tab, setTab] = useState('classes');
    const [classes, setClasses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [classForm, setClassForm] = useState({
        course_id: '', faculty_id: '', room_no: '', day_of_week: 'Monday',
        start_time: '09:00', end_time: '10:00', section: 'A', semester: '', academic_year: '2025-26',
    });
    const [courseForm, setCourseForm] = useState({
        name: '', code: '', department_id: '', semester: '', credits: 3,
    });

    const [selectedClass, setSelectedClass] = useState(null);
    const [classStudents, setClassStudents] = useState([]);
    const [enrollSearch, setEnrollSearch] = useState('');
    const [enrollResults, setEnrollResults] = useState([]);

    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Delete',
        expectedText: 'DELETE',
        onConfirm: () => { }
    });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [clsRes, courseRes, deptRes, facRes, stuRes] = await Promise.all([
                api.get('/classes'),
                api.get('/classes/courses/all'),
                api.get('/users/departments/all'),
                api.get('/users?role=faculty&limit=200'),
                api.get('/users?role=student&limit=500'),
            ]);
            setClasses(clsRes.data.classes || []);
            setCourses(courseRes.data.courses || []);
            setDepartments(deptRes.data.departments || []);
            setFaculty(facRes.data.users || []);
            setStudents(stuRes.data.users || []);
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            await api.post('/classes', classForm);
            toast.success('Class created!');
            setShowForm(false);
            setClassForm({ course_id: '', faculty_id: '', room_no: '', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', section: 'A', semester: '', academic_year: '2025-26' });
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create class');
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            await api.post('/classes/courses', courseForm);
            toast.success('Course created!');
            setShowForm(false);
            setCourseForm({ name: '', code: '', department_id: '', semester: '', credits: 3 });
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create course');
        }
    };

    const fetchClassStudents = async (classId) => {
        try {
            const res = await api.get(`/classes/${classId}/students`);
            setClassStudents(res.data.students || []);
        } catch {
            toast.error('Failed to load students');
        }
    };

    const handleSelectClass = (cls) => {
        setSelectedClass(cls);
        fetchClassStudents(cls.id);
        setEnrollSearch('');
        setEnrollResults([]);
    };

    const searchStudents = (query) => {
        setEnrollSearch(query);
        if (!query.trim()) { setEnrollResults([]); return; }
        const q = query.toLowerCase();
        const enrolled = new Set(classStudents.map(s => s.id));
        setEnrollResults(
            students.filter(s =>
                !enrolled.has(s.id) &&
                (s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.enrollment_no?.toLowerCase().includes(q))
            ).slice(0, 10)
        );
    };

    const enrollStudent = async (studentId) => {
        if (!selectedClass) return;
        try {
            await api.post(`/classes/${selectedClass.id}/enroll`, { student_ids: [studentId] });
            toast.success('Student enrolled!');
            fetchClassStudents(selectedClass.id);
            searchStudents(enrollSearch);
        } catch {
            toast.error('Failed to enroll');
        }
    };

    const handleDeleteClass = (id) => {
        setDeleteModal({
            isOpen: true,
            title: 'Delete Class',
            message: 'Are you sure you want to delete this class? This will also remove all class sessions and attendances.',
            confirmText: 'Delete Class',
            expectedText: 'DELETE',
            onConfirm: async () => {
                setDeleteModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.delete(`/classes/${id}`);
                    toast.success('Class deleted successfully');
                    fetchAll();
                    if (selectedClass?.id === id) setSelectedClass(null);
                } catch { toast.error('Failed to delete class'); }
            }
        });
    };

    const handleClearClasses = () => {
        setDeleteModal({
            isOpen: true,
            title: 'Clear All Classes',
            message: 'Are you sure you want to delete ALL classes? This action is irreversible.',
            confirmText: 'Clear Classes',
            expectedText: 'CLEAR ALL',
            onConfirm: async () => {
                setDeleteModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.delete('/classes');
                    toast.success('All classes cleared');
                    fetchAll();
                    setSelectedClass(null);
                } catch { toast.error('Failed to clear classes'); }
            }
        });
    };

    const handleDeleteCourse = (id) => {
        setDeleteModal({
            isOpen: true,
            title: 'Delete Course',
            message: 'Are you sure you want to delete this course? This will also remove all classes associated with it.',
            confirmText: 'Delete Course',
            expectedText: 'DELETE',
            onConfirm: async () => {
                setDeleteModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.delete(`/classes/courses/${id}`);
                    toast.success('Course deleted successfully');
                    fetchAll();
                } catch { toast.error('Failed to delete course'); }
            }
        });
    };

    const handleClearCourses = () => {
        setDeleteModal({
            isOpen: true,
            title: 'Clear All Courses',
            message: 'Are you sure you want to delete ALL courses? This action is irreversible.',
            confirmText: 'Clear Courses',
            expectedText: 'CLEAR ALL',
            onConfirm: async () => {
                setDeleteModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.delete('/classes/courses');
                    toast.success('All courses cleared');
                    fetchAll();
                } catch { toast.error('Failed to clear courses'); }
            }
        });
    };

    const handleRemoveStudent = (studentId) => {
        if (!selectedClass) return;
        setDeleteModal({
            isOpen: true,
            title: 'Remove Student',
            message: 'Are you sure you want to remove this student from the class?',
            confirmText: 'Remove Student',
            expectedText: 'REMOVE',
            onConfirm: async () => {
                setDeleteModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.delete(`/classes/${selectedClass.id}/students/${studentId}`);
                    toast.success('Student removed successfully');
                    fetchClassStudents(selectedClass.id);
                } catch { toast.error('Failed to remove student'); }
            }
        });
    };

    const handleClearStudents = () => {
        if (!selectedClass) return;
        setDeleteModal({
            isOpen: true,
            title: 'Clear All Students',
            message: 'Are you sure you want to remove ALL enrolled students from this class?',
            confirmText: 'Clear Students',
            expectedText: 'CLEAR ALL',
            onConfirm: async () => {
                setDeleteModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.delete(`/classes/${selectedClass.id}/students`);
                    toast.success('All students removed');
                    fetchClassStudents(selectedClass.id);
                } catch { toast.error('Failed to clear students'); }
            }
        });
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title gradient-text">Manage Classes</h1>
                    <p className="page-subtitle">Classes, courses &amp; enrollment</p>
                </div>
                <div className="loading-spinner"><div className="spinner"></div></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title gradient-text">Manage Classes</h1>
                <p className="page-subtitle">Assign classes to faculty, manage courses, and enroll students</p>
            </div>
            <div className="page-content fade-in">
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    {['classes', 'courses', 'students'].map(t => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setShowForm(false); }}
                            className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {tab === 'classes' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div className="chart-title">All Classes ({classes.length})</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {classes.length > 0 && (
                                    <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} onClick={handleClearClasses}>
                                        Clear All
                                    </button>
                                )}
                                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <IconPlus /> Add Class
                                </button>
                            </div>
                        </div>

                        {showForm && (
                            <form onSubmit={handleCreateClass} className="chart-card" style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 12, padding: 20 }}>
                                <div className="input-group">
                                    <label>Course</label>
                                    <select className="input-field" value={classForm.course_id} onChange={e => setClassForm({ ...classForm, course_id: e.target.value })} required>
                                        <option value="">Select course</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Faculty</label>
                                    <select className="input-field" value={classForm.faculty_id} onChange={e => setClassForm({ ...classForm, faculty_id: e.target.value })} required>
                                        <option value="">Select faculty</option>
                                        {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Day</label>
                                    <select className="input-field" value={classForm.day_of_week} onChange={e => setClassForm({ ...classForm, day_of_week: e.target.value })}>
                                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Start Time</label>
                                    <input type="time" className="input-field" value={classForm.start_time} onChange={e => setClassForm({ ...classForm, start_time: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label>End Time</label>
                                    <input type="time" className="input-field" value={classForm.end_time} onChange={e => setClassForm({ ...classForm, end_time: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label>Room</label>
                                    <input type="text" className="input-field" value={classForm.room_no} onChange={e => setClassForm({ ...classForm, room_no: e.target.value })} placeholder="e.g., A-301" />
                                </div>
                                <div className="input-group">
                                    <label>Section</label>
                                    <input type="text" className="input-field" value={classForm.section} onChange={e => setClassForm({ ...classForm, section: e.target.value })} placeholder="A" />
                                </div>
                                <div className="input-group">
                                    <label>Semester</label>
                                    <input type="number" className="input-field" value={classForm.semester} onChange={e => setClassForm({ ...classForm, semester: e.target.value })} placeholder="e.g., 6" />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
                                    <button type="submit" className="btn btn-primary">Create Class</button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                </div>
                            </form>
                        )}

                        <div className="data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Faculty</th>
                                        <th>Day</th>
                                        <th>Time</th>
                                        <th>Room</th>
                                        <th>Section</th>
                                        <th style={{ width: 40, textAlign: 'center' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map(c => (
                                        <tr key={c.id}>
                                            <td>
                                                <strong>{c.course_code}</strong>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.course_name}</div>
                                            </td>
                                            <td>{c.faculty_name}</td>
                                            <td>{c.day_of_week}</td>
                                            <td>{c.start_time} – {c.end_time}</td>
                                            <td>{c.room_no || '—'}</td>
                                            <td><span className="badge badge-faculty">{c.section || 'A'}</span></td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button onClick={() => handleDeleteClass(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {classes.length === 0 && (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No classes yet. Click "Add Class" to create one.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {tab === 'courses' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div className="chart-title">All Courses ({courses.length})</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {courses.length > 0 && (
                                    <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} onClick={handleClearCourses}>
                                        Clear All
                                    </button>
                                )}
                                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <IconPlus /> Add Course
                                </button>
                            </div>
                        </div>

                        {showForm && (
                            <form onSubmit={handleCreateCourse} className="chart-card" style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 12, padding: 20 }}>
                                <div className="input-group">
                                    <label>Course Name</label>
                                    <input type="text" className="input-field" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} placeholder="Data Structures" required />
                                </div>
                                <div className="input-group">
                                    <label>Course Code</label>
                                    <input type="text" className="input-field" value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} placeholder="CS301" required />
                                </div>
                                <div className="input-group">
                                    <label>Department</label>
                                    <select className="input-field" value={courseForm.department_id} onChange={e => setCourseForm({ ...courseForm, department_id: e.target.value })} required>
                                        <option value="">Select department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Semester</label>
                                    <input type="number" className="input-field" value={courseForm.semester} onChange={e => setCourseForm({ ...courseForm, semester: e.target.value })} placeholder="6" />
                                </div>
                                <div className="input-group">
                                    <label>Credits</label>
                                    <input type="number" className="input-field" value={courseForm.credits} onChange={e => setCourseForm({ ...courseForm, credits: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
                                    <button type="submit" className="btn btn-primary">Create Course</button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                </div>
                            </form>
                        )}

                        <div className="data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Name</th>
                                        <th>Department</th>
                                        <th>Semester</th>
                                        <th>Credits</th>
                                        <th style={{ width: 40, textAlign: 'center' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map(c => (
                                        <tr key={c.id}>
                                            <td><strong>{c.code}</strong></td>
                                            <td>{c.name}</td>
                                            <td>{c.department_name}</td>
                                            <td>{c.semester || '—'}</td>
                                            <td>{c.credits}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button onClick={() => handleDeleteCourse(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {courses.length === 0 && (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No courses yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {tab === 'students' && (
                    <>
                        <div className="chart-title" style={{ marginBottom: 16 }}>Enroll Students in a Class</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="chart-card" style={{ padding: 20 }}>
                                <div style={{ fontWeight: 600, marginBottom: 12 }}>Select a Class</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                                    {classes.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelectClass(c)}
                                            style={{
                                                background: selectedClass?.id === c.id ? 'var(--primary-500)' : 'var(--bg-secondary)',
                                                color: selectedClass?.id === c.id ? '#fff' : 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 'var(--radius-sm)',
                                                padding: '10px 14px',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontFamily: 'Inter, sans-serif',
                                                fontSize: 13,
                                            }}
                                        >
                                            <strong>{c.course_code}</strong> — {c.course_name}
                                            <div style={{ fontSize: 11, opacity: 0.7 }}>{c.day_of_week} {c.start_time} · {c.faculty_name}</div>
                                        </button>
                                    ))}
                                    {classes.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Create a class first.</p>}
                                </div>
                            </div>

                            <div className="chart-card" style={{ padding: 20 }}>
                                {selectedClass ? (
                                    <>
                                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{selectedClass.course_code} — {selectedClass.course_name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{selectedClass.day_of_week} {selectedClass.start_time} · {selectedClass.faculty_name}</div>

                                        <div className="input-group" style={{ marginBottom: 12 }}>
                                            <label>Search &amp; Add Students</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Search by name, email, or enrollment no..."
                                                value={enrollSearch}
                                                onChange={e => searchStudents(e.target.value)}
                                            />
                                        </div>

                                        {enrollResults.length > 0 && (
                                            <div style={{ marginBottom: 16, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', maxHeight: 180, overflowY: 'auto' }}>
                                                {enrollResults.map(s => (
                                                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                                                        <div>
                                                            <div style={{ fontWeight: 500 }}>{s.name}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.enrollment_no || s.email}</div>
                                                        </div>
                                                        <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => enrollStudent(s.id)}>
                                                            Enroll
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>Enrolled ({classStudents.length})</div>
                                            {classStudents.length > 0 && (
                                                <button onClick={handleClearStudents} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', opacity: 0.8 }}>
                                                    Remove All
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                            {classStudents.map(s => (
                                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                                                    <div>
                                                        <span>{s.name}</span>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{s.enrollment_no || s.email}</span>
                                                    </div>
                                                    <button onClick={() => handleRemoveStudent(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                    </button>
                                                </div>
                                            ))}
                                            {classStudents.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No students enrolled yet.</p>}
                                        </div>
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-title">Select a class</div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Choose a class from the left to manage enrollment.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <TypeToConfirmModal
                {...deleteModal}
                onCancel={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
};

export default ManageClasses;
