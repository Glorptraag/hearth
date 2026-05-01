import Link from 'next/link';

export default function DevPreviewActivities() {
  return (
    <div className="mx-auto max-w-2xl px-md py-xl">
      <div className="mb-xl">
        <h1 className="font-serif text-2xl font-semibold text-text-primary">My Library</h1>
        <p className="mt-xs font-sans text-sm text-text-secondary">
          Modules from packs you&rsquo;ve added
        </p>
      </div>

      {/* Tab bar for Activities / Marketplace */}
      <div className="mb-xl flex gap-sm border-b border-border-subtle">
        <span className="border-b-2 border-ember pb-sm font-sans text-sm font-semibold text-ember">
          My Library
        </span>
        <Link
          href="/dev-preview/explore/marketplace"
          className="pb-sm font-sans text-sm font-medium text-text-muted transition-colors hover:text-text-secondary"
        >
          Marketplace
        </Link>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center gap-md rounded-[16px] border border-border-subtle bg-surface-panel px-lg py-xl text-center shadow-card">
        <span className="text-4xl" aria-hidden="true">📚</span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-text-primary">
            Your library is empty
          </h2>
          <p className="mt-xs font-sans text-sm text-text-secondary">
            Browse the marketplace to find packs for your family.
          </p>
        </div>
        <Link
          href="/dev-preview/explore/marketplace"
          className="rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[var(--ease-default)] hover:bg-ember-hover"
        >
          Browse Marketplace
        </Link>
      </div>
    </div>
  );
}
