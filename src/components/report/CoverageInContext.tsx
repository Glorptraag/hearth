'use client';

import Link from 'next/link';
import { NotePencil, Books, Paperclip, CheckCircle, Sparkle, Plant, Compass } from '@/components/icons';
import type { CoverageNarrative } from '@/lib/report/coverage-narrative';

/**
 * Coverage in context (B6 — humane coverage framing).
 *
 * Keeps a sparse-but-honest report from reading "you did nothing" at the
 * Stage-4 compliance event. The deterministic curriculum count never stands
 * alone: it sits beside the real activity the family has built (entries,
 * evidence, observed threads) and an honest, regulator-aware framing of what
 * the formal number means right now. The two #204 failure classes get gentle,
 * distinct copy — A "mapping coming", B "evidence still emerging" — and an
 * "also showing up in your log" set surfaces real breadth the formal count
 * hasn't claimed yet, clearly separated so the two are never conflated.
 *
 * Serif for prose the parent reads; sans for figures and labels. No ember on
 * the default surface; sage only where something is genuinely earned. Static —
 * no animation, so it is reduced-motion safe by construction.
 */

function plural(n: number, singular: string, suffix = 's'): string {
  return n === 1 ? singular : `${singular}${suffix}`;
}

type StatTile = { key: string; value: number; label: string; Icon: typeof NotePencil; sage?: boolean };

export default function CoverageInContext({
  narrative,
  regulatorShort,
  curriculumFramework,
  reviewTerminology,
  coverageFrame,
  subjectLabels,
  isCdLevel,
}: {
  narrative: CoverageNarrative;
  regulatorShort: string;
  curriculumFramework: string;
  reviewTerminology: string;
  coverageFrame: string;
  subjectLabels: Record<string, string>;
  isCdLevel: boolean;
}) {
  const { state, activity, formal, observedAreas } = narrative;

  // The page's own EmptyState already owns the no-entries moment.
  if (state === 'pre_log') return null;

  const tiles: StatTile[] = [
    { key: 'entries', value: activity.entriesLogged, label: plural(activity.entriesLogged, 'moment') + ' logged', Icon: NotePencil },
    { key: 'subjects', value: activity.subjectsTouched, label: 'of 8 subjects explored', Icon: Books },
  ];
  if (activity.evidenceItems > 0) {
    tiles.push({ key: 'evidence', value: activity.evidenceItems, label: plural(activity.evidenceItems, 'piece') + ' of evidence', Icon: Paperclip });
  }
  if (isCdLevel && activity.confirmedWorkSamples > 0) {
    tiles.push({ key: 'samples', value: activity.confirmedWorkSamples, label: plural(activity.confirmedWorkSamples, 'work sample') + ' confirmed', Icon: CheckCircle, sage: true });
  }
  if (activity.threadsObserved > 0) {
    tiles.push({ key: 'threads', value: activity.threadsObserved, label: plural(activity.threadsObserved, 'capability thread') + ' observed', Icon: Sparkle });
  }

  // Framing block — state-specific, honest, regulator-aware. No "0%", no
  // "gap", no "behind", no "Critical".
  const framing: { Icon: typeof Plant; tone: 'sage' | 'neutral'; heading: string; body: string } = (() => {
    switch (state) {
      case 'mapped':
        return {
          Icon: CheckCircle,
          tone: 'sage',
          heading: 'Mapped to the curriculum so far',
          body: `${formal.mappedCodeCount} curriculum ${plural(formal.mappedCodeCount, 'outcome')} across ${formal.mappedSubjects.length} ${plural(formal.mappedSubjects.length, 'subject area')} are formally mapped to the ${curriculumFramework} for your ${regulatorShort} report. Everything else you've logged is captured below.`,
        };
      case 'mapping_gap': // class A
        return {
          Icon: Plant,
          tone: 'neutral',
          heading: 'Your evidence is mapping in',
          body: `Your child's learning is already developing in areas we're still mapping to the ${curriculumFramework}. The formal count below grows as those mappings land — and your full log and portfolio already hold the evidence.`,
        };
      case 'emerging': // class B
        return {
          Icon: Plant,
          tone: 'neutral',
          heading: 'Your evidence is still building',
          body: `Curriculum outcomes start counting here once your evidence reaches a "developing" level against the ${curriculumFramework}. Everything you've logged is captured in full below — a light formal count this early in the ${reviewTerminology} cycle is normal, not a shortfall.`,
        };
      default: // 'observed' — non-deterministic tiers (e.g. NSW/NESA)
        return {
          Icon: Compass,
          tone: 'neutral',
          heading: 'Built from everything you log',
          body: `Your ${regulatorShort} report draws on every moment you capture. So far your entries show learning across ${activity.subjectsTouched} of 8 subject areas, set out in detail below.`,
        };
    }
  })();

  return (
    <section
      aria-labelledby="coverage-context-heading"
      className="mt-lg rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-card"
    >
      <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
        {coverageFrame}
      </p>
      <h2 id="coverage-context-heading" className="font-serif text-lg font-semibold text-text-primary mb-md">
        Your evidence so far
      </h2>

      {/* Activity — the counter-weight. Real counts, never a percentage. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-sm mb-lg">
        {tiles.map((t) => (
          <div
            key={t.key}
            className="flex flex-col gap-xs rounded-md border border-border-subtle bg-surface-raised p-md"
          >
            <span className="inline-flex text-text-muted" aria-hidden="true">
              <t.Icon size={16} />
            </span>
            <span className={`font-sans text-2xl font-semibold leading-none ${t.sage ? 'text-sage' : 'text-text-primary'}`}>
              {t.value}
            </span>
            <span className="font-sans text-xs text-text-muted leading-snug">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Honest framing — what the formal number means right now. */}
      <div className="flex items-start gap-md rounded-md border border-border-subtle bg-surface-raised p-md">
        <span
          className={`mt-[2px] shrink-0 inline-flex ${framing.tone === 'sage' ? 'text-sage' : 'text-text-secondary'}`}
          aria-hidden="true"
        >
          <framing.Icon size={18} weight={framing.tone === 'sage' ? 'fill' : 'regular'} />
        </span>
        <div>
          <p className="font-serif text-sm font-semibold text-text-primary mb-xs">{framing.heading}</p>
          <p className="font-serif text-sm text-text-secondary leading-relaxed">{framing.body}</p>
        </div>
      </div>

      {/* Also observed — real breadth the formal count hasn't claimed. Kept
          visibly distinct from the formal figure, never merged into it. */}
      {observedAreas.length > 0 && (
        <div className="mt-md">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-sm">
            Also showing up in your log
          </p>
          <div className="flex flex-wrap gap-xs">
            {observedAreas.map((a) => (
              <span
                key={a.subject}
                className="inline-flex items-center gap-xs rounded-full border border-border-subtle bg-surface-raised px-sm py-[3px] font-sans text-[11px] text-text-secondary"
              >
                <span className="inline-flex text-text-muted" aria-hidden="true"><Sparkle size={12} /></span>
                {subjectLabels[a.subject] ?? a.subject}
              </span>
            ))}
          </div>
          <p className="mt-sm font-sans text-xs text-text-muted leading-snug">
            Noticed in your entries and mapping to the curriculum as the evidence deepens — not yet counted in the formal total above.
          </p>
        </div>
      )}

      <Link
        href="/our-story/portfolio"
        className="mt-md inline-block font-sans text-xs font-semibold text-ember hover:text-ember-hover transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]"
      >
        See everything in your portfolio →
      </Link>
    </section>
  );
}
