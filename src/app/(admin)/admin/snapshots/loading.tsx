export default function SnapshotsLoading() {
  return (
    <div className="p-lg max-w-[960px] animate-pulse">
      <div className="h-6 w-36 rounded bg-surface-raised mb-lg" />
      <div className="rounded-lg border border-border-subtle bg-surface-panel p-md mb-lg">
        <div className="h-3 w-48 rounded bg-surface-raised mb-md" />
        <div className="h-40 rounded bg-surface-raised" />
      </div>
      <div className="space-y-xs">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border-subtle bg-surface-panel p-md">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-3 w-32 rounded bg-surface-raised mb-xs" />
                <div className="h-2.5 w-20 rounded bg-surface-raised" />
              </div>
              <div className="h-7 w-20 rounded-md bg-surface-raised" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
