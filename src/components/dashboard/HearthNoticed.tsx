import Link from 'next/link';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Sparkle, ArrowRight } from '@/components/icons';
import type { SnapshotInsight, SnapshotInsightKind } from '@/types/snapshot';

/**
 * A "Hearth noticed" item as the Dashboard receives it: the child it belongs
 * to plus the snapshot insight itself. Built server-side from each child's
 * `recent_insights` (page.tsx) so the client never sees the whole snapshot.
 */
export type NoticedItem = {
  learnerId: string;
  learnerName: string;
  insight: SnapshotInsight;
};

const KIND_LABEL: Record<SnapshotInsightKind, string> = {
  journey: 'Growth observation',
  notable: 'Noticed',
  milestone: 'Milestone',
  thread_lit: 'New thread',
  tier_shift: 'Tier shift',
};

const TRIGGER_LABEL: Record<NonNullable<SnapshotInsight['trigger']>, string> = {
  cross_domain: 'Connecting ideas',
  independence: 'Independence',
  metacognition: 'Thinking about thinking',
  transfer: 'Carrying learning across',
};

export function relativeDay(dateStr: string, now: Date = new Date()): string {
  // Calendar-day difference: a yyyy-MM-dd is a local day, not an instant, so
  // a millisecond subtraction would read "yesterday" for this morning.
  const days = differenceInCalendarDays(now, parseISO(dateStr));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}

/**
 * Flatten every child's feed into one dashboard list, newest first.
 * Pure; exported so the server page and tests share one ordering rule.
 */
export function collectNoticed(
  children: Array<{ id: string; name: string; insights: SnapshotInsight[] | undefined }>,
  limit = 3,
): NoticedItem[] {
  const all: NoticedItem[] = [];
  for (const child of children) {
    for (const insight of child.insights ?? []) {
      all.push({ learnerId: child.id, learnerName: child.name, insight });
    }
  }
  all.sort((a, b) => b.insight.date.localeCompare(a.insight.date) || a.insight.id.localeCompare(b.insight.id));
  return all.slice(0, limit);
}

export default function HearthNoticed({ items, basePath = '' }: { items: NoticedItem[]; basePath?: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="hearth-noticed-heading" className="animate-in delay-3 mb-3xl">
      <div className="mb-lg flex items-center justify-between">
        <h2 id="hearth-noticed-heading" className="inline-flex items-center gap-sm font-serif text-[1.1rem] font-semibold text-text-primary">
          <span className="text-ember" aria-hidden="true"><Sparkle size={18} /></span>
          Hearth noticed
        </h2>
        <Link
          href={`${basePath}/our-story/portfolio`}
          className="hearth-link-arrow font-sans text-[0.8rem] font-medium text-ember transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:text-ember-hover"
        >
          See the story <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <ul className="flex flex-col gap-md">
        {items.map(({ learnerId, learnerName, insight }) => {
          const caption = insight.kind === 'journey' && insight.trigger
            ? TRIGGER_LABEL[insight.trigger]
            : KIND_LABEL[insight.kind];
          const href = insight.thread_id
            ? `${basePath}/our-story/capabilities?view=table&d=3&focus=${encodeURIComponent(insight.thread_id)}`
            : `${basePath}/our-story/learner/${learnerId}`;
          return (
            <li
              key={`${learnerId}:${insight.id}`}
              className="rounded-lg border border-border-subtle bg-surface-panel p-lg transition-[border-color] duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:border-border-medium"
            >
              <div className="mb-xs flex flex-wrap items-center gap-sm font-sans text-[0.7rem] uppercase tracking-[0.08em] text-text-muted">
                <span className="font-semibold text-text-secondary">{learnerName.split(' ')[0]}</span>
                <span aria-hidden="true">·</span>
                <span>{caption}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={insight.date}>{relativeDay(insight.date)}</time>
              </div>
              <p className="font-serif text-[0.95rem] leading-[1.6] text-text-primary">{insight.text}</p>
              <Link
                href={href}
                className="mt-sm inline-flex items-center gap-xs font-sans text-[0.8rem] font-medium text-text-secondary transition-colors duration-[var(--motion-quick)] hover:text-ember"
              >
                {insight.thread_id ? 'Open the thread' : `Open ${learnerName.split(' ')[0]}’s page`}
                <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
