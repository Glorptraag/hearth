export default function FamiliesLoading() {
  return (
    <div className="p-lg max-w-[960px] animate-pulse">
      <div className="h-6 w-28 rounded bg-surface-raised mb-lg" />
      <div className="h-10 rounded-md bg-surface-raised mb-md" />
      <div className="space-y-xs">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border-subtle bg-surface-panel p-md">
            <div className="flex items-center gap-md">
              <div className="h-8 w-8 rounded-full bg-surface-raised" />
              <div className="flex-1">
                <div className="h-3 w-36 rounded bg-surface-raised mb-xs" />
                <div className="h-2.5 w-24 rounded bg-surface-raised" />
              </div>
              <div className="h-5 w-16 rounded-full bg-surface-raised" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
