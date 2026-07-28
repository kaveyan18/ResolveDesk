import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import TableSkeleton from '../common/TableSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import {
  Users,
  Building,
  Clock,
  CheckCircle,
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
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="border-b border-surface-border pb-4">
          <div className="h-7 w-48 bg-slate-200 rounded-md animate-pulse mb-2" />
          <div className="h-4 w-64 bg-slate-200 rounded-md animate-pulse" />
        </div>
        <TableSkeleton rows={4} cols={4} />
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

      {error && <ErrorState message={error} onRetry={fetchOverview} />}

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

          <div className="pt-4 flex items-end justify-between gap-3 h-48 px-2">
            {monthlyTrend.map((m, idx) => {
              const heightPercent = Math.round((m.v / maxMonthlyVal) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10.5px] font-mono font-bold text-brand opacity-0 group-hover:opacity-100 transition">
                    {m.v}
                  </span>
                  <div className="w-full max-w-[36px] bg-surface-bg rounded-t-xl overflow-hidden h-36 flex items-end p-1">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-brand rounded-t-lg transition-all duration-500 group-hover:bg-brand-dark"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-ink-muted">{m.l}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Comparison Horizontal Bars */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold font-display text-ink">Department comparison</h3>
            <span className="text-xs text-ink-muted">Open Volume</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {deptComparison.map((d, idx) => {
              const widthPercent = Math.round((d.v / maxDeptVal) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-ink">{d.l}</span>
                    <span className="font-mono text-brand">{d.v} open</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-bg rounded-full overflow-hidden p-0.5 border border-surface-border">
                    <div
                      style={{ width: `${widthPercent}%` }}
                      className="h-full bg-brand rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 2: CATEGORY BREAKDOWN + RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Category Breakdown Donut */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold font-display text-ink">Category breakdown</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7F0"
                  strokeWidth="3.8"
                />
                {categoryBreakdown.map((cat, idx) => {
                  const strokePercent = Math.round((cat.v / totalCatVal) * 100);
                  const prevOffset = categoryBreakdown
                    .slice(0, idx)
                    .reduce((sum, c) => sum + Math.round((c.v / totalCatVal) * 100), 0);

                  return (
                    <path
                      key={idx}
                      strokeDasharray={`${strokePercent}, 100`}
                      strokeDashoffset={-prevOffset}
                      stroke={cat.c}
                      strokeWidth="3.8"
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
            <EmptyState
              icon={Bell}
              title="No recent activity"
              message="System events and complaint updates will be logged here."
            />
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
