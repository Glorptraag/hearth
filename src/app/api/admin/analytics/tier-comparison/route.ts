import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql, inArray, eq } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { routeHandler } from '@/lib/api-helpers';
import {
  learners,
  families,
  learningEntries,
  learnerDloStatus,
  observationDloLinks,
} from '@/lib/db/schema';
import { entryThreadIds } from '@/lib/ai/thread-aggregation';
import { getThreadName } from '@/lib/capability-threads';
import {
  countBasedTier,
  deriveThreadTierFromDlos,
  parseDloId,
  tierDelta,
  DEFAULT_DOS4_BAR,
  type DloStatus,
  type SourceCountsByTier,
  type TierEvidence,
  type ThreadTierBar,
} from '@/lib/ai/thread-tier';
import type { ObservationTier } from '@/types/capability-universe';

/**
 * GET /api/admin/analytics/tier-comparison
 *
 * WS-4 prep (C1). For every learner × active thread, returns the *count-based*
 * tier (today's production ladder) beside the *DLO-evidence-derived* tier under
 * a parameterised D-OS4 bar, with the delta flagged. Read-only; no prod
 * mutation, no parent-facing surface. Feeds Drew's D-OS4 confirm/tune (C2).
 *
 * Query params (all optional):
 *   familyId             — scope to one family (else all families, capped).
 *   demDeclared, demDays — the demonstrating bar knobs (declared/asserted min,
 *                          inferred distinct-day min). Default 1 / 2.
 *   devDeclared, devDays — the developing bar knobs. Default 1 / 1.
 *
 * Meaningful only after the A2/A3 backfills populate learner_dlo_status and
 * observation_dlo_links — before that, derived tiers read mostly null and the
 * deltas surface exactly the honesty gap WS-4 exists to close.
 */
const LEARNER_CAP = 200;

