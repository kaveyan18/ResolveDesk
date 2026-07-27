import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  List,
  Clock,
  Wrench,
  CheckCircle,
  Building,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function StudentDashboardView({ onNavigate }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    stats: {
      total: 0,
      pending: 0,
      assigned: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      rejected: 0,
    },
    monthlyCounts: [],
    recentComplaints: [],
  });

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await api.getMyComplaints();
        if (res.status === 'success' && res.data) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
        setError(err.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const { stats, monthlyCounts, recentComplaints } = dashboardData;

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

  // Priority Indicator Component
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

  // Format Date (e.g., Jul 24)
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono text-ink-muted">Loading dashboard statistics...</p>
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
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate max value for Monthly Bar Chart
  const maxMonthlyVal = Math.max(...monthlyCounts.map((m) => m.v), 1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Student'}
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Here&apos;s what&apos;s happening with your complaints.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('history')}
            className="px-4 py-2 bg-white text-ink border border-surface-border text-xs font-semibold rounded-lg hover:border-brand hover:text-brand transition shadow-subtle"
          >
            Track Complaint
          </button>
          <button
            onClick={() => onNavigate('raise')}
            className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Raise Complaint
          </button>
        </div>
      </div>

      {/* 5 SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Complaints */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
              <List className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.total}</div>
            <div className="text-xs text-ink-muted mt-0.5">Total Complaints</div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-status-warning flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.pending}</div>
            <div className="text-xs text-ink-muted mt-0.5">Pending</div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-soft text-purple flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.inProgress}</div>
            <div className="text-xs text-ink-muted mt-0.5">In Progress</div>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-status-success flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.resolved}</div>
            <div className="text-xs text-ink-muted mt-0.5">Resolved</div>
          </div>
        </div>

        {/* Closed */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card space-y-3 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-gray-custom flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.closed}</div>
            <div className="text-xs text-ink-muted mt-0.5">Closed</div>
          </div>
        </div>
      </div>

      {/* FULL WIDTH MONTHLY BAR CHART */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h3 className="text-sm font-bold font-display text-ink">Complaints this year</h3>
          <span className="text-xs text-brand font-semibold">Monthly</span>
        </div>

        {/* Bar Chart */}
        <div className="h-44 pt-4 flex items-end justify-between gap-4">
          {monthlyCounts.map((m, idx) => {
            const heightPercent = Math.max((m.v / maxMonthlyVal) * 100, 6);
            const isCurrentMonth = idx === monthlyCounts.length - 1;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[36px] rounded-t-md transition-all duration-500 ${
                    isCurrentMonth ? 'bg-brand-dark' : 'bg-brand'
                  }`}
                />
                <span className="text-[11px] font-mono text-ink-muted">{m.l}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECENT COMPLAINTS TABLE */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h3 className="text-sm font-bold font-display text-ink">Recent complaints</h3>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-brand font-semibold hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentComplaints.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-xs text-ink-muted">No complaints filed yet.</p>
            <button
              onClick={() => onNavigate('raise')}
              className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark transition"
            >
              Raise your first complaint
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Title</th>
                  <th className="pb-3 px-3">Department</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {recentComplaints.map((c) => (
                  <tr key={c._id} className="hover:bg-surface-bg/60 transition">
                    <td className="py-3.5 px-3 font-mono text-ink-muted">{c.ticketId}</td>
                    <td className="py-3.5 px-3 font-semibold text-ink">{c.title}</td>
                    <td className="py-3.5 px-3 text-ink-muted">
                      {c.department?.name || c.category || 'General'}
                    </td>
                    <td className="py-3.5 px-3">{renderBadge(c.status)}</td>
                    <td className="py-3.5 px-3">{renderPriority(c.priority)}</td>
                    <td className="py-3.5 px-3 text-right text-ink-muted font-mono">
                      {formatDate(c.createdAt)}
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
