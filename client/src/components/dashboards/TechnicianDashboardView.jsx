import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Wrench,
  Clock,
  CheckCircle,
  Activity,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function TechnicianDashboardView({ onOpenWorkView }) {
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

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono text-ink-muted">Loading assigned complaints queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchAssigned}
          className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

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

        {complaints.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-status-success mx-auto opacity-40" />
            <p className="text-sm font-semibold text-ink">No assigned complaints</p>
            <p className="text-xs text-ink-muted">All assigned tasks have been cleared!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Title</th>
                  <th className="pb-3 px-3">Location</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-surface-bg/60 transition">
                    <td className="py-3.5 px-3 font-mono text-ink-muted font-semibold">
                      {c.ticketId}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-ink max-w-[220px] truncate">
                      {c.title}
                    </td>
                    <td className="py-3.5 px-3 text-ink-muted">{c.location}</td>
                    <td className="py-3.5 px-3">{renderPriority(c.priority)}</td>
                    <td className="py-3.5 px-3">{renderBadge(c.status)}</td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onOpenWorkView(c.ticketId || c._id)}
                        className="px-3 py-1 bg-white border border-surface-border text-ink rounded-lg text-xs font-semibold hover:border-brand hover:text-brand transition shadow-subtle inline-flex items-center gap-1"
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
