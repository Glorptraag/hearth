'use client';

import { useEffect, useState } from 'react';
import { clientSanityRead } from '@/lib/sanity/client-read';

interface SourceExcerpt {
  text: string;
  isParaphrase: boolean;
  sourceAttribution: {
    author?: string;
    title?: string;
    year?: string;
    pageOrChapter?: string;
  };
  tags?: string[];
}

interface PedagogyLearnMoreProps {
  pedagogyKey: string;
}

const PRIORITY_TAGS = ['settings_reading_path', 'first_principles_reference'];

const FRAMEWORK_LABELS: Record<string, string> = {
  charlotte_mason: 'Charlotte Mason',
  classical: 'Classical',
  montessori: 'Montessori',
  waldorf_steiner: 'Waldorf / Steiner',
  unschooling: 'Unschooling',
  eclectic: 'Eclectic',
};

export function PedagogyLearnMore({ pedagogyKey }: PedagogyLearnMoreProps) {
  const [excerpts, setExcerpts] = useState<SourceExcerpt[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Reset stale state whenever the pedagogy changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExcerpts([]);
    setLoaded(false);
    if (!pedagogyKey) {
      setLoaded(true);
      return;
    }

    async function fetchExcerpts() {
      try {
        // pedagogicalFramework / pedagogySourceExcerpt use dotted ids (dark to
        // the tokenless browser client) — read through the authed proxy.
        const framework = await clientSanityRead<{ _id: string }>('frameworkByPedagogyKey', { pedagogyKey });
        if (cancelled) return;
        if (!framework) {
          setExcerpts([]);
          return;
        }

        const results = await clientSanityRead<SourceExcerpt[]>('pedagogySourceExcerpts', { frameworkId: framework._id });
        if (cancelled) return;

        if (!results || results.length === 0) {
          setExcerpts([]);
          return;
        }

        // Sort: priority-tagged excerpts first, then rest by position
        const priority = results.filter((e) =>
          e.tags?.some((t) => PRIORITY_TAGS.includes(t))
        );
        const rest = results.filter(
          (e) => !e.tags?.some((t) => PRIORITY_TAGS.includes(t))
        );
        const sorted = [...priority, ...rest].slice(0, 5);

        setExcerpts(sorted);
      } catch {
        if (!cancelled) setExcerpts([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchExcerpts();
    return () => {
      cancelled = true;
    };
  }, [pedagogyKey]);

  // Don't render until fetch completes; render nothing if no excerpts
  if (!loaded || excerpts.length === 0) return null;

  const frameworkLabel = FRAMEWORK_LABELS[pedagogyKey] ?? pedagogyKey;

  return (
    <div className="mt-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-[6px] border border-border-subtle bg-surface-raised px-md py-sm font-sans text-sm text-text-secondary transition-all duration-200 ease-[var(--ease-default)] hover:border-border-medium hover:text-text-primary"
      >
        <span className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
          Explore {frameworkLabel}
        </span>
        <span className="font-sans text-xs text-text-muted" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="mt-md flex flex-col gap-md">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Reading Path
          </p>
          {excerpts.map((excerpt, i) => (
            <div
              key={i}
              className="bg-surface-panel rounded-lg p-lg border border-border-subtle shadow-card"
            >
              <p className="font-serif text-sm text-text-secondary italic leading-relaxed">
                &ldquo;{excerpt.text}&rdquo;
              </p>
              {excerpt.sourceAttribution && (
                <p className="mt-2 font-sans text-xs text-text-muted">
                  {[
                    excerpt.sourceAttribution.author,
                    excerpt.sourceAttribution.title,
                    excerpt.sourceAttribution.pageOrChapter,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  {excerpt.sourceAttribution.year
                    ? ` (${excerpt.sourceAttribution.year})`
                    : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
