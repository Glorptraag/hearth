'use client';

import { useCallback, useRef, useState } from 'react';
import type { Proposal } from '@/lib/logger/proposals';
import { confirmProposal, type ProposalDecision } from '@/lib/logger/confirm-client';
import { track } from '@/lib/analytics/posthog';

export type UseProposalConfirmOptions = {
  fetchImpl?: typeof fetch;
  /** Called after a failed request has been reverted. */
  onError?: (proposal: Proposal) => void;
};

export type UseProposalConfirmReturn = {
  confirmed: ReadonlySet<string>;
  busy: ReadonlySet<string>;
  /** First tap confirms, second tap clears. Taps while a request is in flight are ignored. */
  toggle: (proposal: Proposal) => Promise<void>;
};

export function confidenceBucket(confidence: number): 'low' | 'mid' | 'high' {
  if (confidence < 0.5) return 'low';
  if (confidence < 0.75) return 'mid';
  return 'high';
}

function withKey(set: ReadonlySet<string>, key: string, present: boolean): Set<string> {
  const next = new Set(set);
  if (present) next.add(key);
  else next.delete(key);
  return next;
}

/**
 * Optimistic confirm/clear for the Confirm surface's proposal chips. One
 * in-flight request per chip key; a failure reverts the optimistic state and
 * reports the proposal through `onError` so the surface can toast.
 */
export function useProposalConfirm(opts: UseProposalConfirmOptions = {}): UseProposalConfirmReturn {
  const { fetchImpl, onError } = opts;
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(() => new Set());
  const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set());
  // Mirrors `confirmed` synchronously so back-to-back taps read the latest state.
  const confirmedRef = useRef<ReadonlySet<string>>(confirmed);
  const busyRef = useRef<ReadonlySet<string>>(busy);

  const toggle = useCallback(
    async (proposal: Proposal) => {
      const { key } = proposal;
      if (busyRef.current.has(key)) return;

      const wasConfirmed = confirmedRef.current.has(key);
      const action: ProposalDecision = wasConfirmed ? 'dispute' : 'confirm';

      busyRef.current = withKey(busyRef.current, key, true);
      setBusy(busyRef.current);
      confirmedRef.current = withKey(confirmedRef.current, key, !wasConfirmed);
      setConfirmed(confirmedRef.current);

      try {
        await confirmProposal(proposal, action, fetchImpl);
        track(action === 'confirm' ? 'logger_proposal_confirmed' : 'logger_proposal_cleared', {
          thread_id: proposal.threadId,
          tier: proposal.tier,
          confidence_bucket: confidenceBucket(proposal.confidence),
        });
      } catch {
        confirmedRef.current = withKey(confirmedRef.current, key, wasConfirmed);
        setConfirmed(confirmedRef.current);
        onError?.(proposal);
      } finally {
        busyRef.current = withKey(busyRef.current, key, false);
        setBusy(busyRef.current);
      }
    },
    [fetchImpl, onError],
  );

  return { confirmed, busy, toggle };
}
