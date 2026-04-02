'use client';

import Link from 'next/link';

export default function BadgeCreatorPage() {
  return (
    <div className="flex-1 flex flex-col px-md py-xl gap-lg max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/demo/dashboard"
        className="font-sans text-sm font-medium text-ember hover:text-ember-hover transition-colors self-start"
      >
        ← Back to Dashboard
      </Link>

      {/* Title */}
      <h1 className="font-serif text-2xl font-semibold text-text-primary">
        Badge Creator
      </h1>

      {/* Info card */}
      <div className="bg-surface-panel rounded-lg p-xl border border-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        <div className="flex gap-lg items-start">
          <div className="text-4xl flex-shrink-0">🏆</div>
          <div className="space-y-md">
            <h2 className="font-serif font-semibold text-text-primary">
              Create custom badges to celebrate your family&apos;s unique achievements
            </h2>
            <p className="font-serif text-sm text-text-secondary">
              Define observable indicators and link them to capability threads. Create badges that reflect your family&apos;s values and learning journey.
            </p>
            <p className="font-sans text-xs text-text-muted">
              Available after sign-up
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-lg border-t border-border-subtle">
        <Link
          href="/onboarding"
          className="inline-block bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-colors duration-200"
        >
          Start your Hearth →
        </Link>
      </div>
    </div>
  );
}
