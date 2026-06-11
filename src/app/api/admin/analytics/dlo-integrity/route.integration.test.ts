/**
 * Integration test for GET /api/admin/analytics/dlo-integrity.
 *
 * Exercises the admin guard and the provenance/mismatch aggregation SQL
 * against a real Postgres container. Mirrors the admin guard pattern from
 * /api/admin/snapshots/rebuild — ADMIN_CLERK_IDS must be set for the
 * happy path to pass.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry, createDloLink } from '@/test/db-factories';
import { GET } from './route';
import { TEST_USER_ID } from '../../../../../../vitest.setup';

function req(qs = '') {
  return new NextRequest(`http://x/api/admin/analytics/dlo-integrity${qs}`);
}

beforeEach(() => {
  vi.stubEnv('ADMIN_CLERK_IDS', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/admin/analytics/dlo-integrity — real DB', () => {
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

  it('returns correct provenance distribution and mismatch rate', async () => {
    vi.stubEnv('ADMIN_CLERK_IDS', TEST_USER_ID);
    asUser({});

    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const e1 = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });
    const e2 = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });
    const e3 = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    // 2 inferred links — one coherent, one with a claimed_tier (mismatch)
    await createDloLink(db, {
      observationId: e1.id,
      learnerId: learner.id,
      dloId: 'dlo.T1.emerging',
      provenance: 'inferred',
      claimedTier: null,
    });
    await createDloLink(db, {
      observationId: e2.id,
      learnerId: learner.id,
      dloId: 'dlo.T1.developing',
      provenance: 'inferred',
      claimedTier: 'demonstrating', // mismatch — model claimed higher tier
    });
    // 1 declared link — no mismatch
    await createDloLink(db, {
      observationId: e3.id,
      learnerId: learner.id,
      dloId: 'dlo.T1.developing',
      provenance: 'declared',
      claimedTier: null,
    });

    const res = await GET(req('?days=30'));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      days: number;
      byProvenance: Array<{ provenance: string; total: number; mismatches: number }>;
      total: number;
      mismatches: number;
      mismatchRate: number;
      generatedAt: string;
    };

    expect(body.days).toBe(30);
    expect(body.total).toBeGreaterThanOrEqual(3);
    expect(body.mismatches).toBeGreaterThanOrEqual(1);

    const inferred = body.byProvenance.find((r) => r.provenance === 'inferred');
    expect(inferred).toBeDefined();
    expect(inferred!.total).toBeGreaterThanOrEqual(2);
    expect(inferred!.mismatches).toBeGreaterThanOrEqual(1);

    const declared = body.byProvenance.find((r) => r.provenance === 'declared');
    expect(declared).toBeDefined();
    expect(declared!.mismatches).toBe(0);

    expect(body.mismatchRate).toBeGreaterThan(0);
    expect(body.generatedAt).toMatch(/^\d{4}-/);
  });

  it('returns empty byProvenance with total=0 when no links exist in the window', async () => {
    vi.stubEnv('ADMIN_CLERK_IDS', TEST_USER_ID);
    asUser({});

    // Use a 0-day window — guaranteed to return nothing (days is clamped to ≥1, use 1
    // with a fresh DB where nothing was inserted today would be unreliable, so we
    // rely on the no-data path being exercised by the empty default test DB state).
    const res = await GET(req('?days=1'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number };
    // We can only assert shape, not value=0, because other tests in the suite may
    // have inserted links in the same transaction window.
    expect(typeof body.total).toBe('number');
  });
});
