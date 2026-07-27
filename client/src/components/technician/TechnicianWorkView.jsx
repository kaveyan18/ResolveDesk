import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import StatusThreadTimeline from '../common/StatusThreadTimeline';
import FloatingChatWidget from '../common/FloatingChatWidget';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  FileImage,
  X,
} from 'lucide-react';

export default function TechnicianWorkView({ complaintId, onBack }) {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('In Progress');
  const [completionFiles, setCompletionFiles] = useState([]);
  const [completionPreviews, setCompletionPreviews] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Fetch Complaint Details
  const fetchWorkDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getComplaintById(complaintId);
      if (res.status === 'success' && res.data?.complaint) {
        setComplaint(res.data.complaint);
        setSelectedStatus(res.data.complaint.status || 'In Progress');
      }
    } catch (err) {
      console.error('Error loading complaint work detail:', err);
      setError(err.message || 'Failed to load complaint detail.');
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchWorkDetail();
  }, [fetchWorkDetail]);

  // Handle completion image selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setCompletionFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setCompletionPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setCompletionFiles((prev) => prev.filter((_, i) => i !== index));
    setCompletionPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Update Status
  const handleUpdateStatus = async () => {
    if (!complaint || updatingStatus) return;
    try {
      setUpdatingStatus(true);
      const res = await api.updateComplaintStatus(complaint._id, selectedStatus, notes);
      if (res.status === 'success' && res.data?.complaint) {
        setComplaint(res.data.complaint);
        setNotes('');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Mark as Complete
  const handleMarkComplete = async () => {
    if (!complaint || completing) return;
    try {
      setCompleting(true);
      const formData = new FormData();
      formData.append('notes', notes);

      completionFiles.forEach((file) => {
        formData.append('completionImages', file);
      });

      const res = await api.completeComplaint(complaint._id, formData);
      if (res.status === 'success' && res.data?.complaint) {
        setComplaint(res.data.complaint);
        setNotes('');
        setCompletionFiles([]);
        setCompletionPreviews([]);
      }
    } catch (err) {
      console.error('Failed to mark complete:', err);
      setError(err.message || 'Failed to mark complaint complete.');
    } finally {
      setCompleting(false);
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

  // Priority Indicator
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

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono text-ink-muted">Loading complaint work details...</p>
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
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
        </button>
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error || 'Complaint not found.'}</span>
          </div>
          <button
            onClick={fetchWorkDetail}
            className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative pb-10">
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assigned Queue
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
            {renderPriority(complaint.priority)}
            <span>·</span>
            {renderBadge(complaint.status)}
          </div>
        </div>
      </div>

      {/* 2-COLUMN MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Details, Student Images, Completion Upload & Notes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-5">
            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-surface-bg/60 p-4 rounded-xl border border-surface-border text-xs">
              <div className="space-y-1">
                <span className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Location
                </span>
                <b className="text-ink">{complaint.location}</b>
              </div>

              <div className="space-y-1">
                <span className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Reported By
                </span>
                <b className="text-ink">{complaint.student?.name || 'Student'}</b>
              </div>

              <div className="space-y-1">
                <span className="block text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  Department
                </span>
                <b className="text-ink">
                  {complaint.department?.name || complaint.category || 'General'}
                </b>
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

            {/* Student's Images */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-surface-border">
                <h3 className="text-xs font-bold font-display uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-brand" /> Student&apos;s photos ({complaint.images.length})
                </h3>
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
                        alt={`Student Attachment ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Completion Proof */}
            <div className="space-y-3 pt-2 border-t border-surface-border">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-ink-muted">
                Upload Completion Proof
              </h3>

              <div className="relative border-2 border-dashed border-surface-border rounded-xl p-5 text-center bg-surface-bg/40 hover:bg-surface-bg/80 transition cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="flex flex-col items-center space-y-1.5 text-ink-muted group-hover:text-brand transition">
                  <Upload className="w-5 h-5" />
                  <p className="text-xs font-semibold text-ink">
                    <span className="text-brand">Click to upload</span> completion photos
                  </p>
                  <p className="text-[11px]">PNG, JPG up to 10MB</p>
                </div>
              </div>

              {/* Completion Image Previews */}
              {completionPreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                  {completionPreviews.map((src, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-surface-border group">
                      <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completion Notes */}
            <div className="space-y-2 pt-2 border-t border-surface-border">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What was done to fix this..."
                className="w-full p-3 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
              />
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-3 pt-3 border-t border-surface-border flex-wrap">
              <div className="flex items-center gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-surface-border rounded-xl text-xs bg-white font-semibold text-ink focus:outline-none focus:border-brand"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                </select>

                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-white border border-surface-border text-ink rounded-xl text-xs font-semibold hover:border-brand hover:text-brand transition shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updatingStatus ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  Update Status
                </button>
              </div>

              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={completing || complaint.status === 'Resolved'}
                className="px-5 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 ml-auto"
              >
                {completing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                Mark as Complete
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Progress Status Thread Timeline */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4 sticky top-20">
          <h3 className="text-sm font-bold font-display text-ink border-b border-surface-border pb-3">
            Progress
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
