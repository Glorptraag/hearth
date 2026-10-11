'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { addDays, startOfWeek, format, isSameWeek } from 'date-fns';
import PlannerGrid from '@/components/planner/PlannerGrid';
import BottomSheet from '@/components/planner/BottomSheet';
import { PrintSheet } from '@/components/content/PrintSheet';
import { usePedagogy } from '@/hooks/use-pedagogy';
import { track } from '@/lib/analytics/posthog';
import { sanityClient } from '@/lib/sanity/client';
import { clientSanityRead } from '@/lib/sanity/client-read';
import { MODULE_INDICATORS_QUERY } from '@/lib/sanity/queries';
import { resolveIndicators, type Indicators, type Printables, type Materials, type AssetCounts } from '@/lib/sanity/pack-indicators';
import type { PrintableItem, PrintSelection, PrintBundleResponse } from '@/components/content/types';
import { fetchPrintBundle } from '@/components/content/types';
import { isPrintableAssetKind, type AssetKind } from '@/components/content/types';
import { CaretLeft, CaretRight, NotePencil, Books, Printer } from '@/components/icons';

interface Learner {
  id: string;
  name: string;
  colourToken: string | null;
}

interface PlannerEntry {
  id: string;
  title: string | null;
  status: string | null;
  moduleId: string | null;
  learnerIds: string[] | null;
  date: string;
  session: string | null;
  subjects: string[] | null;
}

interface Recommendation {
  title: string;
  subject?: string;
  reason?: string;
  moduleId?: string;
}

interface PlannerClientProps {
  initialEntries: PlannerEntry[];
  learners: Learner[];
  recommendations: Recommendation[];
  today: string;
  basePath?: string;
  hasLibraryModules?: boolean;
}

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function getWeekDates(weekStart: Date, count = 5): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(weekStart, i));
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 4);
  return `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM yyyy')}`;
}

