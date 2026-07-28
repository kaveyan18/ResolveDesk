import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  message = 'Failed to load data. Please try again.',
  onRetry,
}) {
  return (
    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3 my-2">
      <div className="flex items-center gap-2 min-w-0">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        <span className="font-medium truncate">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition flex items-center gap-1.5 flex-shrink-0 shadow-xs"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      )}
    </div>
  );
}
