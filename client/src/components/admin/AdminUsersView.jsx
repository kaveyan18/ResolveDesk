import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import TableSkeleton from '../common/TableSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Loader2,
  X,
  Users,
} from 'lucide-react';

export default function AdminUsersView() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Student',
    department: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  // Load Departments for Modal Select
  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await api.getDepartments();
        if (res.status === 'success' && res.data) {
          setDepartments(res.data.departments || []);
        }
      } catch (err) {
        console.error('Error loading departments for user modal:', err);
      }
    }
    loadDepts();
  }, []);

  // Fetch Users List
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (roleFilter !== 'All') params.append('role', roleFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await api.getAdminUsers(queryStr);
      if (res.status === 'success' && res.data) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users list.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Actions
  const handleApprove = async (id) => {
    try {
      await api.approveStaffUser(id);
      fetchUsers();
    } catch (err) {
      console.error('Failed to approve user:', err);
      setError(err.message || 'Failed to approve staff user.');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await api.toggleUserActive(id);
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle user active status:', err);
      setError(err.message || 'Failed to update user status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteAdminUser(id);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError(err.message || 'Failed to delete user.');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Student',
      department: '',
      phone: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'Student',
      department: u.department?._id || u.department || '',
      phone: u.phone || '',
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      if (editingUser) {
        await api.updateAdminUser(editingUser._id, formData);
      } else {
        await api.createAdminUser(formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Failed to save user:', err);
      setError(err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const renderRoleBadge = (role) => {
    const roleStyles = {
      Student: 'bg-brand-soft text-brand border-blue-200',
      Technician: 'bg-purple-soft text-purple border-purple-200',
      DepartmentHead: 'bg-amber-50 text-amber-800 border-amber-200',
      Admin: 'bg-red-50 text-status-danger border-red-200',
    };
    const style = roleStyles[role] || roleStyles.Student;
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${style}`}>
        {role === 'DepartmentHead' ? 'Dept Head' : role}
      </span>
    );
  };

  const renderStatusBadge = (u) => {
    if (!u.isActive) {
      const isPendingStaff = ['Technician', 'DepartmentHead'].includes(u.role);
      if (isPendingStaff) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-800 border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" /> Pending Approval
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-red-50 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 text-status-danger" /> Disabled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200">
        <CheckCircle className="w-3 h-3 text-status-success" /> Active
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PAGE HEADER WITH CREATE USER ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink">User Management</h1>
          <p className="text-sm text-ink-muted mt-0.5">{users.length} registered users.</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Create User
        </button>
      </div>

      {/* TOOLBAR & FILTERS */}
      <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-card">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Search Box */}
            <div className="flex items-center gap-2 bg-surface-bg border border-surface-border rounded-xl px-3 py-1.5 w-full sm:w-64 text-ink-muted">
              <Search className="w-4 h-4 opacity-50 flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by name/email..."
                className="bg-transparent border-none text-xs w-full focus:outline-none text-ink placeholder:text-ink-muted"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-ink font-semibold">
              <Filter className="w-3.5 h-3.5 text-ink-muted" />
              <span>Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent border-none focus:outline-none cursor-pointer font-bold text-brand"
              >
                <option value="All">All Roles</option>
                <option value="Student">Student</option>
                <option value="Technician">Technician</option>
                <option value="DepartmentHead">Department Head</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-ink font-semibold">
              <Filter className="w-3.5 h-3.5 text-ink-muted" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none focus:outline-none cursor-pointer font-bold text-brand"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={fetchUsers} />}

      {/* USERS TABLE */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            message="No user accounts match your current search or filter parameters."
            actionLabel={searchTerm || roleFilter !== 'All' || statusFilter !== 'All' ? 'Reset Filters' : undefined}
            onAction={() => {
              setSearchTerm('');
              setRoleFilter('All');
              setStatusFilter('All');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">Name</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Department</th>
                  <th className="pb-3 px-3">Email</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 md:divide-y divide-surface-border text-xs block md:table-row-group">
                {users.map((u) => {
                  const isPendingStaff =
                    !u.isActive && ['Technician', 'DepartmentHead'].includes(u.role);

                  return (
                    <tr
                      key={u._id}
                      className="block md:table-row p-4 border border-surface-border rounded-2xl mb-3 bg-white hover:bg-surface-bg/60 transition shadow-xs md:shadow-none md:border-none md:mb-0 md:p-0"
                    >
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-semibold text-ink">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Name</span>
                        <span>{u.name}</span>
                      </td>
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Role</span>
                        {renderRoleBadge(u.role)}
                      </td>
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 text-ink-muted">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Department</span>
                        <span>{u.department?.name || 'General'}</span>
                      </td>
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-mono text-ink-muted">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Email</span>
                        <span>{u.email}</span>
                      </td>
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Status</span>
                        {renderStatusBadge(u)}
                      </td>
                      <td className="flex justify-between items-center py-2 md:table-cell md:py-3.5 md:px-3 md:text-right space-x-1.5">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Actions</span>
                        <div className="flex items-center gap-1.5 justify-end">
                          {isPendingStaff && (
                            <button
                              onClick={() => handleApprove(u._id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition shadow-xs cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="px-2.5 py-1 bg-white border border-surface-border text-ink rounded-lg text-xs font-semibold hover:border-brand hover:text-brand transition shadow-subtle inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(u._id)}
                            className={`px-2.5 py-1 border rounded-lg text-xs font-semibold transition cursor-pointer ${
                              u.isActive
                                ? 'bg-red-50 border-red-200 text-status-danger hover:bg-red-100'
                                : 'bg-emerald-50 border-emerald-200 text-status-success hover:bg-emerald-100'
                            }`}
                          >
                            {u.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="p-1 text-ink-muted hover:text-status-danger transition cursor-pointer"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-surface-border max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-bold font-display text-ink">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-ink-muted uppercase text-[10.5px]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Priya K."
                  className="w-full p-2.5 border border-surface-border rounded-xl bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-ink-muted uppercase text-[10.5px]">
                  College Email
                </label>
                <input
                  type="email"
                  required
                  disabled={Boolean(editingUser)}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@kct.ac.in"
                  className="w-full p-2.5 border border-surface-border rounded-xl bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              {!editingUser && (
                <div className="space-y-1">
                  <label className="block font-semibold text-ink-muted uppercase text-[10.5px]">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full p-2.5 border border-surface-border rounded-xl bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-ink-muted uppercase text-[10.5px]">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 border border-surface-border rounded-xl bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand font-semibold text-brand cursor-pointer"
                  >
                    <option value="Student">Student</option>
                    <option value="Technician">Technician</option>
                    <option value="DepartmentHead">Department Head</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-ink-muted uppercase text-[10.5px]">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 border border-surface-border rounded-xl bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="">None / General</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-surface-border text-ink rounded-xl font-semibold hover:bg-surface-bg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
