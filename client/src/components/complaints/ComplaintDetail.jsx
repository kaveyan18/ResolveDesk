import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import StatusThreadTimeline from '../common/StatusThreadTimeline';
import FloatingChatWidget from '../common/FloatingChatWidget';
import {
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  FileImage,
  Star,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';

export default function ComplaintDetail({ complaintId, onBack }) {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rating state
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Fetch Complaint Data
  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getComplaintById(complaintId);
      if (res.status === 'success' && res.data?.complaint) {
        setComplaint(res.data.complaint);
        if (res.data.complaint.rating) {
          setSelectedRating(res.data.complaint.rating);
        }
        if (res.data.complaint.feedback) {
          setFeedbackText(res.data.complaint.feedback);
        }
      }
    } catch (err) {
      console.error('Error loading complaint detail:', err);
      setError(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!complaint || submittingRating) return;
    try {
      setSubmittingRating(true);
      const res = await api.rateComplaint(complaint._id, selectedRating, feedbackText);
      if (res.status === 'success' && res.data?.complaint) {
        setComplaint(res.data.complaint);
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
      setError(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

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
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style}`}
      >
        <span className="w-1.5 h-1.5 rounded-full" />
        {status}
      </span>
    );
  };

  // Priority Component
  const renderPriority = (priority) => {
    const priorityStyles = {
      Critical: 'text-status-danger before:bg-status-danger',
      High: 'text-status-warning before:bg-status-warning',
      Medium: 'text-brand before:bg-brand',
      Low: 'text-gray-custom before:bg-gray-custom',
    };

    const style = priorityStyles[priority] || priorityStyles.Medium;

    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${style}`}>
        <span className="w-2 h-2 rounded-xs" />
        {priority}
      </span>
    );
  };

  // Format Full Date
  const formatFullDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono text-ink-muted">Loading complaint details...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Complaints
        </button>
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error || 'Complaint not found.'}</span>
          </div>
          <button
            onClick={fetchDetail}
            className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isResolvedOrClosed = ['Resolved', 'Closed'].includes(complaint.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative pb-10">
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Complaints
        </button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-surface-border pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-display text-ink">{complaint.title}</h1>
            <span className="font-mono text-sm text-ink-muted px-2 py-0.5 rounded bg-surface-bg border border-surface-border">
              {complaint.ticketId}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
            {renderBadge(complaint.status)}
            <span>·</span>
            {renderPriority(complaint.priority)}
            <span>·</span>
            <span>Created {formatFullDate(complaint.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white border border-surface-border text-ink rounded-lg text-xs font-semibold hover:border-brand hover:text-brand transition flex items-center gap-1.5 shadow-subtle"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
          {complaint.status === 'Pending' && (
            <>
              <button className="px-3 py-1.5 bg-white border border-surface-border text-ink rounded-lg text-xs font-semibold hover:border-brand hover:text-brand transition flex items-center gap-1.5 shadow-subtle">
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
              <button className="px-3 py-1.5 bg-red-50 border border-red-200 text-status-danger rounded-lg text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2-COLUMN MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Details & Rating */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-5">
            <h3 className="text-sm font-bold font-display text-ink border-b border-surface-border pb-3">
              Details
            </h3>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-bg/60 p-4 rounded-xl border border-surface-border">
              <div className="space-y-1">
                <span className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Department
                </span>
                <b className="text-xs text-ink">
                  {complaint.department?.name || complaint.category || 'General'}
                </b>
              </div>

              <div className="space-y-1">
                <span className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Assigned Staff
                </span>
                <b className="text-xs text-ink">
                  {complaint.assignedTechnician?.name || 'Unassigned'}
                </b>
              </div>

              <div className="space-y-1">
                <span className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Location
                </span>
                <b className="text-xs text-ink">{complaint.location}</b>
              </div>

              <div className="space-y-1">
                <span className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Priority
                </span>
                <div>{renderPriority(complaint.priority)}</div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Description
              </span>
              <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-surface-border">
                {complaint.description}
              </p>
            </div>

            {/* Uploaded Images Grid */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-brand" /> Attached Photos (
                  {complaint.images.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {complaint.images.map((src, idx) => (
                    <a
                      key={idx}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-xl overflow-hidden border border-surface-border group block relative bg-surface-bg shadow-subtle"
                    >
                      <img
                        src={src}
                        alt={`Attachment ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RATING CARD FOR RESOLVED COMPLAINTS */}
          {isResolvedOrClosed && (
            <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-sm font-bold font-display text-ink flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Service Rating & Feedback
                </h3>
                {complaint.rating && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-status-success border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Submitted
                  </span>
                )}
              </div>

              {complaint.rating ? (
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink">Your Rating:</span>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= complaint.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-ink-muted">
                      ({complaint.rating}/5)
                    </span>
                  </div>

                  {complaint.feedback && (
                    <p className="text-xs text-ink leading-relaxed italic bg-white p-3 rounded-lg border border-emerald-200">
                      &quot;{complaint.feedback}&quot;
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleRatingSubmit} className="space-y-4">
                  <p className="text-xs text-ink-muted">
                    How was your resolution experience? Please rate the technician&apos;s speed and work quality.
                  </p>

                  {/* Star Picker */}
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-110 transition focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 cursor-pointer transition ${
                            star <= (hoverRating || selectedRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-ink ml-2 font-mono">
                      {hoverRating || selectedRating} / 5 Stars
                    </span>
                  </div>

                  {/* Feedback Textarea */}
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                      Feedback / Review (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share details about the service quality..."
                      className="w-full p-3 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingRating}
                    className="px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingRating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" /> Submit Rating
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Status Thread Timeline */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4 sticky top-20">
          <h3 className="text-sm font-bold font-display text-ink border-b border-surface-border pb-3">
            Status Timeline
          </h3>

          {/* Reusable Standalone Status Thread Timeline Component */}
          <StatusThreadTimeline status={complaint.status} complaint={complaint} />
        </div>
      </div>

      {/* FLOATING BOTTOM-RIGHT CHAT WIDGET */}
      <FloatingChatWidget
        complaint={complaint}
        onCommentAdded={(updatedComments) => {
          setComplaint((prev) => ({
            ...prev,
            comments: updatedComments,
          }));
        }}
      />
    </div>
  );
}
