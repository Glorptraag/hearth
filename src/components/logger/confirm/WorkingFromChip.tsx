'use client';

import { useEffect, useId, useState } from 'react';
import { BookOpen, Check } from '@/components/icons';
import { workingFromLabel, type WorkingFrom } from '@/lib/logger/read-draft';
import { confirmCopy } from './confirmCopy';

type ShelfOption = { id: string; title: string; kind: string; levels: string[] };
type Suggestion = { resourceId: string; title: string; level?: string; lesson?: string };
type Loaded = { suggestion: Suggestion | null; resources: ShelfOption[]; current: WorkingFrom | null };

export type WorkingFromChipProps = {
  entryId: string;
  onError: (message: string) => void;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
};

const SMALL_GHOST =
  'hearth-press inline-flex min-h-[44px] items-center justify-center rounded-md border border-border-subtle bg-transparent px-md font-sans text-[13px] font-semibold text-text-secondary hover:border-border-medium hover:text-text-primary disabled:opacity-60';
const SMALL_PRIMARY =
  'hearth-press inline-flex min-h-[44px] items-center justify-center rounded-md bg-ember px-md font-sans text-[13px] font-semibold text-text-inverse hover:bg-ember-hover disabled:opacity-60';
const FIELD =
  'min-h-[44px] w-full rounded-md border border-border-subtle bg-surface-panel px-sm font-sans text-sm text-text-primary focus:border-border-focus focus:outline-none';

function labelFor(wf: { resourceId: string; level?: string; lesson?: string }, resources: ShelfOption[], fallbackTitle?: string) {
  const title = resources.find((r) => r.id === wf.resourceId)?.title ?? fallbackTitle ?? '';
  return title ? workingFromLabel(title, wf.level, wf.lesson) : '';
}

/**
 * "Working from: Math-U-See Alpha · Lesson 12?" (W3.3; W2.4, D-LP-6). The
 * suggestion is the server's deterministic Shelf match on the photo's printed
 * header — never a model guess. Yes writes it with `source: 'read'`; Change
 * lets the parent pick from the Shelf (`source: 'parent'`); No writes nothing.
 * `learning_entries.working_from` is written only on the parent's confirm.
 */
