/**
 * Integration tests for GET /api/admin/feedback — the admin triage read of
 * the pilot feedback channel. The admin guard is the load-bearing piece, so
 * it is exercised against a real Neon test branch, not mocked. Capture is
 * tested separately in ../feedback/route.integration.test.ts.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { feedback } from '@/lib/db/schema';
import { createFamily } from '@/test/db-factories';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';
import { GET } from './route';

function getReq(url = 'http://x/api/admin/feedback') {
  return new NextRequest(url);
}

async function seedFeedback() {
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  await db.insert(feedback).values([
    { familyId: TEST_FAMILY_ID, userId: TEST_USER_ID, category: 'bug', message: 'Draft vanished after closing the app.', route: '/log' },
    { familyId: TEST_FAMILY_ID, userId: TEST_USER_ID, category: 'praise', message: 'The report export saved my week.' },
    { familyId: TEST_FAMILY_ID, userId: TEST_USER_ID, category: 'idea', message: 'Could the planner show hearth sessions?' },
  ]);
}

beforeEach(() => {
  // Default: caller is NOT an admin. Tests that need admin opt in.
  vi.stubEnv('ADMIN_CLERK_IDS', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/admin/feedback — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await (GET as (r: NextRequest) => Promise<Response>)(getReq());
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not in ADMIN_CLERK_IDS', async () => {
    asUser({});
    const res = await (GET as (r: NextRequest) => Promise<Response>)(getReq());
    expect(res.status).toBe(403);
  });

  it('returns all feedback rows for an admin, newest first', async () => {
    vi.stubEnv('ADMIN_CLERK_IDS', TEST_USER_ID);
    asUser({});
    await seedFeedback();

    const res = await (GET as (r: NextRequest) => Promise<Response>)(getReq());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { entries: Array<{ category: string; createdAt: string }> };
    expect(body.entries).toHaveLength(3);
    // createdAt is non-increasing (newest first).
    const times = body.entries.map((e) => new Date(e.createdAt).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it('filters by category', async () => {
    vi.stubEnv('ADMIN_CLERK_IDS', TEST_USER_ID);
    asUser({});
    await seedFeedback();

    const res = await (GET as (r: NextRequest) => Promise<Response>)(
      getReq('http://x/api/admin/feedback?category=bug'),
    );
    const body = (await res.json()) as { entries: Array<{ category: string; message: string }> };
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0].category).toBe('bug');
  });

  it('ignores an unknown category filter (returns all)', async () => {
    vi.stubEnv('ADMIN_CLERK_IDS', TEST_USER_ID);
    asUser({});
    await seedFeedback();

    const res = await (GET as (r: NextRequest) => Promise<Response>)(
      getReq('http://x/api/admin/feedback?category=rant'),
    );
    const body = (await res.json()) as { entries: unknown[] };
    expect(body.entries).toHaveLength(3);
  });
});
