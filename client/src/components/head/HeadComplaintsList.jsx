import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import TableSkeleton from '../common/TableSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import {
  Filter,
  Search,
  UserPlus,
  ArrowRight,
  FileQuestion,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function HeadComplaintsList({ onAssign, onSelectComplaint }) {
  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Close Reason Modal State
  const [closingComplaint, setClosingComplaint] = useState(null);
  const [closeReason, setCloseReason] = useState('');
  const [closeError, setCloseError] = useState(null);
  const [submittingClose, setSubmittingClose] = useState(false);

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

  // Real-time socket update listener
  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => {
      fetchComplaints();
    };

    socket.on('complaint_updated', handleUpdate);
    socket.on('notification_received', handleUpdate);

    return () => {
      socket.off('complaint_updated', handleUpdate);
      socket.off('notification_received', handleUpdate);
    };
  }, [fetchComplaints]);

  const handleOpenCloseModal = (complaintItem) => {
    setClosingComplaint(complaintItem);
    setCloseReason('');
    setCloseError(null);
  };

  const handleConfirmClose = async (e) => {
    e.preventDefault();
    if (!closeReason.trim()) {
      setCloseError('Please provide a reason / note for closing this complaint.');
      return;
    }
    if (!closingComplaint || submittingClose) return;

    try {
      setSubmittingClose(true);
      setCloseError(null);
      const res = await api.updateComplaintStatus(
        closingComplaint._id,
        'Closed',
        closeReason.trim()
      );
      if (res.status === 'success') {
        setClosingComplaint(null);
        setCloseReason('');
        fetchComplaints();
      }
    } catch (err) {
      console.error('Failed to close complaint:', err);
      setCloseError(err.message || 'Failed to close complaint.');
    } finally {
      setSubmittingClose(false);
    }
  };

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
      {error && <ErrorState message={error} onRetry={fetchComplaints} />}

      {/* Complaints Table */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={FileQuestion}
            title="No complaints found"
            message="No complaints match your current filter parameters."
            actionLabel={searchTerm || statusFilter !== 'All' || priorityFilter !== 'All' || technicianFilter !== 'All' ? 'Clear Filters' : undefined}
            onAction={() => {
              setSearchTerm('');
              setStatusFilter('All');
              setPriorityFilter('All');
              setTechnicianFilter('All');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Title</th>
                  <th className="pb-3 px-3">Technician</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 md:divide-y divide-surface-border text-xs block md:table-row-group">
                {complaints.map((c) => {
                  const isUnassignedOrPending = c.status === 'Pending' || !c.assignedTechnician;

                  return (
                    <tr
                      key={c._id}
                      onClick={() => onSelectComplaint && onSelectComplaint(c.ticketId || c._id)}
                      className="block md:table-row p-4 border border-surface-border rounded-2xl mb-3 bg-white hover:bg-surface-bg/60 transition cursor-pointer shadow-xs md:shadow-none md:border-none md:mb-0 md:p-0"
                    >
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-mono text-brand font-semibold">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">ID</span>
                        {c.ticketId}
                      </td>
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-semibold text-ink max-w-[240px] truncate">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Title</span>
                        <span>{c.title}</span>
                      </td>
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 text-ink-muted">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Technician</span>
                        <span>{c.assignedTechnician?.name || '—'}</span>
                      </td>
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Priority</span>
                        {renderPriority(c.priority)}
                      </td>
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Status</span>
                        {renderBadge(c.status)}
                      </td>
                      <td className="flex justify-between items-center py-2 md:table-cell md:py-3.5 md:px-3 md:text-right">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Action</span>
                        <div className="flex items-center gap-1.5 justify-end">
                          {isUnassignedOrPending && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssign && onAssign(c);
                              }}
                              className="px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand-dark transition shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Assign
                            </button>
                          )}
                          {c.status !== 'Closed' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCloseModal(c);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                              title="Close complaint"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Close
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectComplaint && onSelectComplaint(c.ticketId || c._id);
                            }}
                            className="px-3 py-1.5 bg-white border border-surface-border text-ink rounded-lg text-xs font-semibold hover:border-brand hover:text-brand transition shadow-subtle inline-flex items-center gap-1 cursor-pointer"
                          >
                            View <ArrowRight className="w-3 h-3" />
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

      {/* CLOSE COMPLAINT REASON MODAL */}
      {closingComplaint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-surface-border p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-bold font-display text-ink flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-slate-700" />
                Reason for Closing Complaint
              </h3>
              <button
                type="button"
                onClick={() => setClosingComplaint(null)}
                className="text-ink-muted hover:text-ink transition p-1 rounded-lg hover:bg-surface-bg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmClose} className="space-y-4">
              <p className="text-xs text-ink-muted leading-relaxed">
                Please state the official reason or resolution note for closing ticket <b className="font-mono text-ink">{closingComplaint.ticketId}</b>.
              </p>

              {closeError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{closeError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Closing Reason / Note <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={closeReason}
                  onChange={(e) => {
                    setCloseReason(e.target.value);
                    if (closeError) setCloseError(null);
                  }}
                  placeholder="E.g. Issue resolved on site and verified with student."
                  className="w-full p-3 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClosingComplaint(null)}
                  className="px-4 py-2 border border-surface-border text-ink rounded-xl text-xs font-semibold hover:bg-surface-bg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClose}
                  className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingClose ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Close'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
