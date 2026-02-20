import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
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

const IconSearch = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const IconFilter = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
);

const ManageUsers = () => {
    const { isDark } = useTheme();
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters and Pagination
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 20 });
            if (search) params.append('search', search);
            if (roleFilter) params.append('role', roleFilter);
            if (deptFilter) params.append('department_id', deptFilter);

            const res = await api.get(`/users?${params.toString()}`);
            setUsers(res.data.users || []);
            setPagination(res.data.pagination);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/users/departments/all');
            setDepartments(res.data.departments || []);
        } catch (error) {
            console.error('Failed to load departments', error);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300); // debounce search
        return () => clearTimeout(timeoutId);
    }, [search, roleFilter, deptFilter, page]);

    const handleToggleStatus = async (id, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            if (currentStatus) {
                await api.delete(`/users/${id}`);
                toast.success('User deactivated successfully');
            } else {
                await api.patch(`/users/${id}/activate`);
                toast.success('User activated successfully');
            }
            fetchUsers();
        } catch (error) {
            toast.error(`Failed to ${action} user`);
        }
    };

    return (
        <>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ padding: 12, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '12px' }}>
                        <IconUsers />
                    </div>
                    <div>
                        <h1 className="page-title gradient-text">Manage Users</h1>
                        <p className="page-subtitle">View and manage all system users by category</p>
                    </div>
                </div>
            </div>

            <div className="page-content fade-in">
                <div style={{
                    display: 'flex',
                    gap: 16,
                    marginBottom: 24,
                    flexWrap: 'wrap',
                    background: 'var(--bg-card)',
                    padding: 20,
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ flex: '1 1 300px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                            <IconSearch />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, email, or enrollment no..."
                            className="input-field"
                            style={{ paddingLeft: 44 }}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', flex: '1 1 auto' }}>
                        <div style={{ position: 'relative', minWidth: 160 }}>
                            <select
                                className="input-field"
                                value={roleFilter}
                                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                                style={{ appearance: 'none', paddingRight: 40 }}
                            >
                                <option value="">All Roles</option>
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                                <IconFilter />
                            </div>
                        </div>

                        <div style={{ position: 'relative', minWidth: 200 }}>
                            <select
                                className="input-field"
                                value={deptFilter}
                                onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
                                style={{ appearance: 'none', paddingRight: 40 }}
                            >
                                <option value="">All Departments</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                ))}
                            </select>
                            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                                <IconFilter />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="data-table-wrapper">
                        {loading && users.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner"></div></div>
                        ) : users.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon"><IconUsers /></div>
                                <div className="empty-state-title">No users found</div>
                                <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search or filters.</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Contact</th>
                                        <th>Department / IDs</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{u.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Joined {new Date(u.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${u.role}`}>
                                                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: 13 }}>{u.email}</div>
                                                {u.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.phone}</div>}
                                            </td>
                                            <td>
                                                {u.department_code ? (
                                                    <span className="badge badge-faculty">{u.department_code}</span>
                                                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                {u.enrollment_no && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>ID: {u.enrollment_no}</div>}
                                            </td>
                                            <td>
                                                {u.is_active ? (
                                                    <span className="badge badge-present">Active</span>
                                                ) : (
                                                    <span className="badge badge-absent">Inactive</span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleToggleStatus(u.id, u.is_active)}
                                                    className="btn btn-outline"
                                                    style={{
                                                        padding: '6px 12px',
                                                        fontSize: 12,
                                                        color: 'var(--text-primary)',
                                                        borderColor: 'var(--border-color)'
                                                    }}
                                                >
                                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    className="btn btn-outline"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    style={{ padding: '6px 14px', fontSize: 13 }}
                                >
                                    Previous
                                </button>
                                <button
                                    className="btn btn-outline"
                                    disabled={page === pagination.pages}
                                    onClick={() => setPage(page + 1)}
                                    style={{ padding: '6px 14px', fontSize: 13 }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ManageUsers;