export default function PlannerClient({
  initialEntries,
  learners,
  recommendations,
  today,
  basePath = '',
  hasLibraryModules = true,
}: PlannerClientProps) {
  const { vocab } = usePedagogy();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [entries, setEntries] = useState<PlannerEntry[]>(initialEntries);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [sheetSession, setSheetSession] = useState<string>('morning');
  const [loading, setLoading] = useState(false);
  const [showPrintSheet, setShowPrintSheet] = useState(false);

  // Module materials data for indicators and print
  interface ModuleMaterials {
    moduleId: string;
    moduleTitle: string;
    items: PrintableItem[];
  }
  const [moduleMaterials, setModuleMaterials] = useState<ModuleMaterials[]>([]);
  const [moduleIndicators, setModuleIndicators] = useState<Map<string, Indicators>>(new Map());

  const weekDates = getWeekDates(weekStart);
  const todayDate = new Date(today + 'T12:00:00');
  const isCurrentOrFutureWeek =
    isSameWeek(weekStart, todayDate, { weekStartsOn: 1 }) ||
    weekStart >= getWeekStart(todayDate);

  async function loadWeek(start: Date) {
    setLoading(true);
    try {
      const weekEnd = addDays(start, 6);
      const res = await fetch(
        `/api/planner?startDate=${format(start, 'yyyy-MM-dd')}&endDate=${format(weekEnd, 'yyyy-MM-dd')}`
      );
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } finally {
      setLoading(false);
    }
  }

  function navWeek(delta: number) {
    const next = addDays(weekStart, delta * 7);
    setWeekStart(next);
    loadWeek(next);
  }

  function goToCurrentWeek() {
    const current = getWeekStart(new Date());
    setWeekStart(current);
    loadWeek(current);
  }

  function handleOpenSheet(date: string, session: string) {
    setSheetDate(date);
    setSheetSession(session);
    setSheetOpen(true);
  }

  async function handleAddEntry(payload: { date: string; title: string; learnerIds: string[]; session: string }) {
    const res = await fetch('/api/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const entry = await res.json();
      setEntries((prev) => [...prev, entry]);
      // Stage-5 signal: does this family move from retro-logging to forward
      // planning? Props stay enum-like/numeric (no free-form text).
      track('planner_entry_created', {
        has_module: Boolean(entry?.moduleId),
        learner_count: payload.learnerIds.length,
      });
    }
  }

  const handleToggle = useCallback(async (id: string, currentStatus: string | null) => {
    const next =
      currentStatus === 'completed'
        ? 'planned'
        : currentStatus === 'in_progress'
          ? 'completed'
          : 'in_progress';

    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: next } : e))
    );

    const res = await fetch(`/api/planner/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: currentStatus } : e))
      );
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    const res = await fetch(`/api/planner/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      await loadWeek(weekStart);
    }
  }, [weekStart]);

  const handleMove = useCallback(async (id: string, toDate: string, toSession: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry || (entry.date === toDate && (entry.session ?? 'morning') === toSession)) return;

    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, date: toDate, session: toSession } : e))
    );

    const res = await fetch(`/api/planner/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: toDate, session: toSession }),
    });
    if (!res.ok) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, date: entry.date, session: entry.session } : e))
      );
    }
  }, [entries]);

  const isCurrentWeek = isSameWeek(weekStart, todayDate, { weekStartsOn: 1 });

  // Fetch materials for all modules in current week's entries
  useEffect(() => {
    const moduleIds = [...new Set(entries.map((e) => e.moduleId).filter(Boolean))] as string[];
    if (moduleIds.length === 0) {
      // Reset stale module materials when the week has no entries; fetch-on-deps-change pattern.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModuleMaterials([]);
      return;
    }

    let cancelled = false;
    async function fetchMaterials() {
      try {
        // module materials deref dotted-id asset/commonsText (dark to the
        // tokenless browser client) — read through the authed proxy.
        const modules = (await clientSanityRead<Array<{
          _id: string;
          title: string;
          approaches?: Array<{
            activities?: Array<{
              _id: string;
              title: string;
              assets?: Array<{
                _key: string;
                role: string;
                asset: {
                  _id: string;
                  title: string;
                  slug?: { current: string };
                  kind: string;
                  pageCount?: number;
                  description?: string;
                  printGuidance?: string;
                  status: string;
                  fileUrl?: string;
                  thumbnailUrl?: string;
                };
              }>;
              commonsTexts?: Array<{
                _key: string;
                role: string;
                presentationMode?: string;
                text: {
                  _id: string;
                  title: string;
                  slug?: { current: string };
                  kind: string;
                  tradition?: string;
                  estimatedReadAloudMinutes?: number;
                  length?: string;
                  source?: string;
                  status: string;
                };
              }>;
            }>;
          }>;
        }>>('modulesMaterialsBatch', { ids: moduleIds })) ?? [];

        if (cancelled) return;

        const result: ModuleMaterials[] = [];
        for (const mod of modules) {
          const items: PrintableItem[] = [];
          const seenIds = new Set<string>();
          for (const approach of mod.approaches ?? []) {
            for (const activity of approach.activities ?? []) {
              for (const ref of activity.assets ?? []) {
                if (!ref.asset || seenIds.has(ref.asset._id)) continue;
                seenIds.add(ref.asset._id);
                items.push({
                  id: ref.asset._id,
                  kind: 'asset',
                  assetKind: ref.asset.kind as AssetKind,
                  title: ref.asset.title,
                  thumbnailUrl: ref.asset.thumbnailUrl ?? null,
                  pageCount: ref.asset.pageCount ?? 0,
                  description: ref.asset.description,
                  role: ref.role as PrintableItem['role'],
                  isPrintable: isPrintableAssetKind(ref.asset.kind as AssetKind),
                });
              }
              for (const ref of activity.commonsTexts ?? []) {
                if (!ref.text || seenIds.has(ref.text._id)) continue;
                seenIds.add(ref.text._id);
                items.push({
                  id: ref.text._id,
                  kind: 'commonsText',
                  commonsKind: ref.text.kind as PrintableItem['commonsKind'],
                  title: ref.text.title,
                  thumbnailUrl: null,
                  pageCount: ref.text.estimatedReadAloudMinutes ?? 0,
                  role: ref.role as PrintableItem['role'],
                  isPrintable: true,
                });
              }
            }
          }
          if (items.length > 0) {
            result.push({ moduleId: mod._id, moduleTitle: mod.title, items });
          }
        }
        setModuleMaterials(result);
      } catch {
        setModuleMaterials([]);
      }
    }
    fetchMaterials();
    return () => { cancelled = true; };
  }, [entries]);

  // Set of moduleIds that have materials (for card indicators)
  const moduleIdsWithMaterials = useMemo(
    () => new Set(moduleMaterials.map((m) => m.moduleId)),
    [moduleMaterials],
  );

  // Fetch pack indicators (printables/materials) for modules planned this week.
  useEffect(() => {
    const moduleIds = [...new Set(entries.map((e) => e.moduleId).filter(Boolean))] as string[];
    if (moduleIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModuleIndicators(new Map());
      return;
    }
    let cancelled = false;
    sanityClient
      .fetch<Array<{
        _id: string;
        printables?: Printables;
        materials?: Materials;
        assetCounts?: AssetCounts | null;
        owningPack?: {
          _id: string;
          printables?: Printables;
          materials?: Materials;
          assetCounts?: AssetCounts | null;
        } | null;
      }>>(MODULE_INDICATORS_QUERY, { ids: moduleIds })
      .then((rows) => {
        if (cancelled) return;
        const map = new Map<string, Indicators>();
        for (const row of rows) {
          map.set(row._id, resolveIndicators(row.owningPack, row));
        }
        setModuleIndicators(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [entries]);

  // Build print sheet groups — deduplicate across modules, group by day
  const printSheetGroups = useMemo(() => {
    const seenIds = new Set<string>();
    const dayGroups = new Map<string, PrintableItem[]>();

    for (const entry of entries) {
      if (!entry.moduleId) continue;
      const modMat = moduleMaterials.find((m) => m.moduleId === entry.moduleId);
      if (!modMat) continue;

      const dayLabel = (() => {
        try {
          const d = new Date(entry.date + 'T12:00:00');
          return format(d, 'EEEE');
        } catch {
          return entry.date;
        }
      })();

      for (const item of modMat.items) {
        if (seenIds.has(item.id)) continue;
        seenIds.add(item.id);
        if (!dayGroups.has(dayLabel)) dayGroups.set(dayLabel, []);
        dayGroups.get(dayLabel)!.push(item);
      }
    }

    return Array.from(dayGroups.entries()).map(([label, items]) => ({ label, items }));
  }, [entries, moduleMaterials]);

  const totalMaterialCount = printSheetGroups.reduce((sum, g) => sum + g.items.length, 0);

  async function handlePrintGenerate(selection: PrintSelection): Promise<PrintBundleResponse> {
    const allItems = printSheetGroups.flatMap((g) => g.items);
    const items = selection.itemIds
      .map((id) => allItems.find((i) => i.id === id))
      .filter(Boolean)
      .map((i) => ({ id: i!.id, kind: i!.kind }));

    return fetchPrintBundle(items, {
      copies: selection.copies,
      combine: selection.combine,
      coverTitle: `Week of ${format(weekStart, 'yyyy-MM-dd')}`,
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-md py-xl lg:px-xl">
      {/* Week navigation */}
      <div className="mb-lg flex items-center gap-md">
        <button
          onClick={() => navWeek(-1)}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-md border border-border-subtle bg-surface-panel font-sans text-base text-text-secondary transition duration-[var(--motion-quick)] hover:border-border-medium hover:text-text-primary"
          aria-label="Previous week"
        >
          <CaretLeft size={16} aria-hidden="true" />
        </button>

        <button
          onClick={goToCurrentWeek}
          className="flex-1 text-center transition-colors hover:text-ember"
          title="Return to current week"
        >
          <span className="font-serif text-[1.1rem] font-semibold text-text-primary">
            Week of {format(weekStart, 'd MMM')}
          </span>
        </button>

        <button
          onClick={() => navWeek(1)}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-md border border-border-subtle bg-surface-panel font-sans text-base text-text-secondary transition duration-[var(--motion-quick)] hover:border-border-medium hover:text-text-primary"
          aria-label="Next week"
        >
          <CaretRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Week label + print action */}
      <div className="mb-lg flex items-center gap-sm">
        <span className="font-sans text-[0.75rem] text-text-muted">
          {formatWeekLabel(weekStart)}
        </span>
        {isCurrentWeek && (
          <span className="rounded-full bg-ember-glow px-sm py-[2px] font-sans text-[11px] font-semibold text-ember">
            This week
          </span>
        )}
        {!isCurrentOrFutureWeek && (
          <span className="font-sans text-xs text-text-muted">Read-only — past week</span>
        )}
        {loading && (
          <span className="font-sans text-xs text-text-muted hearth-pulse">Loading...</span>
        )}
        {totalMaterialCount > 0 && (
          <button
            onClick={() => setShowPrintSheet(true)}
            className="ml-auto flex items-center gap-xs rounded-md border border-border-subtle bg-surface-panel px-sm py-xs font-sans text-[0.75rem] font-medium text-text-secondary hover:border-border-medium hover:text-ember transition duration-[var(--motion-quick)]"
            title="Print materials for this week"
          >
            <Printer size={14} aria-hidden="true" /> Print ({totalMaterialCount})
          </button>
        )}
      </div>

      {/* Empty week nudge */}
      {!loading && entries.length === 0 && isCurrentWeek && (
        <div className="mb-lg rounded-lg border border-border-subtle bg-surface-panel p-lg text-center">
          <span className="mx-auto mb-sm inline-flex text-text-secondary" aria-hidden="true">
            {hasLibraryModules ? <NotePencil size={32} /> : <Books size={32} />}
          </span>
          {hasLibraryModules ? (
            <>
              <p className="font-serif text-sm text-text-secondary mb-xs">
                {vocab.plannerFrame}
              </p>
              <p className="font-sans text-xs text-text-muted">
                Tap + in any session to add an activity, or browse the{' '}
                <a href={`${basePath}/explore/activities`} className="text-ember hover:underline">activity library</a>.
              </p>
            </>
          ) : (
            <>
              <p className="font-serif text-sm font-semibold text-text-primary mb-xs">
                Build your activity library first
              </p>
              <p className="font-sans text-xs text-text-muted mb-md">
                Browse the marketplace to add packs and activities to your library, then plan your week here.
              </p>
              <a
                href={`${basePath}/explore/marketplace`}
                className="inline-block rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:bg-ember-hover"
              >
                Explore the marketplace
              </a>
            </>
          )}
        </div>
      )}

      {/* Grid */}
      <PlannerGrid
        weekDates={weekDates}
        entries={entries}
        learners={learners}
        today={today}
        isCurrentOrFutureWeek={isCurrentOrFutureWeek}
        moduleIdsWithMaterials={moduleIdsWithMaterials}
        moduleIndicators={moduleIndicators}
        onAdd={handleOpenSheet}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onMove={handleMove}
      />

      {/* Bottom sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        targetDate={sheetDate}
        targetSession={sheetSession}
        learners={learners}
        recommendations={recommendations}
        onClose={() => setSheetOpen(false)}
        onAdd={handleAddEntry}
      />

      {/* Print Sheet */}
      {showPrintSheet && (
        <PrintSheet
          isOpen={showPrintSheet}
          title={`Print — Week of ${format(weekStart, 'd MMM')}`}
          subtitle={`${totalMaterialCount} material${totalMaterialCount !== 1 ? 's' : ''} across ${entries.length} planned activit${entries.length !== 1 ? 'ies' : 'y'}`}
          groups={printSheetGroups}
          defaultCopies={learners.length || 1}
          onClose={() => setShowPrintSheet(false)}
          onGenerate={handlePrintGenerate}
        />
      )}
    </div>
  );
}
