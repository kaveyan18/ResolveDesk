import { Check } from 'lucide-react';

/**
 * Reusable Vertical Status Thread Timeline Component
 * Signature interaction pattern from AGENTS.md section 6
 */
export default function StatusThreadTimeline({ status, complaint, customSteps }) {
  // Determine standard steps if customSteps is not passed
  const getStandardSteps = () => {
    const isRejected = status === 'Rejected';

    if (isRejected) {
      return [
        {
          title: 'Complaint Submitted',
          description: formatDate(complaint?.createdAt) || 'Submitted',
          isDone: true,
          isCurrent: false,
        },
        {
          title: 'Complaint Rejected',
          description: complaint?.rejectionReason || 'Rejected by department head',
          isDone: true,
          isCurrent: true,
          isError: true,
        },
      ];
    }

    const statusOrder = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    const currentIdx = statusOrder.indexOf(status);

    return [
      {
        title: 'Complaint Submitted',
        description: formatDate(complaint?.createdAt) || 'Submitted',
        isDone: currentIdx >= 0,
        isCurrent: currentIdx === 0,
      },
      {
        title: 'Department Assigned',
        description: complaint?.department?.name
          ? `${complaint.department.name}`
          : 'Pending department routing',
        isDone: currentIdx >= 1 || Boolean(complaint?.department),
        isCurrent: currentIdx === 1 && !complaint?.assignedTechnician,
      },
      {
        title: 'Technician Assigned',
        description: complaint?.assignedTechnician?.name
          ? `Assigned to ${complaint.assignedTechnician.name}`
          : 'Pending technician assignment',
        isDone: currentIdx >= 1 && Boolean(complaint?.assignedTechnician),
        isCurrent: currentIdx === 1 && Boolean(complaint?.assignedTechnician),
      },
      {
        title: 'In Progress',
        description:
          currentIdx >= 2
            ? 'Technician actively resolving issue'
            : 'Pending work start',
        isDone: currentIdx >= 2,
        isCurrent: currentIdx === 2,
      },
      {
        title: 'Resolved',
        description:
          currentIdx >= 3
            ? formatDate(complaint?.resolvedAt) || 'Issue marked resolved'
            : 'Pending resolution',
        isDone: currentIdx >= 3,
        isCurrent: currentIdx === 3,
      },
      {
        title: 'Closed & Rated',
        description:
          currentIdx >= 4
            ? formatDate(complaint?.closedAt) || 'Case closed'
            : 'Pending student feedback',
        isDone: currentIdx >= 4,
        isCurrent: currentIdx === 4,
      },
    ];
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const steps = customSteps || getStandardSteps();

  return (
    <div className="py-2 px-1">
      <div className="space-y-0 relative">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          return (
            <div key={idx} className="flex gap-4 items-start relative pb-7 last:pb-0">
              {/* Connector Vertical Line */}
              {!isLast && (
                <div
                  className={`absolute left-[9px] top-5 bottom-0 w-[2px] transition-colors ${
                    step.isDone && !step.isCurrent
                      ? 'bg-status-success'
                      : 'bg-surface-border'
                  }`}
                />
              )}

              {/* Node Indicator */}
              <div className="relative z-10 flex-shrink-0 mt-0.5">
                {step.isError ? (
                  <div className="w-5 h-5 rounded-full bg-status-danger text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                    ✕
                  </div>
                ) : step.isCurrent ? (
                  <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center border-2 border-white shadow-[0_0_0_4px_rgba(42,79,209,0.25)] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                ) : step.isDone ? (
                  <div className="w-5 h-5 rounded-full bg-status-success text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                    <Check className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-surface-bg border-2 border-surface-border flex items-center justify-center" />
                )}
              </div>

              {/* Text Content */}
              <div className="space-y-0.5 min-w-0">
                <b
                  className={`block text-xs font-semibold ${
                    step.isCurrent
                      ? 'text-brand font-bold'
                      : step.isDone
                        ? 'text-ink'
                        : 'text-ink-muted'
                  }`}
                >
                  {step.title}
                </b>
                <span className="block text-[11.5px] font-mono text-ink-muted leading-tight">
                  {step.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
