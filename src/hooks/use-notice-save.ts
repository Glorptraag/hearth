'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';
import { hashForAnalytics, track } from '@/lib/analytics/posthog';
import { buildEntrySavePayload } from '@/lib/logger/entry-payload';
import { buildBadgeReadyToast, checkBadgeThresholds, type BadgeReadyToast } from '@/lib/logger/badge-check';
import type { ConfirmBase, ConfirmState } from '@/lib/logger/confirm-state';
import { pollEntryEnrichment } from '@/lib/logger/enrichment-poll';
import { saveBlock, whenKindFor, type NoticeFields } from '@/lib/logger/notice';
import { queueEntry } from '@/lib/logger/outbox';
import { deriveProposals, isEnriched, nobodyNamed, type ProposalLearner } from '@/lib/logger/proposals';
import type { NoticeSource } from '@/lib/logger/source';
import type { AiEnrichment } from '@/types/enrichment';
import { noticeCopy } from '@/app/(auth)/log/_components/noticeCopy';
import { confirmCopy } from '@/components/logger/confirm/confirmCopy';

const COMPOSE_MS_CAP = 4 * 60 * 60 * 1000;

export type UseNoticeSaveArgs = {
  source: NoticeSource;
  learners: LearnerRecord[];
  clearDraft: () => void;
  resetForm: () => void;
  toast: (message: string, type?: 'info' | 'error') => void;
  analytics?: {
    resumedFromDraft: boolean;
    draftSavedAt: number | null;
    composeStartedAt: () => number | null;
  };
};

export type UseNoticeSaveReturn = {
  state: ConfirmState | null;
  isSaving: boolean;
  save: (fields: NoticeFields) => Promise<void>;
  retryEnrichment: () => Promise<void>;
  badgeReady: BadgeReadyToast | null;
  logAnother: () => void;
};

/** The saved children, in selection order, as the proposal deriver wants them. */
function entryLearnersFor(learnerIds: readonly string[], learners: LearnerRecord[]): ProposalLearner[] {
  const byId = new Map(learners.map((l) => [l.id, l]));
  const out: ProposalLearner[] = [];
  for (const id of learnerIds) {
    const l = byId.get(id);
    if (l) out.push({ id: l.id, name: l.name, colourToken: l.colourToken });
  }
  return out;
}

function baseOf(prev: Exclude<ConfirmState, { kind: 'queued' }>): ConfirmBase {
  return {
    entryId: prev.entryId,
    savedAtMs: prev.savedAtMs,
    learnerIds: prev.learnerIds,
    evidenceCount: prev.evidenceCount,
    source: prev.source,
  };
}

/** Map a fetched enrichment onto the pending surface. Returns `prev` to keep waiting. */
function resolveEnrichment(
  prev: Exclude<ConfirmState, { kind: 'queued' }>,
  enrichment: AiEnrichment,
  entryLearners: ProposalLearner[],
): ConfirmState {
  if (enrichment.status === 'pending') return prev;
  const base = baseOf(prev);
  if (isEnriched(enrichment)) {
    const preferThreadId = prev.source.kind === 'check_in' ? prev.source.threadId : null;
    const proposals = deriveProposals(enrichment, entryLearners, { preferThreadId });
    return proposals.length > 0
      ? { ...base, kind: 'proposals', enrichment, proposals }
      : { ...base, kind: 'nothing', enrichment, nobodyNamed: nobodyNamed(enrichment, entryLearners) };
  }
  if (enrichment.status === 'failed') return { ...base, kind: 'failed' };
  return prev;
}

/**
 * Save a Notice and own the Confirm surface's state afterwards.
 *
 * POST /api/entries → `pending` → poll the enrichment (≤30 s, guarded so a
 * newer entry invalidates an older poll) → `proposals` | `nothing` | `failed`.
 * Offline → the outbox → `queued`. The badge-threshold check runs alongside
 * the poll and never throws. Every parent-facing string comes from
 * `noticeCopy` / `confirmCopy`.
 */
