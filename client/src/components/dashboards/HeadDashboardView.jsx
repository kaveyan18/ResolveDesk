import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Clock,
  UserPlus,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function HeadDashboardView({ onSelectComplaint }) {
  const { user } = useAuth();
  const [data, setData] = useState({
    department: { name: 'Electrical Department', code: 'ELEC' },
    stats: {
      pending: 6,
      assigned: 9,
      inProgress: 4,
      escalated: 2,
      resolvedToday: 5,
    },
    workload: [],
    performance: [],
    recentComplaints: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDepartmentOverview('mine');
      if (res.status === 'success' && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching department overview:', err);
      setError(err.message || 'Failed to load department overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const { department, stats, workload, performance, recentComplaints } = data;

  const maxWorkloadVal = Math.max(...workload.map((w) => w.v), 1);
  const totalPerformanceVal = performance.reduce((sum, p) => sum + p.v, 0) || 1;

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

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono text-ink-muted">Loading department overview...</p>
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
          onClick={fetchOverview}
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
        <h1 className="text-2xl font-bold font-display text-ink">{department.name}</h1>
        <p className="text-sm text-ink-muted mt-1">
          Overview for {user?.name || 'Department Head'}
        </p>
      </div>

      {/* 5 SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Pending */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-status-warning flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.pending}</div>
            <div className="text-xs text-ink-muted mt-0.5 font-medium">Pending</div>
          </div>
        </div>

        {/* Assigned */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.assigned}</div>
            <div className="text-xs text-ink-muted mt-0.5 font-medium">Assigned</div>
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
            <div className="text-xs text-ink-muted mt-0.5 font-medium">In Progress</div>
          </div>
        </div>

        {/* Escalated */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-status-danger flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.escalated}</div>
            <div className="text-xs text-ink-muted mt-0.5 font-medium">Escalated</div>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card space-y-3 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-status-success flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">{stats.resolvedToday}</div>
            <div className="text-xs text-ink-muted mt-0.5 font-medium">Resolved Today</div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN GRID: WORKLOAD BAR CHART + PERFORMANCE DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Panel: Department Workload Bar Chart */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold font-display text-ink">Department workload</h3>
            <span className="text-xs text-ink-muted font-mono">{workload.length} technicians</span>
          </div>

          <div className="h-44 pt-4 flex items-end justify-between gap-3">
            {workload.map((w, idx) => {
              const heightPercent = Math.max((w.v / maxWorkloadVal) * 100, 8);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono font-bold text-ink opacity-0 group-hover:opacity-100 transition">
                    {w.v}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[32px] rounded-t-md bg-brand group-hover:bg-brand-dark transition-all duration-300 shadow-subtle"
                  />
                  <span className="text-[11px] font-medium text-ink-muted truncate max-w-[48px]">
                    {w.l}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Technician Performance Donut / Split Chart */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold font-display text-ink">Technician performance</h3>
            <span className="text-xs text-brand font-semibold">Monthly Split</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            {/* Visual Doughnut Bar */}
            <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {performance.map((p, idx) => {
                  const percent = Math.round((p.v / totalPerformanceVal) * 100);
                  const prevPercents = performance
                    .slice(0, idx)
                    .reduce((sum, item) => sum + Math.round((item.v / totalPerformanceVal) * 100), 0);

                  return (
                    <path
                      key={idx}
                      stroke={p.c}
                      strokeWidth="4"
                      strokeDasharray={`${percent}, 100`}
                      strokeDashoffset={`-${prevPercents}`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      className="transition-all duration-500"
                    />
                  );
                })}
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-bold font-display text-ink">
                  {Math.round(((performance[0]?.v || 0) / totalPerformanceVal) * 100)}%
                </span>
                <span className="text-[10px] text-ink-muted uppercase font-semibold">On-time</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-3 min-w-[160px]">
              {performance.map((p, idx) => {
                const percent = Math.round((p.v / totalPerformanceVal) * 100);
                return (
                  <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.c }} />
                      <span className="font-semibold text-ink">{p.l}</span>
                    </div>
                    <span className="font-mono font-bold text-ink">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT COMPLAINTS TABLE */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h3 className="text-sm font-bold font-display text-ink">Recent complaints</h3>
        </div>

        {recentComplaints.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-xs text-ink-muted">No recent complaints in department.</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {recentComplaints.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => onSelectComplaint && onSelectComplaint(c.ticketId || c._id)}
                    className="hover:bg-surface-bg/60 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-3 font-mono text-brand font-semibold">{c.ticketId}</td>
                    <td className="py-3.5 px-3 font-semibold text-ink max-w-[220px] truncate">
                      {c.title}
                    </td>
                    <td className="py-3.5 px-3 text-ink-muted">
                      {c.assignedTechnician?.name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-3">{renderPriority(c.priority)}</td>
                    <td className="py-3.5 px-3">{renderBadge(c.status)}</td>
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
