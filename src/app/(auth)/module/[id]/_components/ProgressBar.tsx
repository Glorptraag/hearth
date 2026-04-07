'use client';

import type { Activity } from './types';

export default function ProgressBar({
  activities,
  currentIdx,
}: {
  activities: Activity[];
  currentIdx: number;
}) {
  const current = activities[currentIdx];
  const durationLabel = current?.duration
    ? `${current.duration.min}\u2013${current.duration.max} min`
    : '';

  return (
    <div className="mb-xl">
      <div className="flex gap-[3px] h-[6px] rounded-full overflow-hidden">
        {activities.map((_, i) => (
          <div
            key={i}
            className={`flex-1 transition-colors duration-200 ${
              i < currentIdx
                ? 'bg-sage'
                : i === currentIdx
                ? 'bg-ember'
                : 'bg-surface-raised'
            }`}
          />
        ))}
      </div>
      <p className="font-sans text-xs text-text-muted mt-sm">
        Activity {currentIdx + 1} of {activities.length}
        {durationLabel && <span> &middot; {durationLabel}</span>}
      </p>
    </div>
  );
}
