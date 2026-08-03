import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import TableSkeleton from '../common/TableSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import {
  Wrench,
  Clock,
  CheckCircle,
  Activity,
  ArrowRight,
} from 'lucide-react';

export default function TechnicianDashboardView({ onOpenWorkView, onOpenComplaint }) {
  const handleOpenClick = (id) => {
    const fn = onOpenWorkView || onOpenComplaint;
    if (fn) fn(id);
  };
  const { user } = useAuth();
  const [data, setData] = useState({
    stats: {
      assignedToday: 0,
      pending: 0,
      inProgress: 0,
      completedMonth: 0,
      avgResolutionTime: '5.2 hrs',
    },
    complaints: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssigned = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAssignedComplaints();
      if (res.status === 'success' && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching assigned complaints queue:', err);
      setError(err.message || 'Failed to load assigned complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssigned();
  }, [fetchAssigned]);

  // Real-time socket update listener
  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => {
      fetchAssigned();
    };

    socket.on('complaint_updated', handleUpdate);
    socket.on('notification_received', handleUpdate);

    return () => {
      socket.off('complaint_updated', handleUpdate);
      socket.off('notification_received', handleUpdate);
    };
  }, [fetchAssigned]);

  const { stats, complaints } = data;

  const renderBadge = (status) => {
    const statusStyles = {
      Pending: 'bg-amber-50 text-amber-800 border-amber-200 before:bg-amber-500',
      Assigned: 'bg-brand-soft text-brand-dark border-blue-200 before:bg-brand',
      'In Progress': 'bg-purple-soft text-purple border-purple-200 before:bg-purple',
      Resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200 before:bg-status-success',
      Closed: 'bg-gray-soft text-slate-700 border-slate-200 before:bg-gray-custom',
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
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold font-display text-ink">
          Good morning, {user?.name ? user.name.split(' ')[0] : 'Technician'}
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          You have {complaints.length} complaint{complaints.length === 1 ? '' : 's'} assigned to your queue.
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={fetchAssigned} />}

      {/* 4 SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assigned Today */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
              <Wrench className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.assignedToday}</div>
            <div className="text-xs text-ink-muted mt-0.5 font-medium">Assigned Today</div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-status-warning flex items-center justify-center">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.pending}</div>
            <div className="text-xs text-ink-muted mt-0.5 font-medium">Pending</div>
          </div>
        </div>

        {/* Completed Month */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-status-success flex items-center justify-center">
              <CheckCircle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.completedMonth}</div>
            <div className="text-xs text-ink-muted mt-0.5 font-medium">Completed (Month)</div>
          </div>
        </div>

        {/* Avg Resolution */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-soft text-purple flex items-center justify-center">
              <Activity className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.avgResolutionTime}</div>
            <div className="text-xs text-ink-muted mt-0.5 font-medium">Avg. Resolution</div>
          </div>
        </div>
      </div>

      {/* ASSIGNED COMPLAINTS TABLE */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h3 className="text-sm font-bold font-display text-ink">Assigned complaints</h3>
          <span className="text-xs text-ink-muted font-mono">{complaints.length} tasks</span>
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={6} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No assigned complaints"
            message="All assigned tasks in your queue have been completed!"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Title</th>
                  <th className="pb-3 px-3">Location</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 md:divide-y divide-surface-border text-xs block md:table-row-group">
                {complaints.map((c) => (
                  <tr
                    key={c._id}
                    className="block md:table-row p-4 border border-surface-border rounded-2xl mb-3 bg-white hover:bg-surface-bg/60 transition cursor-pointer shadow-xs md:shadow-none md:border-none md:mb-0 md:p-0"
                  >
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-mono text-ink-muted font-semibold">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">ID</span>
                      {c.ticketId}
                    </td>
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-semibold text-ink max-w-[220px] truncate">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Title</span>
                      <span>{c.title}</span>
                    </td>
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 text-ink-muted">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Location</span>
                      <span>{c.location}</span>
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
                      <button
                        onClick={() => handleOpenClick(c.ticketId || c._id)}
                        className="px-3 py-1 bg-white border border-surface-border text-ink rounded-lg text-xs font-semibold hover:border-brand hover:text-brand transition shadow-subtle inline-flex items-center gap-1 cursor-pointer"
                      >
                        Open <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
