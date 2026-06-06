/**
 * Integration test for /api/entries — exercises the auth → DB → response
 * chain against a real Neon test branch. Family isolation is the class of
 * bug unit tests cannot catch reliably; this is the test that justifies
 * the integration platform existing.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut, asViewer } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { familyMembers, learningEntries, learningEntryEvidence, moduleRuns, plannerEntries } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { GET, POST } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../vitest.setup';

function jsonReq(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function getReq(url: string) {
  return new NextRequest(url);
}

describe('POST /api/entries — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST(jsonReq('http://x/api/entries', { title: 'Anything' }));
    expect(res.status).toBe(401);
  });

  it('returns 404 when the caller has no family row', async () => {
    asUser({});
    const res = await POST(jsonReq('http://x/api/entries', { title: 'Anything' }));
    expect(res.status).toBe(404);
  });

  it('writes a draft entry scoped to the caller’s family', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(
      jsonReq('http://x/api/entries', { title: 'Magnetic circuit', status: 'draft' })
    );
    expect(res.status).toBe(201);

    const rows = await db
      .select()
      .from(learningEntries)
      .where(eq(learningEntries.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Magnetic circuit');
    expect(rows[0].familyId).toBe(TEST_FAMILY_ID);
  });

  it('rejects writes from a viewer role with 403', async () => {
    // Owner is someone else; the test user is only a viewer member, so the
    // route's checkWritePermission should refuse the write.
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: 'user_owner_xyz' });
    await db.insert(familyMembers).values({
      familyId: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      email: 'viewer@example.com',
      role: 'viewer',
      status: 'active',
    });
    asViewer({});

    const res = await POST(jsonReq('http://x/api/entries', { title: 'Forbidden' }));
    expect(res.status).toBe(403);

    const rows = await db
      .select()
      .from(learningEntries)
      .where(eq(learningEntries.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(0);
  });
});

describe('POST /api/entries — activity-level source fields (workstream D)', () => {
  it('persists sourceActivityIds and sourceApproachId from the module-runner Log mode', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(
      jsonReq('http://x/api/entries', {
        title: 'Module: Rocks and density',
        status: 'draft',
        source: 'module_log',
        sourceModuleId: 'module.rocks-density',
        sourceApproachId: 'approach.kinesthetic',
        sourceActivityIds: ['activity.observe', 'activity.test'],
      })
    );
    expect(res.status).toBe(201);

    const rows = await db
      .select()
      .from(learningEntries)
      .where(eq(learningEntries.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(1);
    expect(rows[0].sourceModuleId).toBe('module.rocks-density');
    expect(rows[0].sourceApproachId).toBe('approach.kinesthetic');
    expect(rows[0].sourceActivityIds).toEqual([
      'activity.observe',
      'activity.test',
    ]);
  });

  it('defaults sourceActivityIds to [] when omitted', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(
      jsonReq('http://x/api/entries', { title: 'Plain entry', status: 'draft' })
    );
    expect(res.status).toBe(201);

    const rows = await db
      .select()
      .from(learningEntries)
      .where(eq(learningEntries.familyId, TEST_FAMILY_ID));
    expect(rows[0].sourceActivityIds).toEqual([]);
    expect(rows[0].sourceApproachId).toBeNull();
  });
});

describe('POST /api/entries — evidence dual-write', () => {
  it('writes caption-carrying evidence rows that GET attaches', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(
      jsonReq('http://x/api/entries', {
        title: 'Self-portrait',
        status: 'draft',
        evidenceUrls: ['evidence/fam/1.jpg'],
        evidence: [
          { kind: 'photo', content: 'evidence/fam/1.jpg', caption: 'Her first self-portrait' },
        ],
      })
    );
    expect(res.status).toBe(201);
    const created = (await res.json()) as { id: string };

    const rows = await db
      .select()
      .from(learningEntryEvidence)
      .where(eq(learningEntryEvidence.entryId, created.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('photo');
    expect(rows[0].content).toBe('evidence/fam/1.jpg');
    expect(rows[0].caption).toBe('Her first self-portrait');

    // GET attaches the rows alongside the legacy evidenceUrls column.
    const listRes = await GET(getReq('http://x/api/entries'));
    const list = (await listRes.json()) as Array<{
      id: string;
      evidence: { caption: string | null }[];
    }>;
    const entry = list.find((e) => e.id === created.id)!;
    expect(entry.evidence).toHaveLength(1);
    expect(entry.evidence[0].caption).toBe('Her first self-portrait');
  });

  it('synthesises photo rows from evidenceUrls when evidence is omitted (legacy callers)', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(
      jsonReq('http://x/api/entries', {
        title: 'Legacy caller',
        status: 'draft',
        evidenceUrls: ['evidence/fam/a.jpg', 'evidence/fam/b.jpg'],
      })
    );
    expect(res.status).toBe(201);
    const created = (await res.json()) as { id: string };

    const rows = await db
      .select()
      .from(learningEntryEvidence)
      .where(eq(learningEntryEvidence.entryId, created.id));
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.kind === 'photo')).toBe(true);
    expect(rows.every((r) => r.caption === null)).toBe(true);
  });

  it('persists quote, note, and link evidence — not just photos', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(
      jsonReq('http://x/api/entries', {
        title: 'Rich evidence',
        status: 'draft',
        evidenceUrls: ['evidence/fam/1.jpg'], // photos-only legacy column
        evidence: [
          { kind: 'photo', content: 'evidence/fam/1.jpg', caption: 'Self-portrait' },
          { kind: 'quote', content: 'I drew myself!' },
          { kind: 'note', content: 'Chose her own colours' },
          { kind: 'link', content: 'https://abc.net.au', caption: 'ABC Splash' },
        ],
      })
    );
    expect(res.status).toBe(201);
    const created = (await res.json()) as { id: string };

    // sort_order pins the parent's capture order even though all four rows
    // share created_at (one batched INSERT).
    const rows = await db
      .select()
      .from(learningEntryEvidence)
      .where(eq(learningEntryEvidence.entryId, created.id))
      .orderBy(asc(learningEntryEvidence.sortOrder));
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.kind)).toEqual(['photo', 'quote', 'note', 'link']);
    expect(rows.map((r) => r.sortOrder)).toEqual([0, 1, 2, 3]);
    expect(rows.find((r) => r.kind === 'quote')!.content).toBe('I drew myself!');
    expect(rows.find((r) => r.kind === 'note')!.content).toBe('Chose her own colours');
    const link = rows.find((r) => r.kind === 'link')!;
    expect(link.content).toBe('https://abc.net.au');
    expect(link.caption).toBe('ABC Splash');

    // evidenceUrls stays photos-only through the dual-write window.
    const [entryRow] = await db
      .select()
      .from(learningEntries)
      .where(eq(learningEntries.id, created.id));
    expect(entryRow.evidenceUrls).toEqual(['evidence/fam/1.jpg']);

    // GET attaches every kind, in capture order (driven by sort_order).
    const listRes = await GET(getReq('http://x/api/entries'));
    const list = (await listRes.json()) as Array<{ id: string; evidence: { kind: string }[] }>;
    const entry = list.find((e) => e.id === created.id)!;
    expect(entry.evidence.map((e) => e.kind)).toEqual(['photo', 'quote', 'note', 'link']);
  });
});

describe('GET /api/entries — cross-family isolation', () => {
  it('never returns another family’s entries', async () => {
    // Family A — the caller.
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learnerA = await createLearner(db, { familyId: TEST_FAMILY_ID });
    await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learnerA.id],
      title: 'A — visible',
    });

    // Family B — must NEVER appear in family A’s GET response.
    const otherFamilyId = '00000000-0000-0000-0000-00000000000b';
    await createFamily(db, { id: otherFamilyId, clerkUserId: 'user_other_xyz' });
    const learnerB = await createLearner(db, { familyId: otherFamilyId });
    await createEntry(db, {
      familyId: otherFamilyId,
      learnerIds: [learnerB.id],
      title: 'B — hidden',
    });

    asUser({});
    const res = await GET(getReq('http://x/api/entries'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ familyId: string; title: string }>;

    expect(body.every((e) => e.familyId === TEST_FAMILY_ID)).toBe(true);
    expect(body.map((e) => e.title)).toContain('A — visible');
    expect(body.map((e) => e.title)).not.toContain('B — hidden');
  });
});

describe('POST /api/entries — module_run + planner linkage (2.8)', () => {
  it('persists moduleRunId and plannerEntryId when provided', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const [run] = await db
      .insert(moduleRuns)
      .values({
        familyId: TEST_FAMILY_ID,
        sanityModuleId: 'mod-link-test',
        state: 'active',
        sessionType: 'sustained',
      })
      .returning();

    const [planner] = await db
      .insert(plannerEntries)
      .values({
        familyId: TEST_FAMILY_ID,
        date: '2026-06-03',
        title: 'Magnet exploration',
      })
      .returning();

    const res = await POST(
      jsonReq('http://x/api/entries', {
        title: 'Linked entry',
        status: 'complete',
        moduleRunId: run.id,
        plannerEntryId: planner.id,
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string };

    const [entry] = await db
      .select()
      .from(learningEntries)
      .where(eq(learningEntries.id, body.id));
    expect(entry.moduleRunId).toBe(run.id);
    expect(entry.plannerEntryId).toBe(planner.id);
  });
});
