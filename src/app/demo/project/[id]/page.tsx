'use client';

import Link from 'next/link';
import { Ruler } from '@/components/icons';

export default function ProjectExperiencePage() {
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
        Project Experience
      </h1>

      {/* Info card */}
      <div className="bg-surface-panel rounded-lg p-xl border border-border-subtle shadow-card">
        <div className="flex gap-lg items-start">
          <span className="flex h-[48px] w-[48px] flex-shrink-0 items-center justify-center rounded-md bg-surface-raised text-ember">
            <Ruler size={28} weight="regular" />
          </span>
          <div className="space-y-md">
            <h2 className="font-serif font-semibold text-text-primary">
              Multi-stage learning projects with capstone outcomes
            </h2>
            <p className="font-serif text-sm text-text-secondary">
              Guide your children through extended investigations that build deep understanding. Projects can span weeks or months, with clear milestones and final demonstrations of learning.
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
