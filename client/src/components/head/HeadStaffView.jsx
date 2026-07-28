import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import TableSkeleton from '../common/TableSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import {
  Star,
  Users,
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold font-display text-ink">Staff</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          {totalStaff} technician{totalStaff === 1 ? '' : 's'} in {department.name}.
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={fetchStaff} />}

      {/* STAFF PERFORMANCE TABLE PANEL */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : staff.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No technicians found"
            message="Technicians assigned or registered in this department will be listed here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">Technician</th>
                  <th className="pb-3 px-3">Active</th>
                  <th className="pb-3 px-3">Resolved (Month)</th>
                  <th className="pb-3 px-3">Avg. Time</th>
                  <th className="pb-3 px-3">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 md:divide-y divide-surface-border text-xs block md:table-row-group">
                {staff.map((s) => {
                  const initials = s.name ? s.name.slice(0, 2).toUpperCase() : 'TC';

                  return (
                    <tr
                      key={s._id}
                      className="block md:table-row p-4 border border-surface-border rounded-2xl mb-3 bg-white hover:bg-surface-bg/60 transition shadow-xs md:shadow-none md:border-none md:mb-0 md:p-0"
                    >
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Technician</span>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-soft text-purple font-display font-bold text-xs flex items-center justify-center shadow-subtle flex-shrink-0">
                            {initials}
                          </div>
                          <div className="text-right md:text-left">
                            <p className="font-semibold text-ink">{s.name}</p>
                            <p className="text-[11px] text-ink-muted">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-mono font-bold text-ink">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Active</span>
                        <span>{s.activeTasks}</span>
                      </td>
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-mono font-bold text-status-success">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Resolved</span>
                        <span>{s.resolvedMonth}</span>
                      </td>
                      <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-mono text-ink-muted">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Avg. Time</span>
                        <span>{s.avgTime}</span>
                      </td>
                      <td className="flex justify-between items-center py-2 md:table-cell md:py-3.5 md:px-3">
                        <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Rating</span>
                        {renderStars(s.rating)}
                      </td>
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
