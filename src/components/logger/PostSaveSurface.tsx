'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check, Sparkle } from '@/components/icons';
import WorkSamplePill from '@/components/ui/WorkSamplePill';
import type { AiEnrichment } from '@/types/enrichment';
import { useViewedOnce } from '@/hooks/use-viewed-once';
import { track, hashForAnalytics } from '@/lib/analytics/posthog';
import { isSuppressedThread } from '@/lib/capability-alpha-suppression';

// Mirrors the taxonomy in src/lib/ai/enrich.ts. Kept local so this surface
// doesn't have to reach into the route file for labels; the surface only
// names threads, it doesn't define the taxonomy.
const THREAD_LABELS: Record<string, string> = {
  L1: 'Oral Communication', L2: 'Phonological Awareness', L3: 'Reading Comprehension',
  L4: 'Vocabulary', L5: 'Written Expression', L6: 'Spelling & Grammar',
  L7: 'Narrative', L8: 'Persuasion', L9: 'Literary Appreciation',
  M1: 'Number Sense', M2: 'Operations', M3: 'Fractional Thinking',
  M4: 'Algebraic Thinking', M5: 'Measurement', M6: 'Spatial Reasoning',
  M7: 'Data & Statistics', M8: 'Probability', M9: 'Mathematical Modelling',
  S1: 'Scientific Inquiry', S2: 'Biological Sciences', S3: 'Chemical Sciences',
  S4: 'Physical Sciences', S5: 'Scientific Observation', S6: 'Earth & Space',
  H1: 'Historical Understanding', H2: 'Source Analysis', H3: 'Geographical Understanding',
  H4: 'Civics & Citizenship', H5: 'Economics & Business', H6: 'Cultural Understanding',
  P1: 'Gross Motor', P2: 'Fine Motor', P3: 'Body Awareness', P4: 'Team & Sport', P5: 'Aquatics',
  PS1: 'Empathy', PS2: 'Social Skills', PS3: 'Self-Regulation', PS4: 'Identity',
  PS5: 'Responsibility', PS6: 'Resilience', PS7: 'Safety',
  C1: 'Visual Art', C2: 'Music', C3: 'Drama', C4: 'Dance', C5: 'Media Arts',
  C6: 'Design & Construction', C7: 'Arts Appreciation',
  EF1: 'Sustained Attention', EF2: 'Working Memory', EF3: 'Cognitive Flexibility',
  EF4: 'Planning', EF5: 'Critical Thinking', EF6: 'Collaboration',
  EF7: 'Metacognition', EF8: 'Transfer',
};

const SUBJECT_LABELS: Record<string, string> = {
  Mathematics: 'Maths',
  English: 'English',
  Science: 'Science',
  HASS: 'HASS',
  'The Arts': 'Arts',
  Technologies: 'Tech',
  HPE: 'HPE',
  Languages: 'Languages',
};

export type PostSaveSurfaceProps = {
  enrichment: AiEnrichment | null;
  evidenceCount: number;
  onLogAnother: () => void;
  entryId?: string;
  savedAtMs?: number;
  scaffolded?: boolean;
};

export function PostSaveSurface({
  enrichment,
  evidenceCount,
  onLogAnother,
  entryId,
  savedAtMs,
  scaffolded,
}: PostSaveSurfaceProps) {
  const status = enrichment?.status ?? 'pending';
  const surfaceRef = useRef<HTMLDivElement>(null);
  const hashedEntryIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!entryId) return;
    hashForAnalytics(entryId).then((h) => { hashedEntryIdRef.current = h; }).catch(() => {});
  }, [entryId]);

  // Mirror EnrichedBody's non-null predicate so useViewedOnce is only enabled
  // when the surface actually shows enrichment content to the parent.
  const reflection =
    status === 'enriched' && enrichment
      ? enrichment.insight_suggestions?.[0]?.trim() ||
        enrichment.journey_observation?.text?.trim() ||
        null
      : null;
  // First NON-suppressed thread: enrichment may still tag alpha-suppressed
  // threads internally (evidence preserved), but the post-save line never
  // names one to the parent.
  const topThread =
    status === 'enriched' && enrichment
      ? enrichment.capability_threads?.find((t) => !isSuppressedThread(t.thread_id))
      : undefined;
  const threadLabel = topThread ? THREAD_LABELS[topThread.thread_id] : null;
  const workSampleFlagged = Boolean(status === 'enriched' && enrichment?.work_sample?.flag === true);
  const hasContent = Boolean(reflection || threadLabel || workSampleFlagged);

  useViewedOnce(
    surfaceRef,
    () => {
      const props: Record<string, string | number | boolean> = {
        wait_ms: savedAtMs != null ? Math.round(Date.now() - savedAtMs) : 0,
        had_insight: Boolean(reflection),
        had_thread: Boolean(threadLabel),
        had_work_sample: workSampleFlagged,
        scaffolded: scaffolded ?? false,
      };
      if (hashedEntryIdRef.current) props.entry_id = hashedEntryIdRef.current;
      track('enrichment_viewed', props);
    },
    { threshold: 0.5, dwellMs: 1000, enabled: status === 'enriched' && hasContent },
  );

  return (
    <div
      ref={surfaceRef}
      role="region"
      aria-label="Moment saved"
      className="hearth-modal-enter mx-auto flex max-w-2xl flex-col gap-lg px-md py-xl lg:px-lg"
    >
      <SeenConfirmation
        status={status}
        subjects={enrichment?.subjects_detected ?? []}
        evidenceCount={evidenceCount}
      />

      {status === 'pending' && <PendingBody />}
      {status === 'enriched' && <EnrichedBody enrichment={enrichment!} />}
      {status === 'failed' && <FailedBody />}

      <ExitRow onLogAnother={onLogAnother} />
    </div>
  );
}

