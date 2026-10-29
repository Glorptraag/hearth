'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { ArrowRight } from '@/components/icons';
import { ProposalGroup } from '@/components/logger/confirm/ProposalGroup';
import { confirmCopy } from '@/components/logger/confirm/confirmCopy';
import { useProposalConfirm } from '@/hooks/use-proposal-confirm';
import type { ChipsToConfirmEntry } from '@/lib/dashboard/chips-to-confirm';
import type { Proposal } from '@/lib/logger/proposals';
import { relativeDay } from './HearthNoticed';

export const chipsCopy = {
  heading: 'To confirm',
  sub: 'From recent moments. Tap one if it rings true. Tap again to undo.',
  open: 'Open in Portfolio',
} as const;

function groupByLearner(proposals: Proposal[]): Proposal[][] {
  const groups = new Map<string, Proposal[]>();
  for (const p of proposals) {
    const g = groups.get(p.learnerId);
    if (g) g.push(p);
    else groups.set(p.learnerId, [p]);
  }
  return [...groups.values()];
}

/**
 * "To confirm" on the Dashboard (pivot W5.3): chips proposed on recent moments
 * that the parent hasn't confirmed. The same chips and the same confirm seam
 * as the Confirm surface (`useProposalConfirm` → `confirmProposal`), so a tap
 * here writes exactly what a tap there would. Renders nothing when there is
 * nothing to confirm.
 */
export default function ChipsToConfirm({
  entries,
  basePath = '',
  fetchImpl,
}: {
  entries: ChipsToConfirmEntry[];
  basePath?: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}) {
  const [error, setError] = useState(false);
  const onError = useCallback(() => setError(true), []);
  const { confirmed, busy, toggle } = useProposalConfirm({ fetchImpl, onError });
  const onToggle = useCallback(
    (p: Proposal) => {
      setError(false);
      void toggle(p);
    },
    [toggle],
  );

  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="chips-to-confirm-heading" className="animate-in delay-3 mb-3xl">
      <div className="mb-lg">
        <h2 id="chips-to-confirm-heading" className="font-serif text-[1.1rem] font-semibold text-text-primary">
          {chipsCopy.heading}
        </h2>
        <p className="mt-xs font-sans text-[0.8rem] text-text-muted">{chipsCopy.sub}</p>
      </div>
      <ul className="flex flex-col gap-md">
        {entries.map((entry) => (
          <li key={entry.entryId} className="flex min-w-0 flex-col gap-md rounded-lg border border-border-subtle bg-surface-panel p-lg">
            <div className="flex flex-wrap items-baseline justify-between gap-sm">
              <h3 className="min-w-0 font-serif text-[1rem] font-semibold text-text-primary">{entry.title}</h3>
              <time dateTime={entry.dateOccurred} className="font-sans text-[0.75rem] text-text-muted">
                {relativeDay(entry.dateOccurred)}
              </time>
            </div>
            {groupByLearner(entry.proposals).map((group) => (
              <ProposalGroup
                key={group[0].learnerId}
                learnerName={group[0].learnerName}
                colourToken={group[0].colourToken}
                proposals={group}
                confirmed={confirmed}
                busy={busy}
                onToggle={onToggle}
              />
            ))}
            <Link
              href={`${basePath}/our-story/portfolio#entry-${entry.entryId}`}
              className="hearth-link-arrow inline-flex items-center gap-xs self-start font-sans text-[0.8rem] font-medium text-text-secondary transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:text-ember"
            >
              {chipsCopy.open} <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <p role="status" className="mt-sm font-sans text-[0.8rem] text-text-secondary">
        {error ? confirmCopy.chipError : ''}
      </p>
    </section>
  );
}
