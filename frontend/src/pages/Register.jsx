import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const IconAlert = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12" y2="16.01" />
    </svg>
);

const IconLogo = () => (
    <svg width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 326 148 A 118 118 0 1 0 326 364" stroke="currentColor" strokeWidth="52" strokeLinecap="round" fill="none" />
        <polyline points="296,340 326,364 390,290" stroke="currentColor" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
);

const IconSun = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const IconMoon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        department_id: '',
        enrollment_no: '',
        phone: '',
    });
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await api.get('/users/departments/all');
                setDepartments(res.data.departments);
            } catch {

            }
        };
        fetchDepartments();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match.');
        }

        if (formData.password.length < 6) {
            return setError('Password must be at least 6 characters.');
        }

        setLoading(true);
        try {
            const { confirmPassword, ...data } = formData;
            const user = await register(data);
            toast.success(`Welcome, ${user.name}! Account created.`);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page" style={{ position: 'relative' }}>
            <button className="auth-theme-toggle" onClick={toggleTheme} title="Toggle theme">
                {isDark ? <IconSun /> : <IconMoon />}
            </button>

            <div className="auth-container fade-in" style={{ maxWidth: '480px' }}>
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">
                            <IconLogo />
                        </div>
                        <h1 className="auth-title">Create Account</h1>
                        <p className="auth-subtitle">Join the attendance portal</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <IconAlert />
                            {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                className="input-field"
                                placeholder="Your full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="input-field"
                                placeholder="your.email@college.edu"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="input-field"
                                    placeholder="Min 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="input-field"
                                    placeholder="Repeat password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="input-group">
                                <label>Role</label>
                                <select name="role" className="input-field" value={formData.role} onChange={handleChange}>
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Department</label>
                                <select name="department_id" className="input-field" value={formData.department_id} onChange={handleChange}>
                                    <option value="">Select Department</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {formData.role === 'student' && (
                            <div className="input-group">
                                <label>Enrollment Number</label>
                                <input
                                    type="text"
                                    name="enrollment_no"
                                    className="input-field"
                                    placeholder="e.g., 2024CSE001"
                                    value={formData.enrollment_no}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                className="input-field"
                                placeholder="e.g., 9876543210"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
