import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import TableSkeleton from '../common/TableSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import {
  CheckCircle,
  Star,
  ArrowLeft,
} from 'lucide-react';

export default function TechnicianCompletedView({ onBack, onOpenWorkView }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompleted = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCompletedComplaints();
      if (res.status === 'success' && res.data) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      console.error('Error loading completed complaints history:', err);
      setError(err.message || 'Failed to load completed complaints history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompleted();
  }, [fetchCompleted]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderStarRating = (rating) => {
    const stars = rating || 5;
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>
          )}
          <h1 className="text-2xl font-bold font-display text-ink">Completed Complaints</h1>
          <p className="text-sm text-ink-muted mt-1">
            {complaints.length} complaint{complaints.length === 1 ? '' : 's'} resolved and closed
          </p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={fetchCompleted} />}

      {/* Completed History Table */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No completed complaints yet"
            message="Resolved complaints and student feedback ratings will be logged here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Title</th>
                  <th className="pb-3 px-3">Location</th>
                  <th className="pb-3 px-3">Resolved On</th>
                  <th className="pb-3 px-3">Student Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 md:divide-y divide-surface-border text-xs block md:table-row-group">
                {complaints.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => onOpenWorkView && onOpenWorkView(c.ticketId || c._id)}
                    className="block md:table-row p-4 border border-surface-border rounded-2xl mb-3 bg-white hover:bg-surface-bg/60 transition cursor-pointer shadow-xs md:shadow-none md:border-none md:mb-0 md:p-0"
                  >
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-mono text-brand font-semibold">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">ID</span>
                      {c.ticketId}
                    </td>
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-semibold text-ink max-w-[240px] truncate">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Title</span>
                      <span>{c.title}</span>
                    </td>
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 text-ink-muted">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Location</span>
                      <span>{c.location}</span>
                    </td>
                    <td className="flex justify-between items-center py-2 border-b border-dashed border-surface-border md:table-cell md:border-b-none md:py-3.5 md:px-3 font-mono text-ink-muted">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Resolved On</span>
                      <span>{formatDate(c.resolvedAt || c.updatedAt)}</span>
                    </td>
                    <td className="flex justify-between items-center py-2 md:table-cell md:py-3.5 md:px-3">
                      <span className="md:hidden text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Rating</span>
                      {renderStarRating(c.rating || 5)}
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
