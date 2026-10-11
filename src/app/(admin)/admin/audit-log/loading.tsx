export default function AuditLogLoading() {
  return (
    <div className="p-lg max-w-[960px] hearth-skeleton">
      <div className="h-6 w-28 rounded bg-surface-raised mb-lg" />
      <div className="flex gap-xs mb-md">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 w-20 rounded-md bg-surface-raised" />
        ))}
      </div>
      <div className="space-y-xs">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border-subtle bg-surface-panel p-md">
            <div className="flex items-start justify-between gap-md">
              <div className="flex-1">
                <div className="h-3 w-32 rounded bg-surface-raised mb-xs" />
                <div className="h-2.5 w-48 rounded bg-surface-raised" />
              </div>
              <div className="h-2.5 w-24 rounded bg-surface-raised" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
