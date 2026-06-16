#!/usr/bin/env node
/**
 * WS-4 / C2 — run the C1 tier-comparison over REAL prod pilot data and print a
 * summary so Drew can confirm or tune the D-OS4 demonstrating bar before C3.
 *
 * This replicates the logic of
 *   src/app/api/admin/analytics/tier-comparison/route.ts
 * with raw SQL (read-only SELECTs) so it can run as a one-shot script against
 * prod without standing up the Next route / admin auth. It imports the SAME
 * pure functions the route does, so the numbers it prints are exactly what the
 * admin panel would show.
 *
 * READ-ONLY. No writes. Run from a checkout whose root holds .env.local
 * (e.g. the main worktree), or point ENV_FILE at one:
 *   npx tsx scripts/ws4-c2-comparison.ts
 *   ENV_FILE=/abs/path/.env.local npx tsx scripts/ws4-c2-comparison.ts
 */
import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';

import { entryThreadIds } from '../src/lib/ai/thread-aggregation';
import { getThreadName } from '../src/lib/capability-threads';
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
} from '../src/lib/ai/thread-tier';
import type { ObservationTier } from '../src/types/capability-universe';

config({ path: process.env.ENV_FILE ?? '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set — run from a checkout with .env.local, or set ENV_FILE');
  process.exit(2);
}

