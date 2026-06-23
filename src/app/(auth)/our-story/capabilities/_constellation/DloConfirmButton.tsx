'use client';

import { Check } from '@/components/icons';

/**
 * Parent-facing confirm control for a single DLO. "Yes, I've seen this" writes
 * an `asserted` link (the corroboration the demonstrating bar needs); tapping a
 * confirmed control again clears the parent's assertion. Presentational only —
 * confirmed/pending state and the toggle handler are owned by ConstellationRoute
 * so optimistic state survives drill/depth changes within a session.
 */
export function DloConfirmButton({
  confirmed,
  pending,
  onToggle,
  descriptor,
}: {
  confirmed: boolean;
  pending: boolean;
  onToggle: () => void;
  descriptor: string;
}) {
  const label = confirmed
    ? `You confirmed "${descriptor}". Tap to clear.`
    : `Confirm you've seen "${descriptor}"`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!pending) onToggle();
      }}
      disabled={pending}
      aria-pressed={confirmed}
      aria-label={label}
      className={`inline-flex shrink-0 items-center gap-[6px] rounded-full px-md py-xs font-sans text-[0.75rem] font-medium transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] disabled:opacity-60 ${
        confirmed
          ? 'bg-sage-muted text-sage-text border border-sage/30 hover:bg-sage/15'
          : 'bg-transparent text-text-secondary border border-border-subtle hover:border-border-medium hover:text-text-primary'
      }`}
    >
      {confirmed ? (
        <>
          <Check size={14} weight="bold" aria-hidden />
          {pending ? 'Saving…' : 'Confirmed'}
        </>
      ) : (
        pending ? 'Saving…' : 'Confirm I’ve seen this'
      )}
    </button>
  );
}
