import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const IconUsers = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const FacultyStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [sectionFilter, setSectionFilter] = useState('');
    const [subSectionFilter, setSubSectionFilter] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get('/users/faculty/students');
                setStudents(res.data.students || []);
            } catch (error) {
                toast.error('Failed to load your students');
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    // Extract unique sections and sub-sections for the dropdowns
    const uniqueSections = useMemo(() => {
        const sections = students.map(s => s.section).filter(Boolean);
        return [...new Set(sections)].sort();
    }, [students]);

    const uniqueSubSections = useMemo(() => {
        let filtered = students;
        if (sectionFilter) {
            filtered = students.filter(s => s.section === sectionFilter);
        }
        const subSections = filtered.map(s => s.sub_section).filter(Boolean);
        return [...new Set(subSections)].sort();
    }, [students, sectionFilter]);

    // Derived filtered list of students
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            if (sectionFilter && s.section !== sectionFilter) return false;
            if (subSectionFilter && s.sub_section !== subSectionFilter) return false;
            return true;
        });
    }, [students, sectionFilter, subSectionFilter]);

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title">My Students</h1>
                    <p className="page-subtitle">Directory of students enrolled in your classes</p>
                </div>
                <div className="loading-spinner"><div className="spinner"></div></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="icon-container" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)' }}>
                        <IconUsers />
                    </div>
                    <div>
                        <h1 className="page-title">My Students</h1>
                        <p className="page-subtitle">Directory of students enrolled in your classes</p>
                    </div>
                </div>
            </div>

            <div className="page-content fade-in">
                <div className="chart-card">
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
                            <label>Filter by Section</label>
                            <select
                                className="input-field"
                                value={sectionFilter}
                                onChange={e => {
                                    setSectionFilter(e.target.value);
                                    setSubSectionFilter(''); // Reset sub-section when section changes
                                }}
                            >
                                <option value="">All Sections</option>
                                {uniqueSections.map(sec => (
                                    <option key={sec} value={sec}>{sec}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
                            <label>Filter by Sub-Section</label>
                            <select
                                className="input-field"
                                value={subSectionFilter}
                                onChange={e => setSubSectionFilter(e.target.value)}
                                disabled={!sectionFilter && uniqueSubSections.length > 0}
                            >
                                <option value="">All Sub-Sections</option>
                                {uniqueSubSections.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Enrollment No</th>
                                    <th>Department</th>
                                    <th>Section</th>
                                    <th>Sub-Section</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => (
                                    <tr key={student.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{student.email}</div>
                                        </td>
                                        <td><span className="badge">{student.enrollment_no || 'N/A'}</span></td>
                                        <td>{student.department_name || '-'}</td>
                                        <td>{student.section || '-'}</td>
                                        <td>{student.sub_section || '-'}</td>
                                    </tr>
                                ))}
                                {filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                            No students found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FacultyStudents;
