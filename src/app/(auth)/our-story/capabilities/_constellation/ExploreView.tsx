'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { SUBJECTS } from '@/types';
import { DOMAIN_LABELS } from '@/components/ui/DomainChip';
import { getThreadName } from '@/lib/capability-threads';
import { subjectActivityLabel } from '@/lib/report/coverage-narrative';
import {
  THREADS_BY_ID,
  domainColor,
  type CurriculumCoverage,
  type GapAnalysis,
  type LearnerSnapshot,
} from './topology';

/**
 * Depth-less "Explore" lens over the constellation: where this learner is thin
 * and what's worth a look next. Reads the per-child snapshot's gap_analysis +
 * curriculum_coverage (surfaced by GET /api/capabilities/[learnerId]). No drill
 * depth — a flat, scannable companion to the Table/Gallery progression views.
 *
 * Coverage is shown as a gentle activity signal, never a shaming "coverage %"
 * (the snapshot's coverage_percentage is just an entry-volume proxy — see B6,
 * coverage-narrative.ts). The word comes from subjectActivityLabel; the bar is
 * visual only.
 */
export function ExploreView({
  snap,
  gapAnalysis,
  curriculumCoverage,
  onDrillThread,
}: {
  snap: LearnerSnapshot;
  gapAnalysis: GapAnalysis;
  curriculumCoverage: CurriculumCoverage;
  onDrillThread: (threadId: string) => void;
}) {
  const underserved = gapAnalysis?.underserved_subjects ?? [];
  // Only keep threads we can actually drill into, so no chip dead-ends.
  const focusThreads = useMemo(
    () => (gapAnalysis?.suggested_focus_threads ?? []).filter((id) => THREADS_BY_ID[id]),
    [gapAnalysis],
  );
  const hasGaps = underserved.length > 0 || focusThreads.length > 0;

  const subjectRows = SUBJECTS.map((subject) => {
    const c = curriculumCoverage?.[subject];
    const entries = c?.total_entries ?? 0;
    const descriptors = c?.unique_descriptors ?? 0;
    const pct = Math.max(0, Math.min(100, Math.round(c?.coverage_percentage ?? 0)));
    return { subject, entries, descriptors, pct };
  });
  const totalEntries = subjectRows.reduce((s, r) => s + r.entries, 0);

  return (
    <div className="flex flex-col gap-lg">
      <p className="max-w-[60ch] font-serif italic leading-relaxed text-text-secondary">
        Where {snap.name} has room to grow — and a few threads worth a look next. Nothing here is
        a gap to fix; it&rsquo;s just where the light hasn&rsquo;t fallen yet.
      </p>

      {/* ── Worth a look next ── */}
      <section className="rounded-lg border border-border-subtle bg-surface-panel p-xl">
        <h2 className="font-serif text-lg font-semibold text-text-primary">Worth a look next</h2>
        {hasGaps ? (
          <div className="mt-md flex flex-col gap-md">
            {focusThreads.length > 0 && (
              <div>
                <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Suggested threads
                </p>
                <div className="mt-sm flex flex-wrap gap-sm">
                  {focusThreads.map((id) => {
                    const t = THREADS_BY_ID[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onDrillThread(id)}
                        className="inline-flex items-center gap-[6px] rounded-full border border-border-subtle bg-transparent px-md py-xs font-sans text-[0.8rem] font-medium text-text-secondary transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:border-border-medium hover:text-text-primary"
                      >
                        <span
                          className="inline-block h-[8px] w-[8px] rounded-full"
                          style={{ background: domainColor(t.domain) }}
                          aria-hidden
                        />
                        {getThreadName(id)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {underserved.length > 0 && (
              <div>
                <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Lighter subjects lately
                </p>
                <div className="mt-sm flex flex-wrap gap-sm">
                  {underserved.map((subject) => (
                    <span
                      key={subject}
                      className="inline-flex items-center gap-xs rounded-full border border-border-subtle bg-surface-raised px-md py-xs font-sans text-[0.8rem] text-text-secondary"
                    >
                      {DOMAIN_LABELS[subject] ?? subject}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/log?source=check-in&learner=${encodeURIComponent(snap.id)}`}
                  className="mt-md inline-block rounded-md bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-colors duration-[var(--motion-quick)] hover:bg-ember-hover"
                >
                  Log a moment →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-sm font-serif italic text-text-secondary">
            {totalEntries === 0
              ? `Once you start logging, Hearth will point to where ${snap.name}'s attention could go next.`
              : `${snap.name}'s recent activity looks evenly spread — nothing's been flagged as thin.`}
          </p>
        )}
      </section>

      {/* ── Activity by subject ── */}
      <section className="rounded-lg border border-border-subtle bg-surface-panel p-xl">
        <h2 className="font-serif text-lg font-semibold text-text-primary">Activity by subject</h2>
        <p className="mt-xs font-sans text-[0.75rem] text-text-muted">
          How much {snap.name} has been logged in each area — a rhythm signal, not a score.
        </p>
        <ul className="mt-md flex flex-col gap-md">
          {subjectRows.map((r) => (
            <li key={r.subject} className="flex flex-col gap-xs sm:flex-row sm:items-center sm:gap-md">
              <span className="font-serif text-sm text-text-primary sm:w-[140px] sm:shrink-0">
                {DOMAIN_LABELS[r.subject] ?? r.subject}
              </span>
              <div className="flex flex-1 items-center gap-md">
                <div
                  className="h-[8px] flex-1 overflow-hidden rounded-full bg-surface-hover"
                  role="progressbar"
                  aria-valuenow={r.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${DOMAIN_LABELS[r.subject] ?? r.subject}: ${subjectActivityLabel(r.entries)}`}
                >
                  <div
                    className="h-full rounded-full bg-sage transition-[width] duration-[var(--motion-base)] ease-[var(--ease-out)]"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
                <span className="w-[120px] shrink-0 text-right font-sans text-[0.75rem] text-text-muted">
                  {subjectActivityLabel(r.entries)}
                  {r.entries > 0 && (
                    <span className="ml-xs text-text-secondary">
                      · {r.entries} {r.entries === 1 ? 'moment' : 'moments'}
                    </span>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