function clampInt(raw: string | null, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function emptySummary() {
  return { total: 0, higher: 0, lower: 0, same: 0, countInflated: 0 };
}

export const GET = routeHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const params = req.nextUrl.searchParams;
  const familyId = params.get('familyId');

  // Build the bar from defaults, overriding the demonstrating/developing knobs.
  const bar: ThreadTierBar = {
    emerging: { ...DEFAULT_DOS4_BAR.emerging },
    developing: {
      minDeclaredOrAsserted: clampInt(params.get('devDeclared'), DEFAULT_DOS4_BAR.developing.minDeclaredOrAsserted),
      minInferredDistinctDays: clampInt(params.get('devDays'), DEFAULT_DOS4_BAR.developing.minInferredDistinctDays),
    },
    demonstrating: {
      minDeclaredOrAsserted: clampInt(params.get('demDeclared'), DEFAULT_DOS4_BAR.demonstrating.minDeclaredOrAsserted),
      minInferredDistinctDays: clampInt(params.get('demDays'), DEFAULT_DOS4_BAR.demonstrating.minInferredDistinctDays),
    },
  };

  // 1. Learners (+ family name), optionally scoped to one family.
  const learnerRows = await db
    .select({
      id: learners.id,
      name: learners.name,
      familyId: learners.familyId,
      familyName: families.familyName,
      profileData: learners.profileData,
    })
    .from(learners)
    .innerJoin(families, eq(learners.familyId, families.id))
    .where(familyId ? eq(learners.familyId, familyId) : undefined)
    .limit(LEARNER_CAP);

  if (learnerRows.length === 0) {
    return NextResponse.json({
      bar,
      learners: [],
      summary: emptySummary(),
      learnerCount: 0,
      generatedAt: new Date().toISOString(),
    });
  }

  const learnerIds = learnerRows.map((l) => l.id);
  const familyIds = [...new Set(learnerRows.map((l) => l.familyId))];

  // 2. Observation counts per (learner, thread), from entries' merged thread ids.
  const entryRows = await db
    .select({
      learnerIds: learningEntries.learnerIds,
      aiEnrichment: learningEntries.aiEnrichment,
      threadLinks: learningEntries.threadLinks,
    })
    .from(learningEntries)
    .where(inArray(learningEntries.familyId, familyIds));

  // learnerId -> threadId -> { count, inferred, declared }
  const obsByLearner = new Map<string, Map<string, { count: number; inferred: number; declared: number }>>();
  for (const id of learnerIds) obsByLearner.set(id, new Map());

  for (const entry of entryRows) {
    const threads = entryThreadIds(entry);
    if (threads.length === 0) continue;
    for (const lid of entry.learnerIds ?? []) {
      const byThread = obsByLearner.get(lid);
      if (!byThread) continue; // entry tags a learner outside our (capped) set
      for (const t of threads) {
        const cur = byThread.get(t.threadId) ?? { count: 0, inferred: 0, declared: 0 };
        cur.count += 1;
        if (t.inferred) cur.inferred += 1;
        if (t.declared) cur.declared += 1;
        byThread.set(t.threadId, cur);
      }
    }
  }

  // 3. learner_dlo_status per (learner, thread), keyed by DLO id.
  const statusRows = await db
    .select({ learnerId: learnerDloStatus.learnerId, dloId: learnerDloStatus.dloId, status: learnerDloStatus.status })
    .from(learnerDloStatus)
    .where(inArray(learnerDloStatus.learnerId, learnerIds));

  // learnerId -> threadId -> { dloId: { status } }
  const statusByLearner = new Map<string, Map<string, Record<string, DloStatus>>>();
  for (const row of statusRows) {
    const parsed = parseDloId(row.dloId);
    if (!parsed) continue;
    const byThread = statusByLearner.get(row.learnerId) ?? new Map();
    const dlos = byThread.get(parsed.threadId) ?? {};
    dlos[row.dloId] = { status: row.status };
    byThread.set(parsed.threadId, dlos);
    statusByLearner.set(row.learnerId, byThread);
  }

  // 4. observation_dlo_links provenance + distinct-day breakdown, aggregated by
  //    (learner, dlo, provenance). Distinct days is per provenance group; only
  //    the inferred group's distinct days feeds the bar's inferred clause.
  const linkAgg = await db
    .select({
      learnerId: observationDloLinks.learnerId,
      dloId: observationDloLinks.dloId,
      provenance: observationDloLinks.provenance,
      n: sql<number>`count(*)::int`,
      distinctDays: sql<number>`count(distinct (${observationDloLinks.createdAt} at time zone 'UTC')::date)::int`,
    })
    .from(observationDloLinks)
    .where(inArray(observationDloLinks.learnerId, learnerIds))
    .groupBy(observationDloLinks.learnerId, observationDloLinks.dloId, observationDloLinks.provenance);

  // learnerId -> threadId -> SourceCountsByTier
  const linksByLearner = new Map<string, Map<string, SourceCountsByTier>>();
  for (const row of linkAgg) {
    const parsed = parseDloId(row.dloId);
    if (!parsed) continue;
    const { threadId, tier } = parsed;
    const byThread = linksByLearner.get(row.learnerId) ?? new Map();
    const byTier = byThread.get(threadId) ?? {};
    const ev: TierEvidence = byTier[tier] ?? { declared: 0, asserted: 0, inferred: 0, inferredDistinctDays: 0 };
    const n = Number(row.n);
    const days = Number(row.distinctDays);
    if (row.provenance === 'declared') ev.declared += n;
    else if (row.provenance === 'asserted') ev.asserted += n;
    else {
      ev.inferred += n;
      ev.inferredDistinctDays += days;
    }
    byTier[tier] = ev;
    byThread.set(threadId, byTier);
    linksByLearner.set(row.learnerId, byThread);
  }

  // 5. Per learner, compare over the union of threads that carry any evidence.
  const summary = emptySummary();
  const out = learnerRows.map((learner) => {
    const obs = obsByLearner.get(learner.id) ?? new Map<string, { count: number; inferred: number; declared: number }>();
    const statusThreads = statusByLearner.get(learner.id) ?? new Map<string, Record<string, DloStatus>>();
    const linkThreads = linksByLearner.get(learner.id) ?? new Map<string, SourceCountsByTier>();
    const overrides =
      (learner.profileData as { tierOverrides?: Record<string, { tier: ObservationTier }> } | null)
        ?.tierOverrides ?? undefined;

    const threadIds = new Set<string>([...obs.keys(), ...statusThreads.keys(), ...linkThreads.keys()]);

    const threads = [...threadIds]
      .map((threadId) => {
        const obsData = obs.get(threadId) ?? { count: 0, inferred: 0, declared: 0 };
        const override = overrides?.[threadId]?.tier ?? null;
        const countTier = countBasedTier(obsData.count, override);

        const dloStatuses = statusThreads.get(threadId) ?? {};
        const sourceCounts = linkThreads.get(threadId) ?? {};
        const derived = deriveThreadTierFromDlos(dloStatuses, sourceCounts, bar);
        const delta = tierDelta(countTier, derived.tier);

        summary.total += 1;
        summary[delta] += 1;
        // The headline honesty gap: count-based claims developing+ but DLO
        // evidence supports nothing.
        if (derived.tier === null && countTier !== 'emerging') summary.countInflated += 1;

        return {
          threadId,
          threadName: getThreadName(threadId),
          observationCount: obsData.count,
          observationSources: { inferred: obsData.inferred, declared: obsData.declared },
          override,
          countTier,
          derivedTier: derived.tier,
          delta,
          tierMet: derived.tierMet,
          statusReached: derived.statusReached,
          sourceCounts,
        };
      })
      .sort((a, b) => {
        // Deltas first (most interesting), then by observation volume.
        const rank = (d: string) => (d === 'same' ? 1 : 0);
        if (rank(a.delta) !== rank(b.delta)) return rank(a.delta) - rank(b.delta);
        return b.observationCount - a.observationCount;
      });

    return {
      learnerId: learner.id,
      learnerName: learner.name,
      familyId: learner.familyId,
      familyName: learner.familyName,
      threads,
    };
  });

  return NextResponse.json({
    bar,
    learners: out,
    summary,
    learnerCount: out.length,
    generatedAt: new Date().toISOString(),
  });
}, { route: 'GET /api/admin/analytics/tier-comparison' });
