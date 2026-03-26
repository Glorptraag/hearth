import { formatDistanceToNow } from 'date-fns';

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

  return (
    <div className="flex flex-col gap-xs rounded-[10px] border border-border-subtle bg-surface-panel p-sm text-center transition-all duration-[400ms] hover:border-border-medium hover:bg-surface-raised">
      <span className="text-2xl">{badge.badgeEmoji ?? '🏅'}</span>
      <p className="font-serif text-sm font-semibold leading-tight text-text-primary">
        {badge.badgeTitle}
      </p>
      {timeLabel && (
        <p className="font-sans text-[10px] text-text-muted">{timeLabel}</p>
      )}
    </div>
  );
}