// Candidate bars to compare side by side over the SAME real data.
// Tier derivation is PER TIER: a thread reaches tier T iff the DLO links AT
// tier T clear T's threshold (links do NOT roll down). So tightening a tier's
// inferred clause pushes single-mention threads toward "Not yet", not down a
// tier — which is why we show real numbers rather than guess.
const CANDIDATE_BARS: Array<{ name: string; bar: ThreadTierBar }> = [
  { name: 'DEFAULT (adopted 2026-06-13)', bar: DEFAULT_DOS4_BAR },
  {
    // Demonstrating requires corroboration: declared (module that targets it) or
    // asserted (parent confirmed) — never inference alone. emerging/developing
    // unchanged from default so the constellation stays alive for pilot families.
    name: 'TUNED-B (demonstrating = corroborated only)',
    bar: {
      emerging: { minDeclaredOrAsserted: 1, minInferredDistinctDays: 1 },
      developing: { minDeclaredOrAsserted: 1, minInferredDistinctDays: 1 },
      demonstrating: { minDeclaredOrAsserted: 1, minInferredDistinctDays: Number.MAX_SAFE_INTEGER },
    },
  },
  {
    // Humble inferred ladder: a single AI-inferred mention reads emerging;
    // developing needs 2 distinct inferred days; demonstrating 3 — OR any tier
    // reached directly by ≥1 declared/asserted (author/parent-corroborated).
    name: 'TUNED-A (humble inferred ladder 1/2/3)',
    bar: {
      emerging: { minDeclaredOrAsserted: 1, minInferredDistinctDays: 1 },
      developing: { minDeclaredOrAsserted: 1, minInferredDistinctDays: 2 },
      demonstrating: { minDeclaredOrAsserted: 1, minInferredDistinctDays: 3 },
    },
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // 1. Learners (+ family name + profileData)
  const learnerRes = await pool.query(
    `SELECT l.id, l.name, l.family_id AS "familyId", f.family_name AS "familyName", l.profile_data AS "profileData"
     FROM learners l JOIN families f ON l.family_id = f.id LIMIT 200`,
  );
  const learnerRows = learnerRes.rows as Array<{
    id: string; name: string; familyId: string; familyName: string;
    profileData: { tierOverrides?: Record<string, { tier: ObservationTier }> } | null;
  }>;

  const learnerIds = learnerRows.map((l) => l.id);
  const familyIds = [...new Set(learnerRows.map((l) => l.familyId))];

  // 2. Observation counts per (learner, thread)
  const entryRes = await pool.query(
    `SELECT learner_ids AS "learnerIds", ai_enrichment AS "aiEnrichment", thread_links AS "threadLinks"
     FROM learning_entries WHERE family_id = ANY($1::uuid[])`,
    [familyIds],
  );
  const obsByLearner = new Map<string, Map<string, { count: number; inferred: number; declared: number }>>();
  for (const id of learnerIds) obsByLearner.set(id, new Map());
  for (const entry of entryRes.rows as Array<{ learnerIds: string[] | null; aiEnrichment: unknown; threadLinks: unknown }>) {
    const threads = entryThreadIds({ aiEnrichment: entry.aiEnrichment, threadLinks: entry.threadLinks } as never);
    if (threads.length === 0) continue;
    for (const lid of entry.learnerIds ?? []) {
      const byThread = obsByLearner.get(lid);
      if (!byThread) continue;
      for (const t of threads) {
        const cur = byThread.get(t.threadId) ?? { count: 0, inferred: 0, declared: 0 };
        cur.count += 1;
        if (t.inferred) cur.inferred += 1;
        if (t.declared) cur.declared += 1;
        byThread.set(t.threadId, cur);
      }
    }
  }

  // 3. learner_dlo_status per (learner, thread)
  const statusRes = await pool.query(
    `SELECT learner_id AS "learnerId", dlo_id AS "dloId", status FROM learner_dlo_status WHERE learner_id = ANY($1::uuid[])`,
    [learnerIds],
  );
  const statusByLearner = new Map<string, Map<string, Record<string, DloStatus>>>();
  for (const row of statusRes.rows as Array<{ learnerId: string; dloId: string; status: string }>) {
    const parsed = parseDloId(row.dloId);
    if (!parsed) continue;
    const byThread = statusByLearner.get(row.learnerId) ?? new Map();
    const dlos = byThread.get(parsed.threadId) ?? {};
    dlos[row.dloId] = { status: row.status };
    byThread.set(parsed.threadId, dlos);
    statusByLearner.set(row.learnerId, byThread);
  }

  // 4. observation_dlo_links provenance + distinct-day breakdown
  const linkRes = await pool.query(
    `SELECT learner_id AS "learnerId", dlo_id AS "dloId", provenance,
            count(*)::int AS n,
            count(distinct (created_at at time zone 'UTC')::date)::int AS "distinctDays"
     FROM observation_dlo_links WHERE learner_id = ANY($1::uuid[])
     GROUP BY learner_id, dlo_id, provenance`,
    [learnerIds],
  );
  const linksByLearner = new Map<string, Map<string, SourceCountsByTier>>();
  for (const row of linkRes.rows as Array<{ learnerId: string; dloId: string; provenance: string; n: number; distinctDays: number }>) {
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
    else { ev.inferred += n; ev.inferredDistinctDays += days; }
    byTier[tier] = ev;
    byThread.set(threadId, byTier);
    linksByLearner.set(row.learnerId, byThread);
  }

  // 5. Compare — run each candidate bar over the SAME prebuilt maps.
  const COUNT_TIERS = ['emerging', 'developing', 'demonstrating'] as const;

  function runForBar(name: string, bar: ThreadTierBar) {
    const summary = { total: 0, higher: 0, lower: 0, same: 0, countInflated: 0, derivedDark: 0 };
    const dramatic: Array<{ learner: string; family: string; threadId: string; threadName: string; countTier: string; derivedTier: string | null; observationCount: number; sourceCounts: SourceCountsByTier }> = [];

    const matrix: Record<string, Record<string, number>> = {};
    for (const r of COUNT_TIERS) { matrix[r] = { null: 0, emerging: 0, developing: 0, demonstrating: 0 }; }

    let demViaDeclared = 0, demViaInferredOnly = 0;
    let devViaDeclared = 0, devViaInferredOnly = 0;
    let learnersWithDloData = 0;
    let learnersTotal = 0;

    for (const learner of learnerRows) {
      learnersTotal += 1;
      const obs = obsByLearner.get(learner.id) ?? new Map();
      const statusThreads = statusByLearner.get(learner.id) ?? new Map<string, Record<string, DloStatus>>();
      const linkThreads = linksByLearner.get(learner.id) ?? new Map<string, SourceCountsByTier>();
      if (statusThreads.size > 0 || linkThreads.size > 0) learnersWithDloData += 1;
      const overrides = learner.profileData?.tierOverrides ?? undefined;

      const threadIds = new Set<string>([...obs.keys(), ...statusThreads.keys(), ...linkThreads.keys()]);
      for (const threadId of threadIds) {
        const obsData = obs.get(threadId) ?? { count: 0, inferred: 0, declared: 0 };
        const override = overrides?.[threadId]?.tier ?? null;
        const countTier = countBasedTier(obsData.count, override);
        const dloStatuses = statusThreads.get(threadId) ?? {};
        const sourceCounts = linkThreads.get(threadId) ?? {};
        const derived = deriveThreadTierFromDlos(dloStatuses, sourceCounts, bar);
        const delta = tierDelta(countTier, derived.tier);

        summary.total += 1;
        summary[delta] += 1;
        if (derived.tier === null) summary.derivedDark += 1;
        if (derived.tier === null && countTier !== 'emerging') summary.countInflated += 1;

        matrix[countTier][derived.tier ?? 'null'] += 1;

        const clears = (tier: ObservationTier) => {
          const ev = sourceCounts[tier];
          const da = (ev?.declared ?? 0) + (ev?.asserted ?? 0);
          return { byDeclared: da >= bar[tier].minDeclaredOrAsserted, byInferred: (ev?.inferredDistinctDays ?? 0) >= bar[tier].minInferredDistinctDays };
        };
        if (derived.tier === 'demonstrating') {
          const c = clears('demonstrating');
          if (c.byDeclared) demViaDeclared += 1; else if (c.byInferred) demViaInferredOnly += 1;
        } else if (derived.tier === 'developing') {
          const c = clears('developing');
          if (c.byDeclared) devViaDeclared += 1; else if (c.byInferred) devViaInferredOnly += 1;
        }

        if (delta === 'lower') {
          dramatic.push({
            learner: learner.name, family: learner.familyName, threadId,
            threadName: getThreadName(threadId), countTier, derivedTier: derived.tier,
            observationCount: obsData.count, sourceCounts,
          });
        }
      }
    }

    const rank = (t: string | null) => (t === null ? -1 : t === 'emerging' ? 0 : t === 'developing' ? 1 : 2);
    dramatic.sort((a, b) => (rank(b.countTier) - rank(b.derivedTier)) - (rank(a.countTier) - rank(a.derivedTier)));

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log(`  BAR: ${name}`);
    console.log('══════════════════════════════════════════════════════════════');
    console.log(`    emerging:      ≥${bar.emerging.minDeclaredOrAsserted} declared/asserted OR ≥${bar.emerging.minInferredDistinctDays} inferred distinct-day`);
    console.log(`    developing:    ≥${bar.developing.minDeclaredOrAsserted} declared/asserted OR ≥${bar.developing.minInferredDistinctDays} inferred distinct-day`);
    console.log(`    demonstrating: ≥${bar.demonstrating.minDeclaredOrAsserted} declared/asserted OR ≥${bar.demonstrating.minInferredDistinctDays} inferred distinct-day`);
    console.log('──────────────────────────────────────────────────────────────');
    console.log(`  Learners: ${learnersTotal} (with any DLO evidence: ${learnersWithDloData})`);
    console.log(`  (learner × thread) pairs: ${summary.total}   SAME ${summary.same} · LOWER ${summary.lower} · HIGHER ${summary.higher}`);
    console.log(`  threads going DARK (derived = Not yet): ${summary.derivedDark} · count-inflated: ${summary.countInflated}`);
    console.log('──────────────────────────────────────────────────────────────');
    console.log(`  Confusion matrix  rows = count tier, cols = DERIVED tier`);
    console.log(`                    NOT YET   emerging  developing  demonstrating`);
    for (const r of COUNT_TIERS) {
      const m = matrix[r];
      console.log(`    ${r.padEnd(14)} ${String(m.null).padStart(7)}   ${String(m.emerging).padStart(8)}  ${String(m.developing).padStart(10)}  ${String(m.demonstrating).padStart(13)}`);
    }
    console.log('──────────────────────────────────────────────────────────────');
    console.log(`  derived demonstrating: ${demViaDeclared} via declared/asserted · ${demViaInferredOnly} via inferred-only`);
    console.log(`  derived developing   : ${devViaDeclared} via declared/asserted · ${devViaInferredOnly} via inferred-only`);
  }

  for (const { name, bar } of CANDIDATE_BARS) runForBar(name, bar);
  console.log('══════════════════════════════════════════════════════════════\n');

  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
