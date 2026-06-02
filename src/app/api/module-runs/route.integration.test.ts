/**
 * Integration test for /api/module-runs — exercises the auth → DB → response
 * chain against a real Neon test branch. Covers the state machine, the
 * sustained vs open_ended divergence, and the GET ?state=active filter.
 *
 * Task 2.9 (Phase 2 test sweep).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily } from '@/test/db-factories';
import { moduleRuns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GET, POST } from './route';
import { PATCH } from './[id]/route';
import { POST as FINISH } from './[id]/finish/route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../vitest.setup';

function jsonReq(url: string, body: unknown, method: 'POST' | 'PATCH' = 'POST') {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function getReq(url: string) {
  return new NextRequest(url);
}

describe('POST /api/module-runs — feature flag', () => {
  it('returns 503 when MODULE_RUNS_ENABLED is unset', async () => {
    vi.stubEnv('MODULE_RUNS_ENABLED', '');
    asUser({});
    const res = await POST(jsonReq('http://x/api/module-runs', { sanityModuleId: 'm-1' }));
    expect(res.status).toBe(503);
    vi.unstubAllEnvs();
  });
});

describe('module_runs lifecycle — sustained', () => {
  beforeEach(() => vi.stubEnv('MODULE_RUNS_ENABLED', '1'));
  afterEach(() => vi.unstubAllEnvs());

  it('start → patch (materials) → finish leaves a row in the finished state', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    // Start
    const startRes = await POST(
      jsonReq('http://x/api/module-runs', {
        sanityModuleId: 'mod-baking-lab',
        sessionType: 'sustained',
        learnerIds: [],
      }),
    );
    expect(startRes.status).toBe(201);
    const run = (await startRes.json()) as { id: string; state: string };
    expect(run.state).toBe('active');

    // Patch — update materials checklist
    const patchRes = await PATCH(
      jsonReq(
        `http://x/api/module-runs/${run.id}`,
        { materialsState: { flour: { haveIt: true, source: 'home' } } },
        'PATCH',
      ),
      { params: Promise.resolve({ id: run.id }) },
    );
    expect(patchRes.status).toBe(200);

    // Finish
    const finishRes = await FINISH(
      jsonReq(`http://x/api/module-runs/${run.id}/finish`, {}, 'POST'),
      { params: Promise.resolve({ id: run.id }) },
    );
    expect(finishRes.status).toBe(200);

    // Verify final state
    const [row] = await db.select().from(moduleRuns).where(eq(moduleRuns.id, run.id));
    expect(row.state).toBe('finished');
    expect(row.finishedAt).toBeTruthy();
    expect((row.materialsState as Record<string, { haveIt: boolean }>)?.flour?.haveIt).toBe(true);
  });

  it('rejects pause on a sustained run with 422', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const startRes = await POST(
      jsonReq('http://x/api/module-runs', {
        sanityModuleId: 'mod-baking-lab',
        sessionType: 'sustained',
      }),
    );
    const run = (await startRes.json()) as { id: string };

    const patchRes = await PATCH(
      jsonReq(`http://x/api/module-runs/${run.id}`, { state: 'paused' }, 'PATCH'),
      { params: Promise.resolve({ id: run.id }) },
    );
    expect(patchRes.status).toBe(422);
  });
});

describe('module_runs lifecycle — open_ended pause + resume', () => {
  beforeEach(() => vi.stubEnv('MODULE_RUNS_ENABLED', '1'));
  afterEach(() => vi.unstubAllEnvs());

  it('start → pause → resume keeps the same row id', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const startRes = await POST(
      jsonReq('http://x/api/module-runs', {
        sanityModuleId: 'mod-nature-journal',
        sessionType: 'open_ended',
      }),
    );
    const run = (await startRes.json()) as { id: string };

    // Pause (only valid for open_ended)
    const pauseRes = await PATCH(
      jsonReq(`http://x/api/module-runs/${run.id}`, { state: 'paused' }, 'PATCH'),
      { params: Promise.resolve({ id: run.id }) },
    );
    expect(pauseRes.status).toBe(200);
    const paused = (await pauseRes.json()) as { id: string; state: string };
    expect(paused.id).toBe(run.id);
    expect(paused.state).toBe('paused');

    // Resume — paused → active
    const resumeRes = await PATCH(
      jsonReq(`http://x/api/module-runs/${run.id}`, { state: 'active' }, 'PATCH'),
      { params: Promise.resolve({ id: run.id }) },
    );
    expect(resumeRes.status).toBe(200);
    const resumed = (await resumeRes.json()) as { id: string; state: string };
    expect(resumed.id).toBe(run.id);
    expect(resumed.state).toBe('active');
  });

  it('rejects active → active no-op transitions cleanly (still 200)', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const startRes = await POST(
      jsonReq('http://x/api/module-runs', {
        sanityModuleId: 'mod-x',
        sessionType: 'open_ended',
      }),
    );
    const run = (await startRes.json()) as { id: string };

    // Setting state to its current value should pass the transition check
    // (same-state branch is skipped in the route).
    const noopRes = await PATCH(
      jsonReq(`http://x/api/module-runs/${run.id}`, { state: 'active' }, 'PATCH'),
      { params: Promise.resolve({ id: run.id }) },
    );
    expect(noopRes.status).toBe(200);
  });
});

describe('GET /api/module-runs — state filter + cross-family isolation', () => {
  beforeEach(() => vi.stubEnv('MODULE_RUNS_ENABLED', '1'));
  afterEach(() => vi.unstubAllEnvs());

  it('filters by state=active and never crosses family boundaries', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    // One active, one finished — both for my family.
    await db.insert(moduleRuns).values([
      {
        familyId: TEST_FAMILY_ID,
        sanityModuleId: 'mine-active',
        state: 'active',
        sessionType: 'sustained',
      },
      {
        familyId: TEST_FAMILY_ID,
        sanityModuleId: 'mine-finished',
        state: 'finished',
        sessionType: 'sustained',
      },
    ]);

    // Other family — never visible.
    const otherFamilyId = '00000000-0000-0000-0000-00000000000c';
    await createFamily(db, { id: otherFamilyId, clerkUserId: 'user_other_runs' });
    await db.insert(moduleRuns).values({
      familyId: otherFamilyId,
      sanityModuleId: 'theirs-active',
      state: 'active',
      sessionType: 'sustained',
    });

    const res = await GET(getReq('http://x/api/module-runs?state=active'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ familyId: string; sanityModuleId: string }>;
    expect(body.every((r) => r.familyId === TEST_FAMILY_ID)).toBe(true);
    expect(body.map((r) => r.sanityModuleId)).toContain('mine-active');
    expect(body.map((r) => r.sanityModuleId)).not.toContain('mine-finished');
    expect(body.map((r) => r.sanityModuleId)).not.toContain('theirs-active');
  });
});
