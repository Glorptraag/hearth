export default function AnalyticsLoading() {
  return (
    <div className="p-lg max-w-[960px] animate-pulse">
      <div className="h-6 w-32 rounded bg-surface-raised mb-lg" />
      <div className="grid gap-lg">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border-subtle bg-surface-panel p-md">
            <div className="h-3 w-40 rounded bg-surface-raised mb-md" />
            <div className="h-48 rounded bg-surface-raised" />
          </div>
        ))}
      </div>
    </div>
  );
}
