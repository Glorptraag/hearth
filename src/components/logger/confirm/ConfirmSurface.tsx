'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Check } from '@/components/icons';
import { PedagogyAttribution } from '@/components/logger/PedagogyAttribution';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';
import { useProposalConfirm } from '@/hooks/use-proposal-confirm';
import { useToast } from '@/hooks/use-toast';
import { useViewedOnce } from '@/hooks/use-viewed-once';
import { hashForAnalytics, track } from '@/lib/analytics/posthog';
import type { BadgeReadyToast } from '@/lib/logger/badge-check';
import type { ConfirmState } from '@/lib/logger/confirm-state';
import type { Proposal } from '@/lib/logger/proposals';
import { BadgeReadyRow } from './BadgeReadyRow';
import { ConfirmExitRow } from './ConfirmExitRow';
import { ProposalGroup } from './ProposalGroup';
import { ReadDraftRow } from './ReadDraftRow';
import { WorkingFromChip } from './WorkingFromChip';
import { WatchForNext } from './WatchForNext';
import { confirmCopy, joinNames } from './confirmCopy';

export type ConfirmSurfaceProps = {
  state: ConfirmState;
  learners: LearnerRecord[];
  frameworkTitle: string;
  badgeReady: BadgeReadyToast | null;
  onLogAnother: () => void;
  /** Re-run enrichment for a failed read. The "Read it again" button only renders when provided. */
  onRetryEnrichment?: () => void;
  /** Module linking. The attach link only renders when provided. */
  attach?: { onOpen: () => void; attachedTitle: string | null };
};

type LearnerGroup = { learnerId: string; learnerName: string; colourToken: string | null; proposals: Proposal[] };

function groupByLearner(proposals: Proposal[]): LearnerGroup[] {
  const groups = new Map<string, LearnerGroup>();
  for (const p of proposals) {
    let g = groups.get(p.learnerId);
    if (!g) {
      g = { learnerId: p.learnerId, learnerName: p.learnerName, colourToken: p.colourToken, proposals: [] };
      groups.set(p.learnerId, g);
    }
    g.proposals.push(p);
  }
  return Array.from(groups.values());
}

const SENTENCE_CLASS = 'body-serif text-[1.05rem] leading-relaxed text-text-secondary';
const GHOST_CLASS =
  'hearth-press inline-flex min-h-[44px] items-center justify-center rounded-md border border-border-subtle bg-transparent px-md py-sm font-sans text-sm font-semibold text-text-secondary hover:border-border-medium hover:text-text-primary';

