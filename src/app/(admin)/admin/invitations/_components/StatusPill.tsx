'use client';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-surface-raised text-text-secondary border-border-subtle',
  redeemed: 'bg-sage/10 text-sage border-sage/20',
  revoked: 'bg-surface-raised text-text-muted border-border-subtle',
  expired: 'bg-surface-raised text-text-muted border-border-subtle',
};

export default function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center rounded-[6px] border px-1.5 py-px font-sans text-[0.65rem] font-semibold uppercase tracking-wider ${style}`}>
      {status}
    </span>
  );
}
