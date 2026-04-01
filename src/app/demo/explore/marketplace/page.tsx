'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import DomainChip from '@/components/ui/DomainChip';
import { mockPacks } from '../../mock-data';

const SUBJECTS = [
  'english', 'mathematics', 'science', 'hass',
  'arts', 'technologies', 'hpe', 'languages',
] as const;

export default function DemoMarketplace() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  function toggleSubject(s: string) {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const filtered = useMemo(() => {
    if (selectedSubjects.length === 0) return mockPacks;
    return mockPacks.filter((p) =>
      p.subjects.some((s) => selectedSubjects.includes(s))
    );
  }, [selectedSubjects]);

  return (
    <div className="mx-auto max-w-5xl px-md py-xl">
      {/* Header + tabs */}
      <div className="mb-lg">
        <h1 className="font-serif text-2xl font-semibold text-text-primary tracking-[-0.02em] mb-md">
          Marketplace
        </h1>
        <div className="flex gap-lg border-b border-border-subtle">
          <Link
            href="/demo/explore/activities"
            className="pb-sm font-sans text-sm font-medium text-text-muted hover:text-text-secondary transition-colors duration-200"
          >
            My Library
          </Link>
          <span className="pb-sm font-sans text-sm font-semibold text-ember border-b-2 border-ember">
            Marketplace
          </span>
        </div>
      </div>

      {/* Subject filters */}
      <div className="mb-xl flex flex-wrap gap-sm">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => toggleSubject(s)}
            className={`transition-opacity duration-200 ${
              selectedSubjects.length === 0 || selectedSubjects.includes(s)
                ? 'opacity-100'
                : 'opacity-40'
            }`}
          >
            <DomainChip subject={s} size="sm" showEmoji />
          </button>
        ))}
      </div>

      {/* Pack grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg lg:grid-cols-2">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="bg-surface-panel rounded-lg p-xl border border-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:translate-y-[-2px] hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-start gap-lg">
              <span className="text-4xl">{p.imageEmoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg font-semibold text-text-primary mb-sm">
                  {p.title}
                </h3>
                <p className="font-serif text-sm text-text-secondary leading-relaxed mb-md line-clamp-3">
                  {p.description}
                </p>
                <div className="flex flex-wrap gap-xs mb-md">
                  {p.subjects.map((s) => (
                    <DomainChip key={s} subject={s} size="sm" />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-md font-sans text-xs text-text-muted">
                    <span>Ages {p.ageRange.min}–{p.ageRange.max}</span>
                    <span>{p.moduleCount} modules</span>
                  </div>
                  <span className="rounded-full bg-sage/20 px-md py-xs font-sans text-xs font-semibold text-sage">
                    Included with membership
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-xl bg-surface-panel rounded-lg p-xl border border-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.3)] text-center">
        <p className="font-serif text-base text-text-primary mb-sm">
          More packs coming soon
        </p>
        <p className="font-serif text-sm text-text-secondary">
          We&apos;re building new content every month.
        </p>
      </div>
    </div>
  );
}
