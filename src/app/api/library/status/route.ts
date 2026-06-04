import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
  familyLibrary,
  learningEntries,
  moduleRuns,
  plannerEntries,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq, gte, inArray, isNull, lte, ne } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';
import { sanityClient } from '@/lib/sanity/client';

/**
 * GET /api/library/status
 *
 * Derived status board for each library row. Computes per-item status from
 * `module_runs` + `planner_entries` + `learning_entries`:
 *   in_flight     → open run (state ∈ active|paused), recent activity
 *   planned       → planner_entries row within the next 7 days
 *   recently_used → learning_entries within the last 14 days
 *   abandoned     → open run with lastActiveAt > STALE_DAYS old, OR no entry
 *                   within 30 days of run start
 *   untouched     → in library, never run, never planned, no entries
 *
 * For library rows that point at a pack, status aggregates across the pack's
 * modules (resolved from Sanity once per request). For standalone modules,
 * status is derived from that single sanityModuleId directly.
 *
 * Task 4.1.
 */
export type LibraryStatus =
  | 'in_flight'
  | 'planned'
  | 'recently_used'
  | 'abandoned'
  | 'untouched';

export interface LibraryStatusItem {
  /** family_library row UUID — stable key for the surface, also the soft-delete target. */
  rowId: string;
  kind: 'pack' | 'module';
  sanityPackId: string | null;
  sanityModuleId: string | null;
  addedAt: string | null;
  status: LibraryStatus;
  lastActivityAt: string | null;
  openRunId: string | null;
  plannedDates: string[];
  runCount: number;
  /**
   * True when the in-flight or most-recent open run has every required material
   * ticked off in its `materials_state`. Null when no run exists or the schema
   * has no materials. PrepMode reads this to gate the Start button.
   */
  materialsReady: boolean | null;
}

/**
 * Per-module status, keyed by sanityModuleId. Unlike `items` (one aggregate
 * per library row — a pack row leaves sanityModuleId null), this exposes a
 * status for every individual module the family can run, INCLUDING modules
 * inherited from packs. The "In use" tab maps modules → status through this.
 */
export interface LibraryModuleStatus {
  sanityModuleId: string;
  status: LibraryStatus;
  lastActivityAt: string | null;
  openRunId: string | null;
  plannedDates: string[];
  runCount: number;
  materialsReady: boolean | null;
}

export interface LibraryStatusResponse {
  /** Sorted: in_flight first, then planned, recently_used, abandoned, untouched. */
  items: LibraryStatusItem[];
  /** Per-module statuses (incl. pack-nested modules). Keyed by sanityModuleId. */
  moduleStatuses: LibraryModuleStatus[];
  /** Quick rollup so the surface can render counts without re-tallying. */
  counts: Record<LibraryStatus, number>;
}

