import { formatDistanceToNow } from 'date-fns';
import { Medal } from '@/components/icons';

interface BadgeChipProps {
  badge: {
    badgeTitle: string;
    badgeEmoji: string | null;
    awardedAt: Date | null;
    notes: string | null;
  };
}

export default function BadgeChip({ badge }: BadgeChipProps) {
  const timeLabel = badge.awardedAt
    ? formatDistanceToNow(new Date(badge.awardedAt), { addSuffix: true })
    : null;

  // badgeEmoji is data-driven content (e.g. illustrator-bespoke emoji per badge);
  // when present we render it directly. When absent we fall back to a Phosphor Medal.
  const badgeEmoji = badge.badgeEmoji;

  return (
    <div className="flex flex-col items-center gap-xs rounded-[10px] border border-border-subtle bg-surface-panel p-sm text-center transition duration-[var(--motion-gentle)] hover:border-border-medium hover:bg-surface-raised">
      {badgeEmoji ? (
        <span className="text-2xl" aria-hidden="true">{badgeEmoji}</span>
      ) : (
        <span className="inline-flex text-ember" aria-hidden="true">
          <Medal size={22} />
        </span>
      )}
      <p className="font-serif text-sm font-semibold leading-tight text-text-primary">
        {badge.badgeTitle}
      </p>
      {timeLabel && (
        <p className="font-sans text-[10px] text-text-muted">{timeLabel}</p>
      )}
    </div>
  );
}
