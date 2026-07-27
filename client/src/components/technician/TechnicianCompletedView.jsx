import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  CheckCircle,
  Star,
  Loader2,
  AlertCircle,
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

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono text-ink-muted">Loading completed complaints history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition mb-2"
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

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchCompleted}
            className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Completed History Table */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
        {complaints.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-status-success mx-auto opacity-40" />
            <p className="text-sm font-semibold text-ink">No completed complaints yet</p>
            <p className="text-xs text-ink-muted">
              Resolved complaints and student ratings will be documented here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Title</th>
                  <th className="pb-3 px-3">Location</th>
                  <th className="pb-3 px-3">Resolved On</th>
                  <th className="pb-3 px-3">Student Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {complaints.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => onOpenWorkView && onOpenWorkView(c.ticketId || c._id)}
                    className="hover:bg-surface-bg/60 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-3 font-mono text-brand font-semibold">
                      {c.ticketId}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-ink max-w-[240px] truncate">
                      {c.title}
                    </td>
                    <td className="py-3.5 px-3 text-ink-muted">{c.location}</td>
                    <td className="py-3.5 px-3 font-mono text-ink-muted">
                      {formatDate(c.resolvedAt || c.updatedAt)}
                    </td>
                    <td className="py-3.5 px-3">
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
