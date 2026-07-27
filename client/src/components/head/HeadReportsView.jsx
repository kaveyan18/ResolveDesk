import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Download,
  Filter,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function HeadReportsView({ isSystemWide = false }) {
  const [reportData, setReportData] = useState({
    byStatus: [
      { l: 'Resolved', v: 55, c: '#1F9D6C' },
      { l: 'In Progress', v: 25, c: '#7C5CD6' },
      { l: 'Pending', v: 20, c: '#DE8F1F' },
    ],
    byCategory: [
      { l: 'Electrical', v: 40, c: '#2A4FD1' },
      { l: 'Wiring', v: 35, c: '#7C5CD6' },
      { l: 'Other', v: 25, c: '#8992A6' },
    ],
    weeklyVolume: [
      { l: 'W1', v: 12 },
      { l: 'W2', v: 18 },
      { l: 'W3', v: 9 },
      { l: 'W4', v: 15 },
    ],
  });

  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [dateRange, setDateRange] = useState('30days');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // Load Departments if System Wide
  useEffect(() => {
    if (isSystemWide) {
      const loadDepts = async () => {
        try {
          const res = await api.getDepartments();
          if (res.status === 'success' && res.data) {
            setDepartments(res.data.departments || []);
          }
        } catch (err) {
          console.error('Error loading departments for reports filter:', err);
        }
      };
      loadDepts();
    }
  }, [isSystemWide]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (dateRange) params.append('dateRange', dateRange);
      if (priority !== 'All') params.append('priority', priority);
      if (status !== 'All') params.append('status', status);
      if (isSystemWide && selectedDept !== 'All') params.append('department', selectedDept);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await api.getDepartmentReports(queryStr);
      if (res.status === 'success' && res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Error loading report analytics:', err);
      setError(err.message || 'Failed to load report analytics.');
    } finally {
      setLoading(false);
    }
  }, [dateRange, priority, status, isSystemWide, selectedDept]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (dateRange) params.append('dateRange', dateRange);
      if (priority !== 'All') params.append('priority', priority);
      if (status !== 'All') params.append('status', status);
      if (isSystemWide && selectedDept !== 'All') params.append('department', selectedDept);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      await api.exportDepartmentReportCSV(queryStr);
    } catch (err) {
      console.error('CSV Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const { byStatus, byCategory, weeklyVolume } = reportData;

  const totalStatusVal = byStatus.reduce((sum, item) => sum + item.v, 0) || 1;
  const totalCategoryVal = byCategory.reduce((sum, item) => sum + item.v, 0) || 1;
  const maxWeeklyVal = Math.max(...weeklyVolume.map((w) => w.v), 1);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono text-ink-muted">
          Loading {isSystemWide ? 'system-wide' : 'department'} reports...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PAGE HEADER WITH EXPORT ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink">Reports</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {isSystemWide
              ? 'System-wide performance and trends across all departments.'
              : 'Department performance and trends.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-white border border-surface-border text-ink rounded-xl text-xs font-semibold hover:border-brand hover:text-brand transition shadow-subtle flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="px-3.5 py-2 bg-brand text-white rounded-xl text-xs font-semibold hover:bg-brand-dark transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Export Excel / CSV
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR CARD */}
      <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-card">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Department Selector for Admin */}
          {isSystemWide && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-ink font-semibold">
              <Filter className="w-3.5 h-3.5 text-ink-muted" />
              <span>Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent border-none focus:outline-none cursor-pointer font-bold text-brand"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-ink font-semibold">
            <Filter className="w-3.5 h-3.5 text-ink-muted" />
            <span>Date:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none focus:outline-none cursor-pointer font-bold text-brand"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          {/* Priority Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-ink font-semibold">
            <Filter className="w-3.5 h-3.5 text-ink-muted" />
            <span>Priority:</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="bg-transparent border-none focus:outline-none cursor-pointer font-bold text-brand"
            >
              <option value="All">All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-ink font-semibold">
            <Filter className="w-3.5 h-3.5 text-ink-muted" />
            <span>Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchReports}
            className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3-COLUMN ANALYTICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Card 1: By Status Donut */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold font-display text-ink border-b border-surface-border pb-3">
            By status
          </h3>

          <div className="flex flex-col items-center justify-center gap-4 py-2">
            <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {byStatus.map((p, idx) => {
                  const percent = Math.round((p.v / totalStatusVal) * 100);
                  const prevPercents = byStatus
                    .slice(0, idx)
                    .reduce((sum, item) => sum + Math.round((item.v / totalStatusVal) * 100), 0);

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
                <span className="text-base font-bold font-display text-ink">{totalStatusVal}</span>
                <span className="text-[9px] text-ink-muted uppercase font-semibold">Total</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              {byStatus.map((p, idx) => {
                const percent = Math.round((p.v / totalStatusVal) * 100);
                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
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

        {/* Card 2: By Category Donut */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold font-display text-ink border-b border-surface-border pb-3">
            By category
          </h3>

          <div className="flex flex-col items-center justify-center gap-4 py-2">
            <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {byCategory.map((p, idx) => {
                  const percent = Math.round((p.v / totalCategoryVal) * 100);
                  const prevPercents = byCategory
                    .slice(0, idx)
                    .reduce((sum, item) => sum + Math.round((item.v / totalCategoryVal) * 100), 0);

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
                <span className="text-base font-bold font-display text-ink">{byCategory.length}</span>
                <span className="text-[9px] text-ink-muted uppercase font-semibold">Types</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              {byCategory.map((p, idx) => {
                const percent = Math.round((p.v / totalCategoryVal) * 100);
                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.c }} />
                      <span className="font-semibold text-ink truncate max-w-[120px]">{p.l}</span>
                    </div>
                    <span className="font-mono font-bold text-ink">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Weekly Volume Bar Chart */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold font-display text-ink border-b border-surface-border pb-3">
            Weekly volume
          </h3>

          <div className="h-44 pt-4 flex items-end justify-between gap-3">
            {weeklyVolume.map((w, idx) => {
              const heightPercent = Math.max((w.v / maxWeeklyVal) * 100, 10);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono font-bold text-ink opacity-0 group-hover:opacity-100 transition">
                    {w.v}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[32px] rounded-t-md bg-purple group-hover:bg-purple-dark transition-all duration-300 shadow-subtle"
                  />
                  <span className="text-[11px] font-medium text-ink-muted truncate">
                    {w.l}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
