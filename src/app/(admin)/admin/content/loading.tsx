export default function ContentLoading() {
  return (
    <div className="flex h-[calc(100vh-48px)] animate-pulse">
      <div className="w-[260px] border-r border-border-subtle bg-surface-panel p-md">
        <div className="h-8 rounded-md bg-surface-raised mb-md" />
        <div className="space-y-xs">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 rounded-md bg-surface-raised" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-lg">
        <div className="h-5 w-48 rounded bg-surface-raised mb-md" />
        <div className="space-y-md">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-surface-raised" />
          ))}
        </div>
      </div>
    </div>
  );
}
