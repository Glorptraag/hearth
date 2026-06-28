import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { familySettings, learners as learnersTable } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';
import { sanityServerClient } from '@/lib/sanity/client';
import type { ChildSnapshot, SnapshotRecommendation } from '@/types/snapshot';
import { scoreModules, summariseReasonDistribution, type ScoringModule, type PedagogyContext } from '@/lib/ai/recommend';
import { trackServer } from '@/lib/analytics/posthog-server';
import { SCORING_MODULES_QUERY, SCORING_OWN_MODULES_QUERY } from '@/lib/sanity/queries';
import { getCachedThreads } from '@/lib/ai/sanity-thread-cache';

/**
 * GET /api/snapshot/zero-state?limit=5
 *
 * "Moment to win" opener for freshly-onboarded families with no logged
 * entries yet. Blends:
 *   - family_settings.{pedagogyPreference, pedagogyValues, pedagogyPractices}
 *   - learner.profileData.interests   → become synthetic `current_sparks`
 *   - all published Sanity modules (or own-built) with methodAffinity tags
 *
 * Drives scoreModules with the pedagogyContext (so pedagogy match
 * contributes 15pts) plus synthetic spark data from interests so a few
 * activities surface as `spark_match` rather than everything being
 * `pedagogy_match`. Spec: PLAN-intelligence-refactor.md Q3.
 *
 * Task 3.9.
 */
export interface ZeroStateResponse {
  recommendations: SnapshotRecommendation[];
  pedagogyKey: string;
  synthetic_sparks: string[];
  /** True if any real synthetic signal exists (interests on any learner). */
  has_signal: boolean;
}

const DEFAULT_LIMIT = 5;
const MAX_PUBLISHED_MODULES_FETCH = 200;

type RawScoringModule = Omit<ScoringModule, 'capabilityThreadIds'> & {
  capabilityThreadTitles?: string[];
};

// Pull ALL published modules across all packs — wider than SCORING_MODULES
// (which is pack-id filtered) since a zero-state family has no library yet.
const ZERO_STATE_MODULES_QUERY = `*[_type == "pack" && status == "published"]{
  "modules": modules[@->status == "published"]->{
    _id, title, subjects,
    "capabilityThreadTitles": capabilityThreads[]->title,
    "averageEnergyLevel": approaches[0].activities[0]->energyLevel,
    methodAffinity
  }
}[0...${MAX_PUBLISHED_MODULES_FETCH}]`;

void SCORING_MODULES_QUERY; // re-exported convenience for any future fan-out

export const GET = routeHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const limit = Number(req.nextUrl.searchParams.get('limit') ?? DEFAULT_LIMIT);

  const [settings, learners, sanityPacks, ownModules] = await Promise.all([
    db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, family.id),
    }),
    db.select().from(learnersTable).where(eq(learnersTable.familyId, family.id)),
    sanityServerClient.fetch<{ modules: RawScoringModule[] }[]>(ZERO_STATE_MODULES_QUERY),
    sanityServerClient.fetch<RawScoringModule[]>(SCORING_OWN_MODULES_QUERY, { familyId: family.id }),
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
    ...(ownModules ?? []),
  ]
    .filter((m) => m._id && m.title)
    .filter((m) => (seen.has(m._id) ? false : (seen.add(m._id), true)))
    .map(toScoring);

  // Synthetic ChildSnapshot per learner — interests become current_sparks so
  // spark_match contributes alongside pedagogy_match.
  const childSnapshots: Record<string, ChildSnapshot> = {};
  const allInterests = new Set<string>();
  for (const l of learners) {
    const interests = (l.profileData as { interests?: string[] } | null)?.interests ?? [];
    for (const i of interests) allInterests.add(i);
    childSnapshots[l.id] = {
      learner_id: l.id,
      name: l.name,
      curriculum_coverage: {} as ChildSnapshot['curriculum_coverage'],
      active_threads: [],
      badge_thresholds: { ready: [], approaching: [] },
      recent_activity: {
        entries_last_7_days: 0,
        entries_last_30_days: 0,
        subjects_this_week: [],
        current_sparks: interests.map((name) => ({ name, count: 1 })),
      },
      gap_analysis: {
        underserved_subjects: [],
        suggested_focus_threads: [],
      },
      monthly_narrative: '',
    };
  }

  const pedagogyContext: PedagogyContext = {
    pedagogyKey: settings?.pedagogyPreference ?? 'eclectic',
    values: settings?.pedagogyValues ?? [],
    practices: settings?.pedagogyPractices ?? [],
  };

  const ranked = scoreModules(
    modules,
    childSnapshots,
    [],
    {},
    new Set(),
    pedagogyContext,
  );

  const slice = ranked.slice(0, Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT);
  const dist = summariseReasonDistribution(slice);
  void trackServer('recommendations_scored', family.id, {
    surface: 'zero_state',
    pedagogy_key: pedagogyContext.pedagogyKey,
    rec_count: dist.rec_count,
    spark_match_count: dist.spark_match_count,
    gap_fill_count: dist.gap_fill_count,
    pedagogy_match_count: dist.pedagogy_match_count,
    repeat_value_count: dist.repeat_value_count,
    energy_match_count: dist.energy_match_count,
    top_reason: dist.top_reason,
    top_score: dist.top_score,
  }, { familyId: family.id });

  return NextResponse.json<ZeroStateResponse>({
    recommendations: slice,
    pedagogyKey: pedagogyContext.pedagogyKey,
    synthetic_sparks: Array.from(allInterests),
    has_signal: allInterests.size > 0,
  });
}, { route: 'GET /api/snapshot/zero-state' });
