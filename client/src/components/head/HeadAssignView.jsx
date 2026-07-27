import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  ArrowLeft,
  UserCheck,
  Calendar,
  MessageSquare,
  Loader2,
  AlertCircle,
  Wrench,
} from 'lucide-react';

export default function HeadAssignView({ complaint, onBack, onAssigned }) {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState(null);
  const [priority, setPriority] = useState(complaint?.priority || 'Medium');
  const [etaDate, setEtaDate] = useState('');
  const [note, setNote] = useState('');

  const [loadingTechs, setLoadingTechs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Technicians with active workload and availability status
  const fetchTechnicians = useCallback(async () => {
    try {
      setLoadingTechs(true);
      setError(null);
      const res = await api.getDepartmentTechnicians();
      if (res.status === 'success' && res.data) {
        const techs = res.data.technicians || [];
        setTechnicians(techs);
        if (techs.length > 0) {
          setSelectedTech(techs[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching technicians for assignment:', err);
      setError(err.message || 'Failed to load technician availability.');
    } finally {
      setLoadingTechs(false);
    }
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  // Handle Assign Submission
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!complaint || !selectedTech || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.assignComplaint(complaint._id || complaint.ticketId, {
        technicianId: selectedTech._id,
        priority,
        note,
        estimatedCompletionDate: etaDate,
      });

      if (res.status === 'success') {
        if (onAssigned) {
          onAssigned(res.data.complaint);
        } else if (onBack) {
          onBack();
        }
      }
    } catch (err) {
      console.error('Failed to assign complaint:', err);
      setError(err.message || 'Failed to assign complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

  if (!complaint) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Complaints List
        </button>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-ink">Assign Complaint</h1>
        <p className="text-sm text-ink-muted mt-1 font-mono">
          <span className="font-bold text-brand">{complaint.ticketId}</span> · {complaint.title} ({complaint.location})
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchTechnicians}
            className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2-COLUMN GRID: TECHNICIANS LIST + ASSIGNMENT FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Available Technicians */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold font-display text-ink">Available technicians</h3>
            <span className="text-xs text-ink-muted font-mono">{technicians.length} total</span>
          </div>

          {loadingTechs ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-2 text-ink-muted">
              <Loader2 className="w-6 h-6 animate-spin text-brand" />
              <span className="text-xs font-mono">Loading availability...</span>
            </div>
          ) : technicians.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-ink-muted">
              <Wrench className="w-6 h-6 opacity-40 mx-auto" />
              <p className="text-xs font-semibold text-ink">No active technicians</p>
              <p className="text-[11px]">Approved technicians will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {technicians.map((t) => {
                const isSelected = selectedTech?._id === t._id;
                const initials = t.name ? t.name.slice(0, 2).toUpperCase() : 'TC';

                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTech(t)}
                    className={`p-3.5 rounded-xl border transition flex items-center gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'border-brand bg-brand-soft/50 shadow-subtle'
                        : 'border-surface-border hover:bg-surface-bg/60'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full font-display font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-subtle ${
                        isSelected ? 'bg-brand text-white' : 'bg-purple-soft text-purple'
                      }`}
                    >
                      {initials}
                    </div>

                    {/* Tech Info & Workload Bar */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <b className="text-xs font-semibold text-ink truncate">{t.name}</b>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'Busy'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-status-success border border-emerald-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-ink-muted">
                        <span>{t.department?.name || 'Staff'} · {t.activeCount} active</span>
                        <span className="font-mono text-[10px]">{t.workloadPercent}% load</span>
                      </div>

                      {/* Workload Bar */}
                      <div className="h-1.5 w-full bg-surface-bg rounded-full overflow-hidden">
                        <div
                          style={{ width: `${t.workloadPercent}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            t.workloadPercent > 70 ? 'bg-status-warning' : 'bg-brand'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Assignment Options Form */}
        <form onSubmit={handleAssignSubmit} className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-5">
          <h3 className="text-sm font-bold font-display text-ink border-b border-surface-border pb-3">
            Assignment Details
          </h3>

          {/* Priority Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorityOptions.map((opt) => {
                const isSelected = priority === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPriority(opt)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      isSelected
                        ? opt === 'Critical'
                          ? 'bg-status-danger text-white border-status-danger'
                          : opt === 'High'
                          ? 'bg-status-warning text-white border-status-warning'
                          : opt === 'Medium'
                          ? 'bg-brand text-white border-brand'
                          : 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white border-surface-border text-ink hover:border-brand/40'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estimated Completion Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand" /> Estimated Completion (ETA)
            </label>
            <input
              type="date"
              value={etaDate}
              onChange={(e) => setEtaDate(e.target.value)}
              className="w-full p-3 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition font-mono"
            />
          </div>

          {/* Note to Technician */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-brand" /> Note to Technician
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any context, location directions, or special instructions..."
              className="w-full p-3 border border-surface-border rounded-xl text-xs bg-surface-bg/50 focus:bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition"
            />
          </div>

          {/* Submit Assign Button */}
          <button
            type="submit"
            disabled={submitting || !selectedTech}
            className="w-full py-3 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                Assign to {selectedTech?.name || 'Technician'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
