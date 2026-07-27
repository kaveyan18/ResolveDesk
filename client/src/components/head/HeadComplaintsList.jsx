import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Filter,
  Search,
  UserPlus,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function HeadComplaintsList({ onAssign, onSelectComplaint }) {
  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [technicianFilter, setTechnicianFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Technicians for filter dropdown
  useEffect(() => {
    async function loadTechs() {
      try {
        const res = await api.getDepartmentTechnicians();
        if (res.status === 'success' && res.data) {
          setTechnicians(res.data.technicians || []);
        }
      } catch (err) {
        console.error('Error loading technicians for filter:', err);
      }
    }
    loadTechs();
  }, []);

  // Fetch Complaints Query
  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (priorityFilter !== 'All') params.append('priority', priorityFilter);
      if (technicianFilter !== 'All') params.append('technician', technicianFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await api.getDepartmentComplaints(queryStr);
      if (res.status === 'success' && res.data) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      console.error('Error loading department complaints list:', err);
      setError(err.message || 'Failed to load department complaints.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, technicianFilter, searchTerm]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const renderBadge = (status) => {
    const statusStyles = {
      Pending: 'bg-amber-50 text-amber-800 border-amber-200 before:bg-amber-500',
      Assigned: 'bg-brand-soft text-brand-dark border-blue-200 before:bg-brand',
      'In Progress': 'bg-purple-soft text-purple border-purple-200 before:bg-purple',
      Resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200 before:bg-status-success',
      Closed: 'bg-gray-soft text-slate-700 border-slate-200 before:bg-gray-custom',
      Rejected: 'bg-red-50 text-red-800 border-red-200 before:bg-status-danger',
    };

    const style = statusStyles[status] || statusStyles.Pending;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold border ${style}`}
      >
        <span className="w-1.5 h-1.5 rounded-full" />
        {status}
      </span>
    );
  };

  const renderPriority = (priority) => {
    const priorityStyles = {
      Critical: 'text-status-danger before:bg-status-danger',
      High: 'text-status-warning before:bg-status-warning',
      Medium: 'text-brand before:bg-brand',
      Low: 'text-gray-custom before:bg-gray-custom',
    };

    const style = priorityStyles[priority] || priorityStyles.Medium;

    return (
      <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider ${style}`}>
        <span className="w-2 h-2 rounded-xs" />
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-ink">Department Complaints</h1>
        <p className="text-sm text-ink-muted mt-1">
          Monitor and assign complaints routed to your department
        </p>
      </div>

      {/* Toolbar & Filters Card */}
      <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Status Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-ink font-semibold">
              <Filter className="w-3.5 h-3.5 text-ink-muted" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none focus:outline-none cursor-pointer font-bold text-brand"
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-ink font-semibold">
              <Filter className="w-3.5 h-3.5 text-ink-muted" />
              <span>Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent border-none focus:outline-none cursor-pointer font-bold text-brand"
              >
                <option value="All">All</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Technician Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-ink font-semibold">
              <Filter className="w-3.5 h-3.5 text-ink-muted" />
              <span>Technician:</span>
              <select
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
                className="bg-transparent border-none focus:outline-none cursor-pointer font-bold text-brand"
              >
                <option value="All">All</option>
                <option value="Unassigned">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 bg-surface-bg border border-surface-border rounded-xl px-3 py-1.5 w-full sm:w-64 text-ink-muted">
            <Search className="w-4 h-4 opacity-50 flex-shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID or title..."
              className="bg-transparent border-none text-xs w-full focus:outline-none text-ink placeholder:text-ink-muted"
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchComplaints}
            className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Complaints Table */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-ink">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
            <p className="text-xs font-mono text-ink-muted">Loading department complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-semibold text-ink">No complaints found</p>
            <p className="text-xs text-ink-muted">No complaints match your current filter parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Title</th>
                  <th className="pb-3 px-3">Technician</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {complaints.map((c) => {
                  const isUnassignedOrPending = c.status === 'Pending' || !c.assignedTechnician;

                  return (
                    <tr key={c._id} className="hover:bg-surface-bg/60 transition">
                      <td className="py-3.5 px-3 font-mono text-brand font-semibold">{c.ticketId}</td>
                      <td className="py-3.5 px-3 font-semibold text-ink max-w-[240px] truncate">
                        {c.title}
                      </td>
                      <td className="py-3.5 px-3 text-ink-muted">
                        {c.assignedTechnician?.name || '—'}
                      </td>
                      <td className="py-3.5 px-3">{renderPriority(c.priority)}</td>
                      <td className="py-3.5 px-3">{renderBadge(c.status)}</td>
                      <td className="py-3.5 px-3 text-right">
                        {isUnassignedOrPending ? (
                          <button
                            onClick={() => onAssign && onAssign(c)}
                            className="px-3.5 py-1.5 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand-dark transition shadow-sm inline-flex items-center gap-1.5"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Assign
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectComplaint && onSelectComplaint(c.ticketId || c._id)}
                            className="px-3 py-1.5 bg-white border border-surface-border text-ink rounded-lg text-xs font-semibold hover:border-brand hover:text-brand transition shadow-subtle inline-flex items-center gap-1"
                          >
                            View <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
