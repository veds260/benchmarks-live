export function SkeletonTable({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 bg-bg-card rounded-lg animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="w-8 h-4 bg-bg-tertiary rounded" />
          <div className="w-32 h-4 bg-bg-tertiary rounded" />
          <div className="w-16 h-6 bg-bg-tertiary rounded-md" />
          <div className="flex-1" />
          <div className="w-12 h-4 bg-bg-tertiary rounded" />
          <div className="w-12 h-4 bg-bg-tertiary rounded" />
          <div className="w-16 h-4 bg-bg-tertiary rounded" />
          <div className="w-20 h-6 bg-bg-tertiary rounded" />
        </div>
      ))}
    </div>
  );
}
