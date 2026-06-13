/**
 * Integration test for GET /api/admin/analytics/tier-comparison (C1, WS-4 prep).
 *
 * Exercises the admin guard plus the three real aggregations against a Postgres
 * container: observation counts (from entry thread evidence), learner_dlo_status,
 * and the observation_dlo_links provenance/distinct-day rollup — then the
 * count-based vs DLO-derived tier comparison. Mirrors the dlo-integrity route
 * test's guard pattern; ADMIN_CLERK_IDS must be set for the happy paths.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { learnerDloStatus } from '@/lib/db/schema';
import { createFamily, createLearner, createEntry, createDloLink } from '@/test/db-factories';
import { GET } from './route';
import { TEST_USER_ID } from '../../../../../../vitest.setup';

function req(qs = '') {
  return new NextRequest(`http://x/api/admin/analytics/tier-comparison${qs}`);
}

interface ThreadRow {
  threadId: string;
  observationCount: number;
  countTier: string;
  derivedTier: string | null;
  delta: 'higher' | 'lower' | 'same';
}
interface Body {
  bar: Record<string, { minDeclaredOrAsserted: number; minInferredDistinctDays: number }>;
  learners: Array<{ learnerId: string; threads: ThreadRow[] }>;
  summary: { total: number; higher: number; lower: number; same: number; countInflated: number };
  learnerCount: number;
}

// 8 inferred observations of a thread → count-based 'demonstrating'.
async function eightObservations(familyId: string, learnerId: string, threadId: string) {
  const entries = [];
  for (let i = 0; i < 8; i++) {
    entries.push(
      await createEntry(db, {
        familyId,
        learnerIds: [learnerId],
        status: 'complete',
        aiEnrichment: { status: 'enriched', capability_threads: [{ thread_id: threadId, confidence: 0.9 }] },
      }),
    );
  }
  return entries;
}

beforeEach(() => {
  vi.stubEnv('ADMIN_CLERK_IDS', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/admin/analytics/tier-comparison — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not in ADMIN_CLERK_IDS', async () => {
    asUser({});
    const res = await GET(req());
    expect(res.status).toBe(403);
  });

  it('flags count-inflation: count says demonstrating, DLO evidence supports nothing', async () => {
    vi.stubEnv('ADMIN_CLERK_IDS', TEST_USER_ID);
    asUser({});

    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entries = await eightObservations(family.id, learner.id, 'M1');

    // Three inferred links to the demonstrating DLO, all on the same day →
    // inferredDistinctDays = 1, below the default bar of 2 → derived = null.
    for (let i = 0; i < 3; i++) {
      await createDloLink(db, {
        observationId: entries[i].id,
        learnerId: learner.id,
        dloId: 'dlo.M1.demonstrating',
        tier: 'demonstrating',
        provenance: 'inferred',
      });
    }

    const res = await GET(req(`?familyId=${family.id}`));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Body;

    const m1 = body.learners[0].threads.find((t) => t.threadId === 'M1');
    expect(m1).toBeDefined();
    expect(m1!.observationCount).toBe(8);
    expect(m1!.countTier).toBe('demonstrating');
    expect(m1!.derivedTier).toBeNull();
    expect(m1!.delta).toBe('lower');
    expect(body.summary.countInflated).toBeGreaterThanOrEqual(1);
  });

  it('agrees (same) when a declared demonstrating link backs the count tier', async () => {
    vi.stubEnv('ADMIN_CLERK_IDS', TEST_USER_ID);
    asUser({});

    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entries = await eightObservations(family.id, learner.id, 'L1');

    // One declared link to the demonstrating DLO → clears the bar regardless of days.
    await createDloLink(db, {
      observationId: entries[0].id,
      learnerId: learner.id,
      dloId: 'dlo.L1.demonstrating',
      tier: 'demonstrating',
      provenance: 'declared',
    });
    // A reached status row corroborates (not required by the default bar).
    await db.insert(learnerDloStatus).values({
      learnerId: learner.id,
      dloId: 'dlo.L1.demonstrating',
      status: 'demonstrating',
      confidence: '0.9',
    });

    const res = await GET(req(`?familyId=${family.id}`));
    const body = (await res.json()) as Body;

    const l1 = body.learners[0].threads.find((t) => t.threadId === 'L1');
    expect(l1).toBeDefined();
    expect(l1!.countTier).toBe('demonstrating');
    expect(l1!.derivedTier).toBe('demonstrating');
    expect(l1!.delta).toBe('same');
  });

  it('a stricter bar via query param can drop a tier (D-OS4 tuning)', async () => {
    vi.stubEnv('ADMIN_CLERK_IDS', TEST_USER_ID);
    asUser({});

    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entries = await eightObservations(family.id, learner.id, 'S1');

    // One declared demonstrating link → meets the default bar (≥1)...
    await createDloLink(db, {
      observationId: entries[0].id,
      learnerId: learner.id,
      dloId: 'dlo.S1.demonstrating',
      tier: 'demonstrating',
      provenance: 'declared',
    });

    const def = (await (await GET(req(`?familyId=${family.id}`))).json()) as Body;
    expect(def.learners[0].threads.find((t) => t.threadId === 'S1')!.derivedTier).toBe('demonstrating');
    expect(def.bar.demonstrating.minDeclaredOrAsserted).toBe(1);

    // ...but raising the bar to ≥2 declared/asserted demotes it to null.
    const strict = (await (await GET(req(`?familyId=${family.id}&demDeclared=2`))).json()) as Body;
    expect(strict.bar.demonstrating.minDeclaredOrAsserted).toBe(2);
    expect(strict.learners[0].threads.find((t) => t.threadId === 'S1')!.derivedTier).toBeNull();
  });

  it('returns an empty shape when no learners match the family filter', async () => {
    vi.stubEnv('ADMIN_CLERK_IDS', TEST_USER_ID);
    asUser({});

    const res = await GET(req('?familyId=00000000-0000-0000-0000-000000000000'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Body;
    expect(body.learnerCount).toBe(0);
    expect(body.learners).toEqual([]);
    expect(body.summary.total).toBe(0);
  });
});
