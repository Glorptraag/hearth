/**
 * Loading skeleton for the Logger, shown while learners/family/snapshot data is
 * in flight. Extracted verbatim from log/page.tsx — pure presentation, no state.
 */
export function SkeletonLoader() {
  return (
    <div className="relative">
      {/* Header bar skeleton */}
      <div className="sticky top-0 z-10 flex items-center gap-md border-b border-border-subtle bg-surface-panel px-md py-sm lg:px-lg">
        <div className="flex-1 min-w-0">
          <div className="h-6 w-2/3 rounded-md bg-surface-raised hearth-skeleton mb-sm" />
          <div className="h-3 w-1/2 rounded-md bg-surface-raised hearth-skeleton hidden sm:block" />
        </div>
        <div className="flex items-center gap-sm">
          <div className="h-10 w-10 rounded-full bg-surface-raised hearth-skeleton" />
          <div className="hidden sm:block">
            <div className="h-3 w-24 rounded-md bg-surface-raised hearth-skeleton mb-sm" />
            <div className="h-3 w-20 rounded-md bg-surface-raised hearth-skeleton" />
          </div>
        </div>
        <div className="h-9 w-20 rounded-md bg-surface-raised hearth-skeleton" />
      </div>

      <div className="flex-1 lg:flex">
        {/* Left: Form skeleton */}
        <div className="flex-1 overflow-y-auto px-md py-lg lg:flex lg:justify-center">
          <div className="w-full max-w-[560px] xl:max-w-[600px] space-y-xl">
            {/* Section 1 skeleton */}
            <section>
              <div className="flex items-center gap-sm mb-md">
                <div className="h-6 w-6 rounded-full bg-surface-raised hearth-skeleton shrink-0" />
                <div className="h-3 w-32 rounded-md bg-surface-raised hearth-skeleton" />
              </div>
              <div className="flex flex-wrap gap-sm">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-9 w-32 rounded-full border border-border-subtle bg-surface-raised hearth-skeleton"
                  />
                ))}
              </div>
            </section>

            {/* Section 2 skeleton */}
            <section>
              <div className="flex items-center gap-sm mb-md">
                <div className="h-6 w-6 rounded-full bg-surface-raised hearth-skeleton shrink-0" />
                <div className="h-3 w-32 rounded-md bg-surface-raised hearth-skeleton" />
              </div>

              {/* Textarea skeleton */}
              <div className="mb-lg">
                <div className="h-[100px] w-full rounded-lg border border-border-subtle bg-surface-raised hearth-skeleton mb-sm" />
                <div className="flex items-center gap-xs">
                  <div className="h-8 w-20 rounded-sm bg-surface-raised hearth-skeleton" />
                </div>
              </div>

              {/* Activity type grid skeleton */}
              <div className="mt-lg">
                <div className="h-3 w-24 rounded-md bg-surface-raised hearth-skeleton mb-sm" />
                <div className="grid grid-cols-4 gap-sm">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 rounded-lg border border-border-subtle bg-surface-raised hearth-skeleton"
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Section 3 skeleton (engagement) */}
            <section>
              <div className="flex items-center gap-sm mb-md">
                <div className="h-6 w-6 rounded-full bg-surface-raised hearth-skeleton shrink-0" />
                <div className="h-3 w-32 rounded-md bg-surface-raised hearth-skeleton" />
              </div>
              <div className="h-16 w-full rounded-lg border border-border-subtle bg-surface-raised hearth-skeleton" />
            </section>

            {/* Section 4 skeleton (context) */}
            <section>
              <div className="flex items-center gap-sm mb-md">
                <div className="h-6 w-6 rounded-full bg-surface-raised hearth-skeleton shrink-0" />
                <div className="h-3 w-32 rounded-md bg-surface-raised hearth-skeleton" />
              </div>
              <div className="grid grid-cols-2 gap-sm">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 rounded-lg border border-border-subtle bg-surface-raised hearth-skeleton"
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
