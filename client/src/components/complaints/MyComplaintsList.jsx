import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import TableSkeleton from '../common/TableSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import {
  Search,
  Filter,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function MyComplaintsList({ onSelectComplaint }) {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [page, setPage] = useState(1);

  const statusOptions = [
    'All',
    'Pending',
    'Assigned',
    'In Progress',
    'Resolved',
    'Closed',
    'Rejected',
  ];
  const priorityOptions = ['All', 'Critical', 'High', 'Medium', 'Low'];

  // Fetch Complaints Function
  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (priorityFilter !== 'All') params.append('priority', priorityFilter);
      params.append('page', page);
      params.append('limit', 10);

      const res = await api.getMyComplaints(`?${params.toString()}`);
      if (res.status === 'success' && res.data) {
        setComplaints(res.data.complaints || []);
        setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
      }
    } catch (err) {
      console.error('Error loading complaints list:', err);
      setError(err.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, page]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Real-time socket updates listener
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

  // Status Badge Component
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

  // Priority Component
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

  // Format Date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink">My Complaints</h1>
          <p className="text-sm text-ink-muted mt-1">
            {pagination.total} complaint{pagination.total === 1 ? '' : 's'} total
          </p>
        </div>
      </div>

      {/* Main Card Table Panel */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        {/* Table Toolbar (Search + Filters) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-surface-bg border border-surface-border rounded-xl px-3 py-2 text-xs w-full sm:w-72">
            <Search className="w-4 h-4 text-ink-muted flex-shrink-0 opacity-60" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ID or title..."
              className="bg-transparent border-none w-full text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Chip Select */}
            <div className="flex items-center gap-1.5 border border-surface-border rounded-xl px-3 py-1.5 text-xs bg-white text-ink-muted">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent border-none text-ink font-semibold focus:outline-none cursor-pointer"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Chip Select */}
            <div className="flex items-center gap-1.5 border border-surface-border rounded-xl px-3 py-1.5 text-xs bg-white text-ink-muted">
              <Filter className="w-3.5 h-3.5" />
              <span>Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent border-none text-ink font-semibold focus:outline-none cursor-pointer"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && <ErrorState message={error} onRetry={fetchComplaints} />}

        {/* Table Content */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={FileQuestion}
            title="No complaints found"
            message="No complaints match your current search or filter criteria."
            actionLabel={search || statusFilter !== 'All' || priorityFilter !== 'All' ? 'Reset Filters' : undefined}
            onAction={() => {
              setSearch('');
              setStatusFilter('All');
              setPriorityFilter('All');
              setPage(1);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Title</th>
                  <th className="pb-3 px-3">Department</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 md:divide-y divide-surface-border text-xs block md:table-row-group">
                {complaints.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => onSelectComplaint(c.ticketId || c._id)}
                    className="block md:table-row p-4 border border-surface-border rounded-2xl mb-3 bg-white hover:bg-surface-bg/60 transition cursor-pointer group shadow-xs md:shadow-none md:border-none md:mb-0 md:p-0"
                  >
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-mono text-ink-muted">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">ID</span>
                      {c.ticketId}
                    </td>
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-semibold text-brand group-hover:underline">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Title</span>
                      <span>{c.title}</span>
                    </td>
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 text-ink-muted">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Department</span>
                      <span>{c.department?.name || c.category || 'General'}</span>
                    </td>
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Status</span>
                      {renderBadge(c.status)}
                    </td>
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Priority</span>
                      {renderPriority(c.priority)}
                    </td>
                    <td className="flex justify-between items-center py-2 md:table-cell md:py-3.5 md:px-3 md:text-right text-ink-muted font-mono">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Date</span>
                      <span>{formatDate(c.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && complaints.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-surface-border text-xs text-ink-muted">
            <div>
              Showing {complaints.length > 0 ? (page - 1) * 10 + 1 : 0}–
              {Math.min(page * 10, pagination.total)} of {pagination.total}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="w-8 h-8 rounded-lg border border-surface-border flex items-center justify-center disabled:opacity-40 hover:bg-surface-bg transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={`w-8 h-8 rounded-lg border text-xs font-semibold transition ${
                    pNum === page
                      ? 'bg-brand text-white border-brand'
                      : 'border-surface-border text-ink hover:bg-surface-bg'
                  }`}
                >
                  {pNum}
                </button>
              ))}

              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
                className="w-8 h-8 rounded-lg border border-surface-border flex items-center justify-center disabled:opacity-40 hover:bg-surface-bg transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
