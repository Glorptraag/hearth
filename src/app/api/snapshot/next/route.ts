import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
  familyIntelligenceSnapshots,
  familyLibrary,
  familySettings,
  learningEntries,
  plannerEntries,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq, gte, isNull } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';
import type { ChildSnapshot, SnapshotData, SnapshotRecommendation } from '@/types/snapshot';
import { sanityClient } from '@/lib/sanity/client';
import { SCORING_MODULES_QUERY, SCORING_OWN_MODULES_QUERY } from '@/lib/sanity/queries';
import { getCachedThreads } from '@/lib/ai/sanity-thread-cache';
import { scoreModules, type ScoringModule, type PedagogyContext } from '@/lib/ai/recommend';

/**
 * GET /api/snapshot/next?limit=5
 *
 * Returns the top N recommended modules for this family using the
 * pedagogy-aware scoreModules pipeline. Inputs:
 *   - childSnapshots from the family intelligence snapshot
 *   - planned module IDs from this week
 *   - completed module counts from prior entries
 *   - subjects already covered this week (recency penalty)
 *   - pedagogyContext from family_settings
 *
 * Modules are filtered to the family's library (their owned packs + their
 * own-built modules) so recommendations are always actionable.
 *
 * Task 3.6.
 */
export interface NextResponseBody {
  recommendations: SnapshotRecommendation[];
  /** Echoed back so callers can show "based on your X pedagogy" UI. */
  pedagogyKey: string;
  /** Number of in-library modules considered (debugging / surface badging). */
  in_library_count: number;
}

const DEFAULT_LIMIT = 5;

type RawScoringModule = Omit<ScoringModule, 'capabilityThreadIds'> & {
  capabilityThreadTitles?: string[];
};

export const GET = routeHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const limit = Number(req.nextUrl.searchParams.get('limit') ?? DEFAULT_LIMIT);

  const [snapshot, settings, libraryRows, weekPlanned, recentEntries] = await Promise.all([
    db.query.familyIntelligenceSnapshots.findFirst({
      where: eq(familyIntelligenceSnapshots.familyId, family.id),
    }),
    db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, family.id),
    }),
    db
      .select({ packId: familyLibrary.sanityPackId, moduleId: familyLibrary.sanityModuleId })
      .from(familyLibrary)
      .where(and(eq(familyLibrary.familyId, family.id), isNull(familyLibrary.removedAt))),
    db
      .select({ moduleId: plannerEntries.moduleId, subjects: plannerEntries.subjects })
      .from(plannerEntries)
      .where(
        and(
          eq(plannerEntries.familyId, family.id),
          gte(
            plannerEntries.date,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          ),
        ),
      ),
    db
      .select({ moduleId: learningEntries.sourceModuleId })
      .from(learningEntries)
      .where(eq(learningEntries.familyId, family.id)),
  ]);

  const packIds = libraryRows
    .map((r) => r.packId)
    .filter((id): id is string => !!id);

  const [sanityPacks, ownScoringModules] = await Promise.all([
    packIds.length > 0
      ? sanityClient.fetch<{ modules: RawScoringModule[] }[]>(SCORING_MODULES_QUERY, { packIds })
      : Promise.resolve([] as { modules: RawScoringModule[] }[]),
    sanityClient.fetch<RawScoringModule[]>(SCORING_OWN_MODULES_QUERY, { familyId: family.id }),
  ]);

  const threadCache = await getCachedThreads();
  const titleToCode = new Map<string, string>();
  for (const [code, meta] of threadCache.entries()) {
    titleToCode.set(meta.title.toLowerCase(), code);
  }

  const toScoring = (m: RawScoringModule): ScoringModule => ({
    _id: m._id,
    title: m.title,
    subjects: m.subjects ?? [],
    averageEnergyLevel: m.averageEnergyLevel ?? null,
    capabilityThreadIds: (m.capabilityThreadTitles ?? [])
      .map((t) => titleToCode.get((t ?? '').toLowerCase()))
      .filter((c): c is string => !!c),
    methodAffinity: m.methodAffinity ?? null,
  });

  const seen = new Set<string>();
  const modules: ScoringModule[] = [
    ...sanityPacks.flatMap((p) => p.modules ?? []),
    ...(ownScoringModules ?? []),
  ]
    .filter((m) => m._id && m.title)
    .filter((m) => (seen.has(m._id) ? false : (seen.add(m._id), true)))
    .map(toScoring);

  const data = snapshot?.snapshotData as unknown as SnapshotData | undefined;
  const childSnapshots: Record<string, ChildSnapshot> = data?.children ?? {};
  const plannedModuleIds = weekPlanned
    .map((p) => p.moduleId)
    .filter((id): id is string => id != null);
  const completedModuleCounts: Record<string, number> = {};
  for (const e of recentEntries) {
    if (e.moduleId) {
      completedModuleCounts[e.moduleId] = (completedModuleCounts[e.moduleId] ?? 0) + 1;
    }
  }
  const weekSubjects = new Set(weekPlanned.flatMap((p) => p.subjects ?? []));

  const pedagogyContext: PedagogyContext | undefined = settings?.pedagogyPreference
    ? {
        pedagogyKey: settings.pedagogyPreference,
        values: settings.pedagogyValues ?? [],
        practices: settings.pedagogyPractices ?? [],
      }
    : undefined;

  const ranked = scoreModules(
    modules,
    childSnapshots,
    plannedModuleIds,
    completedModuleCounts,
    weekSubjects,
    pedagogyContext,
  );

  return NextResponse.json<NextResponseBody>({
    recommendations: ranked.slice(0, Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT),
    pedagogyKey: pedagogyContext?.pedagogyKey ?? 'eclectic',
    in_library_count: modules.length,
  });
}, { route: 'GET /api/snapshot/next' });