export function ConfirmSurface({
  state,
  learners,
  frameworkTitle,
  badgeReady,
  onLogAnother,
  onRetryEnrichment,
  attach,
}: ConfirmSurfaceProps) {
  const { toast } = useToast();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hashedEntryIdRef = useRef<string | null>(null);

  const onChipError = useCallback(() => toast(confirmCopy.chipError, 'error'), [toast]);
  const onReadError = useCallback((message: string) => toast(message, 'error'), [toast]);
  const { confirmed, busy, toggle } = useProposalConfirm({ onError: onChipError });

  const entryId = state.kind === 'queued' ? null : state.entryId;
  const savedAtMs = state.kind === 'queued' ? null : state.savedAtMs;
  const evidenceCount = state.kind === 'queued' ? 0 : state.evidenceCount;
  const scaffolded = state.kind !== 'queued' && state.source.kind === 'hearth_session';
  const proposalCount = state.kind === 'proposals' ? state.proposals.length : 0;
  const nobodyNamed = state.kind === 'nothing' && state.nobodyNamed;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!entryId) return;
    hashForAnalytics(entryId)
      .then((h) => {
        hashedEntryIdRef.current = h;
      })
      .catch(() => {});
  }, [entryId]);

  useViewedOnce(
    surfaceRef,
    () => {
      const props: Record<string, string | number | boolean> = {
        wait_ms: savedAtMs != null ? Math.round(Date.now() - savedAtMs) : 0,
        proposal_count: proposalCount,
        nobody_named: nobodyNamed,
        scaffolded,
      };
      if (hashedEntryIdRef.current) props.entry_id = hashedEntryIdRef.current;
      track('enrichment_viewed', props);
    },
    { threshold: 0.5, dwellMs: 1000, enabled: state.kind === 'proposals' || state.kind === 'nothing' },
  );

  const groups = useMemo(
    () => (state.kind === 'proposals' ? groupByLearner(state.proposals) : []),
    [state],
  );

  const entryLearnerNames = useMemo(() => {
    if (state.kind === 'queued') return [];
    return state.learnerIds
      .map((id) => learners.find((l) => l.id === id)?.name)
      .filter((n): n is string => Boolean(n));
  }, [state, learners]);

  const pedagogySources = state.kind === 'proposals' ? (state.enrichment.pedagogy_sources ?? []) : [];
  const enrichedKind = state.kind === 'proposals' || state.kind === 'nothing';
  // Photo Read (W3.3): a labelled draft the parent may take, and a Working-from
  // chip from the Shelf match on the photo's printed header. Never rendered as
  // a claim — provenance rule, Logger spec v2 §5.2.
  const read = enrichedKind ? (state.read ?? null) : null;

  return (
    <div
      ref={surfaceRef}
      role="region"
      aria-label={confirmCopy.region}
      className="hearth-page-enter mx-auto flex max-w-[560px] flex-col gap-lg px-md py-xl"
    >
      <div className="flex flex-col gap-sm">
        <div className="inline-flex items-center gap-sm text-text-secondary">
          <Check size={16} weight="bold" aria-hidden="true" />
          <span className="font-sans text-[11px] uppercase tracking-[0.08em]">{confirmCopy.overline}</span>
        </div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          aria-live="polite"
          className="display text-[1.6rem] leading-tight text-text-primary outline-none"
        >
          {confirmCopy.heading[state.kind]}
        </h2>
        {evidenceCount > 0 && (
          <div>
            <span className="inline-flex rounded-md border border-border-subtle bg-surface-raised px-sm py-[2px] font-sans text-[11px] text-text-muted">
              {confirmCopy.evidence(evidenceCount)}
            </span>
          </div>
        )}
      </div>

      {state.kind === 'queued' && <p className={SENTENCE_CLASS}>{confirmCopy.sentence.queued}</p>}

      {state.kind === 'pending' && (
        <>
          <p className={SENTENCE_CLASS}>
            {state.readingPhoto ? confirmCopy.sentence.pendingPhoto : confirmCopy.sentence.pending}
          </p>
          <div aria-hidden="true" className="flex flex-wrap gap-sm">
            <span className="hearth-skeleton h-[44px] w-[150px] max-w-full rounded-full" />
            <span className="hearth-skeleton h-[44px] w-[120px] max-w-full rounded-full" />
            <span className="hearth-skeleton h-[44px] w-[170px] max-w-full rounded-full" />
          </div>
        </>
      )}

      {read && entryId && (read.draft || read.printedText) && (
        <div className="flex flex-col gap-md">
          {read.draft && <ReadDraftRow entryId={entryId} draft={read.draft} onError={onReadError} />}
          {read.printedText && <WorkingFromChip entryId={entryId} onError={onReadError} />}
        </div>
      )}

      {state.kind === 'proposals' && (
        <>
          <div className="hearth-reveal flex flex-col gap-md">
            {groups.map((g) => (
              <div key={g.learnerId} className="flex flex-col gap-sm">
                <ProposalGroup
                  learnerName={g.learnerName}
                  colourToken={g.colourToken}
                  proposals={g.proposals}
                  confirmed={confirmed}
                  busy={busy}
                  onToggle={toggle}
                />
                {/* W4.4: a confirmed chip may carry its authored "watch for next". */}
                {g.proposals
                  .filter((p) => confirmed.has(p.key))
                  .map((p) => (
                    <WatchForNext key={p.key} learnerId={p.learnerId} dloId={p.dloId} threadName={p.threadName} />
                  ))}
              </div>
            ))}
          </div>
          <p className="font-sans text-[12px] text-text-muted">{confirmCopy.helper}</p>
          {pedagogySources.length > 0 && (
            <PedagogyAttribution sources={pedagogySources} frameworkTitle={frameworkTitle} />
          )}
        </>
      )}

      {state.kind === 'nothing' && (
        <p className={SENTENCE_CLASS}>
          {entryLearnerNames.length <= 1
            ? confirmCopy.sentence.nothingSingle
            : state.nobodyNamed
            ? confirmCopy.sentence.nobodyNamed(joinNames(entryLearnerNames))
            : confirmCopy.sentence.nothingMulti(joinNames(entryLearnerNames))}
        </p>
      )}

      {state.kind === 'failed' && (
        <>
          <p className={SENTENCE_CLASS}>{confirmCopy.sentence.failed}</p>
          <div className="flex flex-col gap-sm sm:flex-row">
            <Link href="/our-story/portfolio" className={GHOST_CLASS}>
              {confirmCopy.openPortfolio}
            </Link>
            {onRetryEnrichment && (
              <button type="button" onClick={onRetryEnrichment} className={GHOST_CLASS}>
                {confirmCopy.readAgain}
              </button>
            )}
          </div>
        </>
      )}

      {enrichedKind && attach && (
        <div>
          {attach.attachedTitle ? (
            <span className="inline-flex items-center gap-xs font-sans text-[13px] text-text-secondary">
              <Check size={14} weight="bold" aria-hidden="true" />
              {confirmCopy.attached(attach.attachedTitle)}
            </span>
          ) : (
            <button
              type="button"
              onClick={attach.onOpen}
              className="hearth-press inline-flex min-h-[44px] items-center font-sans text-[13px] text-text-secondary hover:text-text-primary"
            >
              {confirmCopy.attachLink}
            </button>
          )}
        </div>
      )}

      {enrichedKind && badgeReady && <BadgeReadyRow badge={badgeReady} />}

      <ConfirmExitRow onLogAnother={onLogAnother} />
    </div>
  );
}
