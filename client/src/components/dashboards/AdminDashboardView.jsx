import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Building,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  Activity,
  Bell,
} from 'lucide-react';

export default function AdminDashboardView({ onSelectComplaint }) {
  const [data, setData] = useState({
    stats: {
      totalUsers: 1284,
      totalDepartments: 6,
      openComplaints: 142,
      closedComplaints: 1930,
    },
    monthlyTrend: [],
    deptComparison: [],
    categoryBreakdown: [],
    recentActivity: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminOverview();
      if (res.status === 'success' && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching admin overview:', err);
      setError(err.message || 'Failed to load system overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const { stats, monthlyTrend, deptComparison, categoryBreakdown, recentActivity } = data;

  const maxMonthlyVal = Math.max(...monthlyTrend.map((m) => m.v), 1);
  const maxDeptVal = Math.max(...deptComparison.map((d) => d.v), 1);
  const totalCatVal = categoryBreakdown.reduce((sum, c) => sum + c.v, 0) || 1;

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono text-ink-muted">Loading system overview...</p>
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
        <h1 className="text-2xl font-bold font-display text-ink">System Overview</h1>
        <p className="text-sm text-ink-muted mt-0.5">All departments, all complaints.</p>
      </div>

      {/* 4 SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">
              {stats.totalUsers.toLocaleString()}
            </div>
            <div className="text-xs text-ink-muted mt-0.5 font-medium">Total Users</div>
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-soft text-purple flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">
              {stats.totalDepartments}
            </div>
            <div className="text-xs text-ink-muted mt-0.5 font-medium">Departments</div>
          </div>
        </div>

        {/* Open Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-status-warning flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">
              {stats.openComplaints.toLocaleString()}
            </div>
            <div className="text-xs text-ink-muted mt-0.5 font-medium">Open Complaints</div>
          </div>
        </div>

        {/* Closed Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-status-success flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display text-ink">
              {stats.closedComplaints.toLocaleString()}
            </div>
            <div className="text-xs text-ink-muted mt-0.5 font-medium">Closed Complaints</div>
          </div>
        </div>
      </div>

      {/* ROW 1: MONTHLY TREND + DEPARTMENT COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Monthly Trend Bar Chart */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold font-display text-ink">Monthly trend</h3>
            <span className="text-xs text-brand font-semibold">Past 6 Months</span>
          </div>

          <div className="h-44 pt-4 flex items-end justify-between gap-3">
            {monthlyTrend.map((m, idx) => {
              const heightPercent = Math.max((m.v / maxMonthlyVal) * 100, 10);
              const isLatest = idx === monthlyTrend.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono font-bold text-ink opacity-0 group-hover:opacity-100 transition">
                    {m.v}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[32px] rounded-t-md transition-all duration-300 shadow-subtle ${
                      isLatest ? 'bg-brand-dark' : 'bg-brand hover:bg-brand-dark'
                    }`}
                  />
                  <span className="text-[11px] font-medium text-ink-muted truncate">
                    {m.l}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Comparison Bar Chart */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold font-display text-ink">Department comparison</h3>
            <span className="text-xs text-ink-muted font-mono">{deptComparison.length} depts</span>
          </div>

          <div className="h-44 pt-4 flex items-end justify-between gap-3">
            {deptComparison.map((d, idx) => {
              const heightPercent = Math.max((d.v / maxDeptVal) * 100, 10);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono font-bold text-ink opacity-0 group-hover:opacity-100 transition">
                    {d.v}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%`, backgroundColor: d.c || '#2A4FD1' }}
                    className="w-full max-w-[32px] rounded-t-md hover:opacity-90 transition-all duration-300 shadow-subtle"
                  />
                  <span className="text-[11px] font-medium text-ink-muted truncate max-w-[48px]">
                    {d.l}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 2: CATEGORIES DONUT + RECENT ACTIVITY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Categories Donut Chart */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold font-display text-ink">Complaint categories</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {categoryBreakdown.map((p, idx) => {
                  const percent = Math.round((p.v / totalCatVal) * 100);
                  const prevPercents = categoryBreakdown
                    .slice(0, idx)
                    .reduce((sum, item) => sum + Math.round((item.v / totalCatVal) * 100), 0);

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
                <span className="text-lg font-bold font-display text-ink">{categoryBreakdown.length}</span>
                <span className="text-[10px] text-ink-muted uppercase font-semibold">Categories</span>
              </div>
            </div>

            <div className="space-y-3 min-w-[160px]">
              {categoryBreakdown.map((p, idx) => {
                const percent = Math.round((p.v / totalCatVal) * 100);
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

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold font-display text-ink flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand" /> Recent activity
            </h3>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-ink-muted">
              <Bell className="w-6 h-6 opacity-40 mx-auto" />
              <p className="text-xs">No recent activity recorded.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() =>
                    notif.complaint && onSelectComplaint && onSelectComplaint(notif.complaint._id || notif.complaint.ticketId)
                  }
                  className="p-3 rounded-xl border border-surface-border bg-surface-bg/50 hover:bg-white hover:shadow-subtle transition flex items-start gap-3 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-soft text-brand flex items-center justify-center flex-shrink-0 text-xs font-bold font-display mt-0.5">
                    {notif.sender?.name ? notif.sender.name.slice(0, 2).toUpperCase() : 'SYS'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">{notif.title}</p>
                    <p className="text-[11px] text-ink-muted line-clamp-1">{notif.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
