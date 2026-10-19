'use client';

import { Check } from '@/components/icons';
import type { Proposal } from '@/lib/logger/proposals';
import { confirmCopy } from './confirmCopy';

export type ProposalChipProps = {
  proposal: Proposal;
  confirmed: boolean;
  busy: boolean;
  onToggle: (proposal: Proposal) => void;
};

const BASE =
  'hearth-press inline-flex min-h-[44px] items-center gap-xs rounded-full border px-md py-sm font-sans text-[13px] transition-[border-color,background-color] duration-[var(--motion-quick)] ease-[var(--ease-default)]';
const PROPOSED = 'border-border-subtle bg-surface-raised text-text-primary hover:border-border-medium';
const CONFIRMED = 'border-border-active bg-ember-glow text-text-primary';

export function ProposalChip({ proposal, confirmed, busy, onToggle }: ProposalChipProps) {
  return (
    <button
      type="button"
      aria-pressed={confirmed}
      aria-busy={busy || undefined}
      aria-label={confirmCopy.chipAria(proposal.learnerName, proposal.threadName, proposal.tier, confirmed)}
      onClick={() => onToggle(proposal)}
      className={`${BASE} ${confirmed ? CONFIRMED : PROPOSED}${busy ? ' opacity-60' : ''}`}
    >
      {confirmed && <Check size={14} weight="bold" aria-hidden="true" />}
      <span>{confirmCopy.chipLabel(proposal.threadName, proposal.tier, confirmed)}</span>
    </button>
  );
}