const STALE_DAYS = 14;
const PLAN_WINDOW_DAYS = 7;
const RECENT_DAYS = 14;
const STATUS_ORDER: LibraryStatus[] = [
  'in_flight',
  'planned',
  'recently_used',
  'abandoned',
  'untouched',
];

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function daysAheadIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const GET = routeHandler(async () => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const libraryRows = await db
    .select()
    .from(familyLibrary)
    .where(and(eq(familyLibrary.familyId, family.id), isNull(familyLibrary.removedAt)));

  if (libraryRows.length === 0) {
    return NextResponse.json<LibraryStatusResponse>({
      items: [],
      moduleStatuses: [],
      counts: { in_flight: 0, planned: 0, recently_used: 0, abandoned: 0, untouched: 0 },
    });
  }

  const packIds = libraryRows
    .map((r) => r.sanityPackId)
    .filter((id): id is string => !!id);

  // Expand pack → module IDs via Sanity (one fetch).
  const packExpansions: Array<{ _id: string; moduleIds: string[] }> = packIds.length > 0
    ? await sanityClient
        .fetch<Array<{ _id: string; moduleIds: string[] | null }>>(
          `*[_type == "pack" && _id in $ids && status == "published"]{
            _id,
            "moduleIds": modules[@->status == "published"]->_id
          }`,
          { ids: packIds },
        )
        .then((rows) => rows.map((r) => ({ _id: r._id, moduleIds: r.moduleIds ?? [] })))
        .catch(() => [])
    : [];

  const packToModuleIds = new Map<string, string[]>();
  for (const e of packExpansions) packToModuleIds.set(e._id, e.moduleIds);

  // Build the unified set of all moduleIds relevant to this library.
  const allModuleIds = new Set<string>();
  for (const r of libraryRows) {
    if (r.sanityModuleId) allModuleIds.add(r.sanityModuleId);
    if (r.sanityPackId) {
      for (const mid of packToModuleIds.get(r.sanityPackId) ?? []) allModuleIds.add(mid);
    }
  }
  const allModuleIdList = Array.from(allModuleIds);

  // Empty inventory → fast exit.
  if (allModuleIdList.length === 0) {
    const items: LibraryStatusItem[] = libraryRows.map((r) => ({
      rowId: r.id,
      kind: r.sanityPackId ? 'pack' : 'module',
      sanityPackId: r.sanityPackId,
      sanityModuleId: r.sanityModuleId,
      addedAt: r.addedAt?.toISOString() ?? null,
      status: 'untouched' as LibraryStatus,
      lastActivityAt: null,
      openRunId: null,
      plannedDates: [],
      runCount: 0,
      materialsReady: null,
    }));
    return NextResponse.json<LibraryStatusResponse>({
      items,
      moduleStatuses: [],
      counts: tally(items),
    });
  }

  const today = todayIso();
  const planWindowEnd = daysAheadIso(PLAN_WINDOW_DAYS);
  const recentWindowStart = daysAgoIso(RECENT_DAYS);
  const staleCutoffIso = daysAgoIso(STALE_DAYS);
  const staleCutoff = new Date(staleCutoffIso + 'T00:00:00Z');

  // Three parallel queries — one per signal source.
  const [runs, planned, recent] = await Promise.all([
    db
      .select()
      .from(moduleRuns)
      .where(
        and(
          eq(moduleRuns.familyId, family.id),
          inArray(moduleRuns.sanityModuleId, allModuleIdList),
          ne(moduleRuns.state, 'finished'),
        ),
      ),
    db
      .select({
        moduleId: plannerEntries.moduleId,
        date: plannerEntries.date,
      })
      .from(plannerEntries)
      .where(
        and(
          eq(plannerEntries.familyId, family.id),
          gte(plannerEntries.date, today),
          lte(plannerEntries.date, planWindowEnd),
        ),
      ),
    db
      .select({
        sourceModuleId: learningEntries.sourceModuleId,
        dateOccurred: learningEntries.dateOccurred,
      })
      .from(learningEntries)
      .where(
        and(
          eq(learningEntries.familyId, family.id),
          gte(learningEntries.dateOccurred, recentWindowStart),
        ),
      ),
  ]);

  // Index signals by moduleId.
  const runsByModule = new Map<string, typeof runs>();
  for (const r of runs) {
    const existing = runsByModule.get(r.sanityModuleId);
    if (existing) existing.push(r);
    else runsByModule.set(r.sanityModuleId, [r]);
  }
  const plannedByModule = new Map<string, string[]>();
  for (const p of planned) {
    if (!p.moduleId) continue;
    if (!allModuleIds.has(p.moduleId)) continue;
    const existing = plannedByModule.get(p.moduleId);
    if (existing) existing.push(p.date);
    else plannedByModule.set(p.moduleId, [p.date]);
  }
  const recentByModule = new Map<string, string>();
  for (const e of recent) {
    if (!e.sourceModuleId) continue;
    if (!allModuleIds.has(e.sourceModuleId)) continue;
    const prev = recentByModule.get(e.sourceModuleId);
    if (!prev || e.dateOccurred > prev) recentByModule.set(e.sourceModuleId, e.dateOccurred);
  }

  // Aggregate the three signal sources across a set of module IDs into a
  // single derived status. Used for BOTH per-row aggregates (a pack row spans
  // all its modules) and per-module statuses (one module each).
  type Derived = {
    status: LibraryStatus;
    lastActivityAt: string | null;
    openRunId: string | null;
    plannedDates: string[];
    runCount: number;
    materialsReady: boolean | null;
  };
  const deriveForModules = (moduleIds: string[], untouchedFallback: string | null): Derived => {
    let openRun: (typeof runs)[number] | null = null;
    let openRunIsStale = false;
    const plannedDates: string[] = [];
    let lastEntryDate: string | null = null;
    let runCount = 0;

    for (const mid of moduleIds) {
      const rs = runsByModule.get(mid) ?? [];
      runCount += rs.length;
      for (const run of rs) {
        const lastActive = new Date(run.lastActiveAt);
        const isStale = lastActive < staleCutoff;
        // Prefer the freshest open run as the "open run" of record.
        if (!openRun || new Date(run.lastActiveAt) > new Date(openRun.lastActiveAt)) {
          openRun = run;
          openRunIsStale = isStale;
        }
      }
      for (const d of plannedByModule.get(mid) ?? []) plannedDates.push(d);
      const rec = recentByModule.get(mid);
      if (rec && (!lastEntryDate || rec > lastEntryDate)) lastEntryDate = rec;
    }

    let status: LibraryStatus;
    let lastActivityAt: string | null = null;
    if (openRun && !openRunIsStale) {
      status = 'in_flight';
      lastActivityAt = openRun.lastActiveAt.toISOString();
    } else if (openRun && openRunIsStale) {
      status = 'abandoned';
      lastActivityAt = openRun.lastActiveAt.toISOString();
    } else if (plannedDates.length > 0) {
      status = 'planned';
      lastActivityAt = plannedDates.sort()[0];
    } else if (lastEntryDate) {
      status = 'recently_used';
      lastActivityAt = lastEntryDate;
    } else {
      status = 'untouched';
      lastActivityAt = untouchedFallback;
    }

    // materialsReady: true when openRun.materialsState has at least one entry
    // and every entry has haveIt=true. null when no run or no materialsState yet.
    let materialsReady: boolean | null = null;
    if (openRun?.materialsState) {
      const state = openRun.materialsState as Record<string, { haveIt?: boolean }>;
      const keys = Object.keys(state);
      if (keys.length > 0) {
        materialsReady = keys.every((k) => state[k]?.haveIt === true);
      }
    }

    return {
      status,
      lastActivityAt,
      openRunId: openRun?.id ?? null,
      plannedDates: plannedDates.sort(),
      runCount,
      materialsReady,
    };
  };

  const items: LibraryStatusItem[] = libraryRows.map((r) => {
    // Collect every moduleId relevant to this library row.
    const moduleIdsForRow: string[] = [];
    if (r.sanityModuleId) moduleIdsForRow.push(r.sanityModuleId);
    if (r.sanityPackId) moduleIdsForRow.push(...(packToModuleIds.get(r.sanityPackId) ?? []));

    const derived = deriveForModules(moduleIdsForRow, r.addedAt?.toISOString() ?? null);

    return {
      rowId: r.id,
      kind: r.sanityPackId ? ('pack' as const) : ('module' as const),
      sanityPackId: r.sanityPackId,
      sanityModuleId: r.sanityModuleId,
      addedAt: r.addedAt?.toISOString() ?? null,
      ...derived,
    };
  });

  // Per-module statuses for every module in the inventory (pack-nested
  // included) so the "In use" tab can resolve a status for each module card.
  const moduleStatuses: LibraryModuleStatus[] = allModuleIdList.map((mid) => ({
    sanityModuleId: mid,
    ...deriveForModules([mid], null),
  }));

  // Sort by status priority then by lastActivityAt desc.
  items.sort((a, b) => {
    const sa = STATUS_ORDER.indexOf(a.status);
    const sb = STATUS_ORDER.indexOf(b.status);
    if (sa !== sb) return sa - sb;
    if (a.lastActivityAt && b.lastActivityAt) {
      return a.lastActivityAt > b.lastActivityAt ? -1 : 1;
    }
    return 0;
  });

  return NextResponse.json<LibraryStatusResponse>({
    items,
    moduleStatuses,
    counts: tally(items),
  });
}, { route: 'GET /api/library/status' });

function tally(items: LibraryStatusItem[]): Record<LibraryStatus, number> {
  const counts: Record<LibraryStatus, number> = {
    in_flight: 0,
    planned: 0,
    recently_used: 0,
    abandoned: 0,
    untouched: 0,
  };
  for (const item of items) counts[item.status] += 1;
  return counts;
}