export function WorkingFromChip({ entryId, onError, fetchImpl = fetch }: WorkingFromChipProps) {
  const [data, setData] = useState<Loaded | null>(null);
  const [mode, setMode] = useState<'offer' | 'change' | 'dismissed'>('offer');
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState<{ resourceId: string; level: string; lesson: string }>({
    resourceId: '',
    level: '',
    lesson: '',
  });
  const ids = { legend: useId(), resource: useId(), level: useId(), lesson: useId() };
  const c = confirmCopy.workingFrom;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchImpl(`/api/entries/${encodeURIComponent(entryId)}/working-from`);
        if (!res.ok) return;
        const body = (await res.json()) as Loaded;
        if (!cancelled) setData(body);
      } catch {
        // No chip is better than a broken one.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entryId, fetchImpl]);

  if (!data || mode === 'dismissed') return null;
  const { suggestion, resources, current } = data;

  async function save(next: WorkingFrom) {
    setBusy(true);
    try {
      const res = await fetchImpl(`/api/entries/${encodeURIComponent(entryId)}/working-from`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workingFrom: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { workingFrom: WorkingFrom | null };
      setData((d) => (d ? { ...d, current: body.workingFrom } : d));
      setMode('offer');
    } catch {
      onError(c.error);
    } finally {
      setBusy(false);
    }
  }

  if (current) {
    const label = labelFor(current, resources);
    if (!label) return null;
    return (
      <p role="status" className="inline-flex items-center gap-xs font-sans text-[13px] text-text-secondary">
        <Check size={14} weight="bold" aria-hidden="true" />
        {c.confirmed(label)}
      </p>
    );
  }

  if (!suggestion) return null;

  if (mode === 'change') {
    const chosen = resources.find((r) => r.id === pick.resourceId);
    return (
      <form
        aria-labelledby={ids.legend}
        className="hearth-reveal flex flex-col gap-sm rounded-md border border-border-subtle bg-surface-raised p-md"
        onSubmit={(e) => {
          e.preventDefault();
          if (!pick.resourceId || !chosen) return;
          // A universal source ("My own plan") has no levels or lessons.
          const lesson = chosen.kind === 'universal' ? '' : pick.lesson.trim();
          const level = chosen.levels.includes(pick.level) ? pick.level : '';
          void save({
            resourceId: pick.resourceId,
            ...(level ? { level } : {}),
            ...(/^\d{1,4}$/.test(lesson) ? { lesson } : {}),
            source: 'parent',
          });
        }}
      >
        <p id={ids.legend} className="font-sans text-sm font-semibold text-text-primary">
          {c.changeLegend}
        </p>
        <label htmlFor={ids.resource} className="font-sans text-xs text-text-muted">
          {c.resourceLabel}
        </label>
        <select
          id={ids.resource}
          className={FIELD}
          value={pick.resourceId}
          onChange={(e) => setPick({ resourceId: e.target.value, level: '', lesson: pick.lesson })}
        >
          <option value="" disabled>
            {c.changeLegend}
          </option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        {chosen && chosen.levels.length > 0 && (
          <>
            <label htmlFor={ids.level} className="font-sans text-xs text-text-muted">
              {c.levelLabel}
            </label>
            <select
              id={ids.level}
              className={FIELD}
              value={pick.level}
              onChange={(e) => setPick({ ...pick, level: e.target.value })}
            >
              <option value="">{c.levelNone}</option>
              {chosen.levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </>
        )}
        {chosen && chosen.kind !== 'universal' && (
          <>
            <label htmlFor={ids.lesson} className="font-sans text-xs text-text-muted">
              {c.lessonLabel}
            </label>
            <input
              id={ids.lesson}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              className={FIELD}
              value={pick.lesson}
              onChange={(e) => setPick({ ...pick, lesson: e.target.value.replace(/\D/g, '') })}
            />
          </>
        )}
        <div className="flex flex-wrap gap-sm">
          <button type="submit" className={SMALL_PRIMARY} disabled={busy || !pick.resourceId}>
            {c.save}
          </button>
          <button type="button" className={SMALL_GHOST} disabled={busy} onClick={() => setMode('offer')}>
            {c.cancel}
          </button>
        </div>
      </form>
    );
  }

  const suggestionLabel = workingFromLabel(suggestion.title, suggestion.level, suggestion.lesson);
  return (
    <div className="hearth-reveal flex flex-col gap-sm">
      <p className="inline-flex items-center gap-xs self-start rounded-full border border-border-subtle bg-surface-raised px-md py-sm font-sans text-sm text-text-primary">
        <BookOpen size={16} aria-hidden="true" className="text-text-secondary" />
        {c.prompt(suggestionLabel)}
      </p>
      <div className="flex flex-wrap gap-sm">
        <button
          type="button"
          className={SMALL_PRIMARY}
          disabled={busy}
          onClick={() =>
            void save({
              resourceId: suggestion.resourceId,
              ...(suggestion.level ? { level: suggestion.level } : {}),
              ...(suggestion.lesson ? { lesson: suggestion.lesson } : {}),
              source: 'read',
            })
          }
        >
          {c.yes}
        </button>
        <button
          type="button"
          className={SMALL_GHOST}
          disabled={busy}
          onClick={() => {
            setPick({ resourceId: suggestion.resourceId, level: suggestion.level ?? '', lesson: suggestion.lesson ?? '' });
            setMode('change');
          }}
        >
          {c.change}
        </button>
        <button type="button" className={SMALL_GHOST} disabled={busy} onClick={() => setMode('dismissed')}>
          {c.no}
        </button>
      </div>
    </div>
  );
}