export function useNoticeSave(args: UseNoticeSaveArgs): UseNoticeSaveReturn {
  const { source, learners, clearDraft, resetForm, toast, analytics } = args;

  const [state, setState] = useState<ConfirmState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [badgeReady, setBadgeReady] = useState<BadgeReadyToast | null>(null);

  /** The entry whose poll is live; the poll bails when this moves on. */
  const activeEntryIdRef = useRef<string | null>(null);
  /** The entry the surface is showing; a late badge result for another entry is dropped. */
  const surfaceEntryIdRef = useRef<string | null>(null);
  const savingRef = useRef(false);

  useEffect(
    () => () => {
      activeEntryIdRef.current = null;
      surfaceEntryIdRef.current = null;
    },
    [],
  );

  const runPoll = useCallback((entryId: string, entryLearners: ProposalLearner[]) => {
    activeEntryIdRef.current = entryId;
    return pollEntryEnrichment(entryId, {
      isCurrent: () => activeEntryIdRef.current === entryId,
      clearCurrent: () => {
        activeEntryIdRef.current = null;
      },
      onEnrichment: (enrichment) => {
        setState((prev) =>
          prev && prev.kind === 'pending' && prev.entryId === entryId
            ? resolveEnrichment(prev, enrichment, entryLearners)
            : prev,
        );
      },
      // No terminal status inside the budget. Spec: never a spinner that hangs.
      onTimeout: () => {
        setState((prev) =>
          prev && prev.kind === 'pending' && prev.entryId === entryId
            ? { ...baseOf(prev), kind: 'failed' }
            : prev,
        );
      },
    });
  }, []);

  const runBadgeCheck = useCallback(
    async (entryId: string, learnerIds: string[]) => {
      try {
        const ready = await checkBadgeThresholds(learnerIds);
        const badgeToast = buildBadgeReadyToast(ready, new Map(learners.map((l) => [l.id, l.name])));
        if (badgeToast && surfaceEntryIdRef.current === entryId) setBadgeReady(badgeToast);
      } catch {
        // badge check is non-critical
      }
    },
    [learners],
  );

  const save = useCallback(
    async (fields: NoticeFields) => {
      if (saveBlock(fields) !== null || savingRef.current) return;
      savingRef.current = true;
      setIsSaving(true);

      const payload = buildEntrySavePayload({ fields, source });

      try {
        let res: Response;
        try {
          res = await fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch {
          // The 10 s autosave has already written the draft, so the moment is
          // not lost — just unposted. Offline → queue it for replay.
          const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
          if (!offline) {
            toast(noticeCopy.saveFailed, 'error');
            return;
          }
          const queuedId = await queueEntry(payload);
          if (!queuedId) {
            toast(noticeCopy.couldNotQueue, 'error');
            return;
          }
          surfaceEntryIdRef.current = null;
          setState({ kind: 'queued', learnerIds: [...fields.learnerIds] });
          clearDraft();
          resetForm();
          toast(noticeCopy.savedOffline);
          return;
        }

        if (!res.ok) {
          if (res.status === 403) toast(noticeCopy.forbidden, 'error');
          else if (res.status === 429) toast(noticeCopy.rateLimited, 'error');
          else toast(noticeCopy.saveFailed, 'error');
          return;
        }

        const body = (await res.json().catch(() => ({}))) as { id?: string };
        const entryId = typeof body?.id === 'string' ? body.id : null;
        const savedAtMs = Date.now();
        const learnerIds = [...fields.learnerIds];
        const whenKind = whenKindFor(fields.dateOccurred, new Date(savedAtMs));

        // Read before resetForm() — reset clears the compose-start marker.
        const composeStart = analytics?.composeStartedAt() ?? null;
        const rawComposeMs = composeStart !== null ? savedAtMs - composeStart : null;
        const composeMs =
          rawComposeMs !== null ? Math.round(Math.min(rawComposeMs, COMPOSE_MS_CAP) / 1000) * 1000 : null;
        const resumedFromDraft = analytics?.resumedFromDraft ?? false;
        const draftSavedAt = analytics?.draftSavedAt ?? null;

        if (entryId) {
          surfaceEntryIdRef.current = entryId;
          setState({
            kind: 'pending',
            entryId,
            savedAtMs,
            learnerIds,
            evidenceCount: payload.evidence.length,
            source,
          });
        }
        clearDraft();
        resetForm();

        const entryIdHash = entryId ? await hashForAnalytics(entryId).catch(() => null) : null;
        const props: Record<string, string | number | boolean> = {
          source_kind: source.kind,
          learner_count: learnerIds.length,
          has_evidence: payload.evidence.length > 0,
          has_felt: Object.keys(payload.engagementPerLearner).length > 0,
          has_noticed: Object.keys(payload.discoveriesPerLearner).length > 0,
          when_kind: whenKind,
          resumed_from_draft: resumedFromDraft,
        };
        if (composeMs !== null) props.compose_ms = composeMs;
        if (resumedFromDraft && draftSavedAt !== null) props.draft_age_ms = Math.round(savedAtMs - draftSavedAt);
        if (entryIdHash) props.entry_id = entryIdHash;
        track('entry_created', props);

        if (!entryId) return;

        // Poll and badge check run side by side; neither rejects.
        void runPoll(entryId, entryLearnersFor(learnerIds, learners));
        void runBadgeCheck(entryId, learnerIds);
      } finally {
        savingRef.current = false;
        setIsSaving(false);
      }
    },
    [source, learners, clearDraft, resetForm, toast, analytics, runPoll, runBadgeCheck],
  );

  const retryEnrichment = useCallback(async () => {
    if (!state || state.kind !== 'failed') return;
    const { entryId } = state;
    let ok = false;
    try {
      const res = await fetch(`/api/entries/${encodeURIComponent(entryId)}/enrich`, { method: 'POST' });
      ok = res.ok;
    } catch {
      ok = false;
    }
    if (!ok) {
      toast(confirmCopy.retryFailed, 'error');
      return;
    }
    setState((prev) =>
      prev && prev.kind === 'failed' && prev.entryId === entryId ? { ...baseOf(prev), kind: 'pending' } : prev,
    );
    void runPoll(entryId, entryLearnersFor(state.learnerIds, learners));
  }, [state, learners, toast, runPoll]);

  const logAnother = useCallback(() => {
    activeEntryIdRef.current = null;
    surfaceEntryIdRef.current = null;
    setState(null);
    setBadgeReady(null);
  }, []);

  return { state, isSaving, save, retryEnrichment, badgeReady, logAnother };
}
