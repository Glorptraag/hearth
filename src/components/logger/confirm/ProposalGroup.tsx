'use client';

import { useId } from 'react';
import { LEARNER_COLOUR_MAP } from '@/components/ui/LearnerAvatar';
import type { Proposal } from '@/lib/logger/proposals';
import { ProposalChip } from './ProposalChip';

export type ProposalGroupProps = {
  learnerName: string;
  colourToken: string | null;
  proposals: Proposal[];
  confirmed: ReadonlySet<string>;
  busy: ReadonlySet<string>;
  onToggle: (proposal: Proposal) => void;
};

export function ProposalGroup({
  learnerName,
  colourToken,
  proposals,
  confirmed,
  busy,
  onToggle,
}: ProposalGroupProps) {
  const headingId = useId();
  const colour = LEARNER_COLOUR_MAP[colourToken ?? ''] ?? LEARNER_COLOUR_MAP.rose;

  return (
    <div role="group" aria-labelledby={headingId} className="flex flex-col gap-sm">
      <div id={headingId} className="flex items-center gap-sm">
        <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${colour.dot}`} />
        <span className="font-sans text-[13px] font-medium text-text-secondary">{learnerName}</span>
      </div>
      <div className="flex flex-wrap gap-sm">
        {proposals.map((p) => (
          <ProposalChip
            key={p.key}
            proposal={p}
            confirmed={confirmed.has(p.key)}
            busy={busy.has(p.key)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
