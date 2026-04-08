export default function AdminDashboardLoading() {
  return (
    <div className="p-lg max-w-[960px] animate-pulse">
      <div className="h-6 w-40 rounded bg-surface-raised mb-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mb-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border-subtle bg-surface-panel p-md">
            <div className="h-3 w-20 rounded bg-surface-raised mb-sm" />
            <div className="h-8 w-16 rounded bg-surface-raised" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-panel p-md">
        <div className="h-3 w-32 rounded bg-surface-raised mb-md" />
        <div className="space-y-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-surface-raised" style={{ width: `${70 - i * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
