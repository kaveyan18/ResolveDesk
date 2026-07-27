import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Star,
  Loader2,
  AlertCircle,
  Wrench,
} from 'lucide-react';

export default function HeadStaffView() {
  const [data, setData] = useState({
    department: { name: 'Electrical Department', code: 'ELEC' },
    totalStaff: 0,
    staff: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDepartmentStaff('mine');
      if (res.status === 'success' && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error loading department staff:', err);
      setError(err.message || 'Failed to load department staff performance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const renderStars = (rating) => {
    const rounded = Math.round(rating || 4.5);
    return (
      <div className="flex items-center gap-1 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rounded ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
          />
        ))}
        <span className="text-[11px] font-bold text-ink-muted ml-1 font-mono">
          ({rating})
        </span>
      </div>
    );
  };

  const { department, totalStaff, staff } = data;

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono text-ink-muted">Loading department staff performance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold font-display text-ink">Staff</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          {totalStaff} technician{totalStaff === 1 ? '' : 's'} in {department.name}.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStaff}
            className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* STAFF PERFORMANCE TABLE PANEL */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        {staff.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-ink-muted">
            <Wrench className="w-8 h-8 opacity-40 mx-auto" />
            <p className="text-sm font-semibold text-ink">No technicians found</p>
            <p className="text-xs">Technicians registered in this department will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">Technician</th>
                  <th className="pb-3 px-3">Active</th>
                  <th className="pb-3 px-3">Resolved (Month)</th>
                  <th className="pb-3 px-3">Avg. Time</th>
                  <th className="pb-3 px-3">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {staff.map((s) => {
                  const initials = s.name ? s.name.slice(0, 2).toUpperCase() : 'TC';

                  return (
                    <tr key={s._id} className="hover:bg-surface-bg/60 transition">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-soft text-purple font-display font-bold text-xs flex items-center justify-center shadow-subtle flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-ink">{s.name}</p>
                            <p className="text-[11px] text-ink-muted">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-ink">{s.activeTasks}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-status-success">
                        {s.resolvedMonth}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-ink-muted">{s.avgTime}</td>
                      <td className="py-3.5 px-3">{renderStars(s.rating)}</td>
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
