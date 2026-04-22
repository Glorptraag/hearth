'use client';

const STYLES: Record<string, string> = {
  planned: 'bg-surface-raised text-text-muted border-border-subtle',
  briefed: 'bg-surface-raised text-text-secondary border-border-subtle',
  created: 'bg-ember-glow text-ember border-ember/20',
  reviewed: 'bg-sage/10 text-sage border-sage/20',
  active: 'bg-sage/20 text-sage border-sage/30',
  archived: 'bg-surface-raised text-text-muted/60 border-border-subtle',
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES.planned;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[6px] border text-[0.65rem] font-sans font-semibold uppercase tracking-wider ${style}`}
    >
      {status}
    </span>
  );
}
