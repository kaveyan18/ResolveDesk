export default function TableSkeleton({ rows = 4, cols = 5 }) {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="p-4 rounded-xl border border-surface-border bg-white flex items-center justify-between gap-4"
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={`h-4 bg-slate-200 rounded-md ${
                cIdx === 0 ? 'w-1/3' : cIdx === cols - 1 ? 'w-16 ml-auto' : 'w-1/6'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