function SeenConfirmation({
  status,
  subjects,
  evidenceCount,
}: {
  status: 'pending' | 'enriched' | 'failed';
  subjects: string[];
  evidenceCount: number;
}) {
  const heading =
    status === 'enriched'
      ? 'Saved — and here\u2019s what we noticed.'
      : status === 'failed'
      ? 'Saved.'
      : 'Saved \u2014 reading this moment\u2026';

  return (
    <div className="flex flex-col gap-sm">
      <div className="inline-flex items-center gap-sm text-text-secondary">
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ember/10 text-ember"
        >
          <Check size={16} weight="bold" />
        </span>
        <span className="font-sans text-[11px] uppercase tracking-[0.08em] text-text-muted">
          Moment captured
        </span>
      </div>
      <h2 className="display text-[1.6rem] leading-tight text-text-primary">{heading}</h2>

      {(subjects.length > 0 || evidenceCount > 0) && status !== 'pending' && (
        <div className="flex flex-wrap items-center gap-xs pt-xs">
          {subjects.slice(0, 4).map((s) => (
            <span
              key={s}
              className="rounded-md border border-border-subtle bg-surface-raised px-sm py-[2px] font-sans text-[11px] text-text-secondary"
            >
              {SUBJECT_LABELS[s] ?? s}
            </span>
          ))}
          {evidenceCount > 0 && (
            <span className="rounded-md border border-border-subtle bg-surface-raised px-sm py-[2px] font-sans text-[11px] text-text-muted">
              {evidenceCount === 1 ? '1 piece of evidence' : `${evidenceCount} pieces of evidence`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function PendingBody() {
  return (
    <div className="hearth-skeleton flex flex-col gap-sm rounded-lg border border-border-subtle bg-surface-panel p-lg">
      <div className="h-[14px] w-3/4 rounded bg-surface-raised" />
      <div className="h-[14px] w-2/3 rounded bg-surface-raised" />
      <div className="h-[14px] w-1/2 rounded bg-surface-raised" />
    </div>
  );
}

function EnrichedBody({ enrichment }: { enrichment: AiEnrichment }) {
  const reflection =
    enrichment.insight_suggestions?.[0]?.trim() ||
    enrichment.journey_observation?.text?.trim() ||
    null;

  const topThread = enrichment.capability_threads?.find((t) => !isSuppressedThread(t.thread_id));
  const threadLabel = topThread ? THREAD_LABELS[topThread.thread_id] : null;
  const workSampleFlagged = enrichment.work_sample?.flag === true;

  if (!reflection && !threadLabel && !workSampleFlagged) return null;

  return (
    <div className="flex flex-col gap-md rounded-lg border border-border-subtle bg-surface-panel p-lg">
      {reflection && (
        <p className="body-serif text-[1.05rem] leading-relaxed text-text-primary">
          {reflection}
        </p>
      )}
      {threadLabel && (
        <p className="inline-flex items-center gap-xs font-sans text-[12px] text-text-muted">
          <Sparkle size={14} aria-hidden="true" />
          <span>
            This is the kind of moment that builds the{' '}
            <span className="text-ember">{threadLabel}</span> thread.
          </span>
        </p>
      )}
      {workSampleFlagged && (
        <div>
          <WorkSamplePill quality={enrichment.work_sample?.quality} />
        </div>
      )}
    </div>
  );
}

function FailedBody() {
  return (
    <p className="font-sans text-[13px] leading-relaxed text-text-secondary">
      We couldn&rsquo;t draw out insights this time. This moment is safe in your sessions
      &mdash; you can return to it any time.
    </p>
  );
}

function ExitRow({ onLogAnother }: { onLogAnother: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-sm pt-sm sm:flex-row sm:justify-end">
      <Link
        href="/"
        className="hearth-press inline-flex items-center justify-center rounded-md border border-border-subtle bg-transparent px-md py-sm font-sans text-sm font-semibold text-text-secondary transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:border-border-medium hover:text-text-primary"
      >
        Back to Dashboard
      </Link>
      <button
        type="button"
        onClick={onLogAnother}
        className="hearth-press inline-flex items-center justify-center rounded-md bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse shadow-ember transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]"
      >
        Log Another
      </button>
    </div>
  );
}
