import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Plus,
  Edit,
  Trash2,
  Building,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';

export default function AdminDepartmentsView() {
  const [departments, setDepartments] = useState([]);
  const [headsList, setHeadsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    head: '',
  });
  const [saving, setSaving] = useState(false);

  // Fetch Department Heads list for select dropdown
  useEffect(() => {
    async function loadHeads() {
      try {
        const res = await api.getAdminUsers('?role=DepartmentHead');
        if (res.status === 'success' && res.data) {
          setHeadsList(res.data.users || []);
        }
      } catch (err) {
        console.error('Error loading department heads:', err);
      }
    }
    loadHeads();
  }, []);

  // Fetch Departments
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDepartments();
      if (res.status === 'success' && res.data) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
      setError(err.message || 'Failed to load departments list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      head: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (d) => {
    setEditingDept(d);
    setFormData({
      name: d.name || '',
      code: d.code || '',
      description: d.description || '',
      head: d.head?._id || d.head || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this department?')) return;
    try {
      await api.deleteDepartment(id);
      fetchDepartments();
    } catch (err) {
      console.error('Failed to delete department:', err);
      setError(err.message || 'Failed to delete department.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      if (editingDept) {
        await api.updateDepartment(editingDept._id, formData);
      } else {
        await api.createDepartment(formData);
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      console.error('Failed to save department:', err);
      setError(err.message || 'Failed to save department.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono text-ink-muted">Loading departments list...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PAGE HEADER WITH ADD DEPARTMENT ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink">Departments</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {departments.length} department{departments.length === 1 ? '' : 's'} configured.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDepartments}
            className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* DEPARTMENTS TABLE PANEL */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        {departments.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-ink-muted">
            <Building className="w-8 h-8 opacity-40 mx-auto" />
            <p className="text-sm font-semibold text-ink">No departments configured</p>
            <p className="text-xs">Click &quot;Add Department&quot; above to create your first department.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">Department</th>
                  <th className="pb-3 px-3">Head</th>
                  <th className="pb-3 px-3">Staff Count</th>
                  <th className="pb-3 px-3">Total Complaints</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {departments.map((d) => (
                  <tr key={d._id} className="hover:bg-surface-bg/60 transition">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-ink">{d.name}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-bg border border-surface-border text-ink-muted">
                          {d.code}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-brand">
                      {d.head?.name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-ink">{d.staffCount}</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-ink-muted">
                      {d.totalComplaints}
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenEditModal(d)}
                        className="px-3 py-1 bg-white border border-surface-border text-ink rounded-lg text-xs font-semibold hover:border-brand hover:text-brand transition shadow-subtle inline-flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(d._id)}
                        className="p-1 text-slate-400 hover:text-status-danger transition"
                        title="Delete Department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT DEPARTMENT MODAL DIALOG */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-surface-border max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-bold font-display text-ink">
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-ink-muted hover:text-ink rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Electrical"
                  className="w-full p-2.5 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand transition"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Department Code (Uppercase)
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ELEC"
                  className="w-full p-2.5 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand transition font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Department Head
                </label>
                <select
                  value={formData.head}
                  onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                  className="w-full p-2.5 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand transition font-semibold text-brand"
                >
                  <option value="">Select Department Head (Optional)</option>
                  {headsList.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name} ({h.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of responsibilities..."
                  className="w-full p-2.5 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand transition"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-surface-bg text-ink rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
