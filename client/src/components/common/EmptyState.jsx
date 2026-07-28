import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  message = 'There are no records to display at this time.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="py-14 px-4 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-surface-bg border border-surface-border flex items-center justify-center text-slate-400 mb-1">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>
      <div className="space-y-1 max-w-sm">
        <b className="block text-sm font-bold text-ink font-display">{title}</b>
        <p className="text-xs text-ink-muted leading-relaxed">{message}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition shadow-sm"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
