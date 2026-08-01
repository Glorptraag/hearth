import Link from 'next/link';
import { ArrowRight, CalendarBlank } from '@/components/icons';

interface PlannerItem {
  id: string;
  title: string | null;
  status: string | null;
  moduleId: string | null;
}

interface PlannerStripProps {
  items: PlannerItem[];
}

export default function PlannerStrip({ items }: PlannerStripProps) {
  return (
    <div className="flex flex-col gap-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
          Today&rsquo;s Plan
        </h2>
        <Link
          href="/planner"
          className="hearth-link-arrow font-sans text-xs font-semibold text-ember transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:text-ember-hover"
        >
          View planner <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-sm rounded-[10px] border border-border-subtle bg-surface-panel px-md py-sm">
          <span className="inline-flex text-text-secondary" aria-hidden="true">
            <CalendarBlank size={18} />
          </span>
          <p className="font-sans text-sm text-text-muted">Nothing planned for today.</p>
          <Link
            href="/planner"
            className="ml-auto font-sans text-xs font-semibold text-ember transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:text-ember-hover"
          >
            Add
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-xs">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-sm rounded-[10px] border border-border-subtle bg-surface-panel px-md py-sm"
            >
              <span
                className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  item.status === 'completed'
                    ? 'bg-sage'
                    : item.status === 'in_progress'
                      ? 'bg-ember'
                      : 'bg-surface-hover border border-border-medium'
                }`}
              />
              <p
                className={`flex-1 font-sans text-sm ${
                  item.status === 'completed'
                    ? 'text-text-muted line-through'
                    : 'text-text-primary'
                }`}
              >
                {item.title ?? 'Untitled session'}
              </p>
              {item.status === 'completed' && (
                <span className="font-sans text-[11px] text-sage">Done</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
