'use client';

/**
 * ContextualProposals — proactive attach banner at the top of /log.
 *
 * On mount, fetches three lightweight endpoints in parallel:
 *   1. /api/module-runs?state=active  — runs the parent started but didn't log
 *   2. /api/planner (today + tomorrow) — what's on the agenda
 *   3. /api/library                    — recently-added items (≤7 days)
 *
 * Joins them client-side using the library's `title` mapping, then renders
 * up to 3 prioritized proposals: active runs first, today's planner second,
 * recent library additions last. Tapping a proposal calls `onAttach` with
 * a normalized AttachContext the page can merge into its form state.
 *
 * Task 2.6 — Logger contextual proposals. Reuses AttachToModuleModal's
 * mental model but surfaces proactively, not post-save.
 */
import { useEffect, useState } from 'react';
import { Play, CalendarBlank, BookmarkSimple, X } from '@/components/icons';

export type AttachContext = {
  /** Origin: what kind of proposal the parent tapped. */
  source: 'active_run' | 'planned' | 'recent_library';
  /** Sanity module ID — written to learning_entries.source_module_id. */
  moduleId: string;
  /** Human-readable module title for display. */
  moduleTitle: string;
  /** module_runs row id — when source = 'active_run'. */
  moduleRunId?: string;
  /** planner_entries row id — when source = 'planned'. */
  plannerEntryId?: string;
  /** Sanity approach ID the active run is using, if known. */
  sourceApproachId?: string;
};

type ModuleRun = {
  id: string;
  sanityModuleId: string;
  approachId: string | null;
  state: string;
};

type LibraryItem = {
  id: string;
  title: string;
  kind: 'pack' | 'module';
  moduleId: string;
  sanityPackId: string | null;
  sanityModuleId: string | null;
  addedAt?: string; // Not currently returned by /api/library but harmless if absent.
};

type PlannerEntry = {
  id: string;
  date: string;
  title: string | null;
  moduleId: string | null;
};

const RECENT_LIBRARY_DAYS = 7;

function isWithinDays(iso: string | undefined, days: number): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < days * 24 * 60 * 60 * 1000;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function isToday(date: string): boolean {
  return date === todayIso();
}

export function ContextualProposals({
  attached,
  onAttach,
  onClear,
}: {
  /** Currently-attached context (so we render a clear pill instead). */
  attached: AttachContext | null;
  onAttach: (ctx: AttachContext) => void;
  onClear: () => void;
}) {
  const [proposals, setProposals] = useState<AttachContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [runsRes, plannerRes, libraryRes] = await Promise.all([
          fetch('/api/module-runs?state=active').then((r) => (r.ok ? r.json() : [])),
          fetch(`/api/planner?startDate=${todayIso()}&endDate=${tomorrowIso()}`).then((r) =>
            r.ok ? r.json() : [],
          ),
          fetch('/api/library').then((r) => (r.ok ? r.json() : [])),
        ]);
        if (cancelled) return;

        const runs: ModuleRun[] = Array.isArray(runsRes) ? runsRes : [];
        const planned: PlannerEntry[] = Array.isArray(plannerRes) ? plannerRes : [];
        const library: LibraryItem[] = Array.isArray(libraryRes) ? libraryRes : [];

        // Build sanityModuleId → title lookup from library (best title source we
        // have on the client without a separate Sanity fetch).
        const titleByModuleId = new Map<string, string>();
        for (const item of library) {
          if (item.sanityModuleId) titleByModuleId.set(item.sanityModuleId, item.title);
          if (item.moduleId) titleByModuleId.set(item.moduleId, item.title);
        }

        const out: AttachContext[] = [];

        // 1. Active runs — most relevant.
        for (const run of runs) {
          out.push({
            source: 'active_run',
            moduleId: run.sanityModuleId,
            moduleTitle: titleByModuleId.get(run.sanityModuleId) ?? 'Active session',
            moduleRunId: run.id,
            sourceApproachId: run.approachId ?? undefined,
          });
        }

        // 2. Today + tomorrow planner items with a moduleId.
        for (const p of planned) {
          if (!p.moduleId) continue;
          out.push({
            source: 'planned',
            moduleId: p.moduleId,
            moduleTitle:
              titleByModuleId.get(p.moduleId) ?? p.title ?? (isToday(p.date) ? 'Planned today' : 'Planned tomorrow'),
            plannerEntryId: p.id,
          });
        }

        // 3. Recently added library items (≤7 days). Only show if we have an
        // addedAt server-side; if not, this section is silently empty.
        for (const item of library) {
          if (!item.sanityModuleId) continue; // packs aren't directly attachable
          if (!isWithinDays(item.addedAt, RECENT_LIBRARY_DAYS)) continue;
          out.push({
            source: 'recent_library',
            moduleId: item.sanityModuleId,
            moduleTitle: item.title,
          });
        }

        // Dedupe by (source, moduleId) so the same module doesn't appear twice
        // because it's both planned today and recently added.
        const seen = new Set<string>();
        const deduped = out.filter((c) => {
          const k = `${c.source}:${c.moduleId}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        setProposals(deduped.slice(0, 3));
      } catch {
        // Quiet — the banner just doesn't show.
        if (!cancelled) setProposals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;

  // Attached state — show a pill the parent can clear.
  if (attached) {
    const Icon =
      attached.source === 'active_run'
        ? Play
        : attached.source === 'planned'
          ? CalendarBlank
          : BookmarkSimple;
    const sourceLabel =
      attached.source === 'active_run'
        ? 'Active session'
        : attached.source === 'planned'
          ? 'Planned'
          : 'Recently added';
    return (
      <div
        className="mb-md flex items-center gap-sm rounded-md border border-ember/30 bg-ember/10 px-md py-sm"
        role="status"
        aria-live="polite"
      >
        <Icon size={16} className="text-ember shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[11px] uppercase tracking-widest text-ember">
            Attached · {sourceLabel}
          </p>
          <p className="font-serif text-sm text-text-primary truncate">{attached.moduleTitle}</p>
        </div>
        <button
          onClick={onClear}
          className="shrink-0 text-text-muted hover:text-text-primary min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Detach from this context"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (proposals.length === 0) return null;

  return (
    <div className="mb-md rounded-md border border-border-subtle bg-surface-panel p-sm">
      <p className="mb-sm font-sans text-[11px] uppercase tracking-widest text-text-muted">
        Attach to
      </p>
      <div className="flex flex-wrap gap-xs">
        {proposals.map((p) => {
          const Icon =
            p.source === 'active_run'
              ? Play
              : p.source === 'planned'
                ? CalendarBlank
                : BookmarkSimple;
          const sourceLabel =
            p.source === 'active_run'
              ? 'Active'
              : p.source === 'planned'
                ? 'Planned'
                : 'Recent';
          return (
            <button
              key={`${p.source}-${p.moduleId}-${p.moduleRunId ?? ''}-${p.plannerEntryId ?? ''}`}
              onClick={() => onAttach(p)}
              className="inline-flex items-center gap-xs rounded-md border border-border-subtle bg-surface-raised px-sm py-xs font-sans text-xs text-text-secondary hover:border-ember hover:text-text-primary transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)]"
            >
              <Icon size={13} className="text-ember" aria-hidden="true" />
              <span className="text-text-muted">{sourceLabel}:</span>
              <span className="max-w-[14ch] truncate">{p.moduleTitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
