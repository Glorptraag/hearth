'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowRight, Eye } from '@/components/icons';
import { LEARNER_COLOUR_MAP } from '@/components/ui/LearnerAvatar';
import { track } from '@/lib/analytics/posthog';
import type { EverydayWatchFor } from '@/lib/watch/everyday';

export const watchForCopy = {
  heading: 'Watch for',
  sub: 'One thing for each child, in everyday play.',
  logIt: 'Log it',
  logItAria: (name: string, thread: string) => `Log a moment for ${name} in ${thread}`,
} as const;

/**
 * "Watch for" on the Dashboard (pivot W5.3, HC-1c; D-HC-4). One card per child:
 * the look-for (the DLO's confirmed `watchForNext`) and the tradition's how line,
 * composed server-side by `src/lib/watch/everyday.ts` — zero model calls. With
 * no confirmed watch-for for any child the section renders nothing.
 */
export default function WatchForCards({ items, basePath = '' }: { items: EverydayWatchFor[]; basePath?: string }) {
  const viewedKey = items.map((i) => `${i.learnerId}:${i.dloId}`).join('|');
  useEffect(() => {
    if (!viewedKey) return;
    for (const item of items) {
      track('watch_for_viewed', { scope: 'everyday', surface: 'dashboard', tier: item.tier });
    }
    // Fire once per distinct set of watch-fors, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedKey]);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="watch-for-heading" className="animate-in delay-3 mb-3xl">
      <div className="mb-lg">
        <h2
          id="watch-for-heading"
          className="inline-flex items-center gap-sm font-serif text-[1.1rem] font-semibold text-text-primary"
        >
          <span className="text-text-secondary" aria-hidden="true"><Eye size={18} /></span>
          {watchForCopy.heading}
        </h2>
        <p className="mt-xs font-sans text-[0.8rem] text-text-muted">{watchForCopy.sub}</p>
      </div>
      <ul className="grid grid-cols-1 gap-md md:grid-cols-2">
        {items.map((item) => {
          const colour = LEARNER_COLOUR_MAP[item.colourToken ?? ''] ?? LEARNER_COLOUR_MAP.rose;
          const firstName = item.learnerName.trim().split(/\s+/)[0] || item.learnerName;
          return (
            <li
              key={item.learnerId}
              className="flex min-w-0 flex-col gap-sm rounded-lg border border-border-subtle bg-surface-panel p-lg transition-[border-color] duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:border-border-medium"
            >
              <div className="flex flex-wrap items-center gap-sm font-sans text-[0.7rem] uppercase tracking-[0.08em] text-text-muted">
                <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${colour.dot}`} />
                <span className="font-semibold text-text-secondary">{firstName}</span>
                <span aria-hidden="true">·</span>
                <span>{item.threadName}</span>
              </div>
              <p className="body-serif text-[1rem] leading-relaxed text-text-primary">{item.lookFor}</p>
              {item.how && (
                <p className="body-serif text-[0.95rem] leading-relaxed text-text-secondary">{item.how}</p>
              )}
              {item.siblingLines.length > 0 && (
                <ul className="flex flex-col gap-xs">
                  {item.siblingLines.map((line) => (
                    <li key={line} className="body-serif text-[0.9rem] leading-relaxed text-text-muted">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href={`${basePath}${item.logHref}`}
                aria-label={watchForCopy.logItAria(firstName, item.threadName)}
                className="hearth-press hearth-link-arrow mt-xs inline-flex min-h-[44px] items-center gap-xs self-start font-sans text-[0.85rem] font-medium text-ember hover:text-ember-hover"
              >
                {watchForCopy.logIt} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
