import Link from 'next/link';

export default function DevPreviewLog() {
  return (
    <div className="mx-auto max-w-2xl px-md py-xl">
      <div className="mb-xl">
        <h1 className="font-serif text-2xl font-semibold text-text-primary">Log a Session</h1>
        <p className="mt-xs font-sans text-sm text-text-secondary">
          The logger requires API connectivity. In dev preview, visit the real{' '}
          <Link href="/log" className="text-ember hover:text-ember-hover">
            /log
          </Link>{' '}
          route with auth.
        </p>
      </div>

      <div className="flex flex-col items-center gap-md rounded-[16px] border border-border-subtle bg-surface-panel px-lg py-xl text-center shadow-card">
        <span className="text-4xl" aria-hidden="true">✏️</span>
        <p className="font-serif text-base text-text-secondary">
          Logger preview coming soon — this route is a placeholder.
        </p>
        <Link
          href="/dev-preview/dashboard"
          className="rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition duration-[var(--motion-quick)] hover:bg-ember-hover"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
