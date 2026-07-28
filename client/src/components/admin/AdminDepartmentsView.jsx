import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import TableSkeleton from '../common/TableSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import {
  Plus,
  Edit,
  Trash2,
  Building,
  Loader2,
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
          className="px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={fetchDepartments} />}

      {/* DEPARTMENTS TABLE PANEL */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : departments.length === 0 ? (
          <EmptyState
            icon={Building}
            title="No departments configured"
            message="Click 'Add Department' above to configure your campus departments."
            actionLabel="Add Department"
            onAction={handleOpenCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">Department</th>
                  <th className="pb-3 px-3">Head</th>
                  <th className="pb-3 px-3">Staff Count</th>
                  <th className="pb-3 px-3">Total Complaints</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 md:divide-y divide-surface-border text-xs block md:table-row-group">
                {departments.map((d) => (
                  <tr
                    key={d._id}
                    className="block md:table-row p-4 border border-surface-border rounded-2xl mb-3 bg-white hover:bg-surface-bg/60 transition shadow-xs md:shadow-none md:border-none md:mb-0 md:p-0"
                  >
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Department</span>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-ink">{d.name}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-bg border border-surface-border text-ink-muted">
                          {d.code}
                        </span>
                      </div>
                    </td>
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-semibold text-brand">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Head</span>
                      <span>{d.head?.name || 'Unassigned'}</span>
                    </td>
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-mono font-bold text-ink">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Staff Count</span>
                      <span>{d.staffCount}</span>
                    </td>
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-mono font-bold text-ink-muted">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Total Complaints</span>
                      <span>{d.totalComplaints}</span>
                    </td>
                    <td className="flex justify-between items-center py-2 md:table-cell md:py-3.5 md:px-3 md:text-right space-x-1.5">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Actions</span>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleOpenEditModal(d)}
                          className="px-3 py-1 bg-white border border-surface-border text-ink rounded-lg text-xs font-semibold hover:border-brand hover:text-brand transition shadow-subtle inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(d._id)}
                          className="p-1 text-slate-400 hover:text-status-danger transition cursor-pointer"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT DEPARTMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-surface-border max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-bold font-display text-ink">
                {editingDept ? 'Edit Department' : 'Add Department'}
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
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Electrical Department"
                  className="w-full p-2.5 border border-surface-border rounded-xl bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-ink-muted uppercase text-[10.5px]">
                    Department Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. ELEC"
                    className="w-full p-2.5 border border-surface-border rounded-xl bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-ink-muted uppercase text-[10.5px]">
                    Department Head
                  </label>
                  <select
                    value={formData.head}
                    onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                    className="w-full p-2.5 border border-surface-border rounded-xl bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {headsList.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-ink-muted uppercase text-[10.5px]">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of department responsibilities..."
                  className="w-full p-2.5 border border-surface-border rounded-xl bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand"
                />
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
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
