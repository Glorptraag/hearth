/**
 * Example: integration test template.
 *
 * This file exists so you can see the pattern. Delete it and write real
 * tests when you're ready. The shape of the test is what matters:
 *
 *   1. Real DB (from the globalSetup)
 *   2. Mocked Clerk via clerk-helpers
 *   3. DB-aware factories seed real rows
 *   4. Handler is called directly, response is asserted on
 *
 * Convention: *.integration.test.ts extension so vitest.integration.config.ts
 * picks them up. The unit config (vitest.config.ts) excludes this extension.
 */
import { describe, it, expect } from 'vitest';
import { asUser, asOtherFamily } from '@/test/clerk-helpers';

// Real DB client. NOT mocked in integration config.
// import { db } from '@/lib/db';
// import { createFamily, createLearner, createEntry } from '@/test/db-factories';

// The handler under test. Import path depends on your app.
// import { GET, POST } from '@/app/api/entries/route';

describe.skip('INTEGRATION: POST /api/entries — real DB', () => {
  it('inserts an entry that belongs to the caller\'s family', async () => {
    // Given: a real family in the DB, authed as its owner
    // const { userId, familyId } = asUser({});
    // const family = await createFamily(db, { id: familyId, clerkUserId: userId });
    // const learner = await createLearner(db, { familyId: family.id });

    // When: we POST an entry
    // const req = new Request('http://localhost/api/entries', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     title: 'Built a magnetic circuit',
    //     learnerIds: [learner.id],
    //   }),
    //   headers: { 'Content-Type': 'application/json' },
    // });
    // const res = await POST(req);

    // Then: the entry is in the DB, scoped to the caller's family
    // expect(res.status).toBe(201);
    // const rows = await db.select().from(learningEntries).where(eq(learningEntries.familyId, family.id));
    // expect(rows).toHaveLength(1);
    // expect(rows[0].title).toBe('Built a magnetic circuit');
    expect(true).toBe(true);
  });

  it("never returns another family's entries", async () => {
    // Given: two families with entries in the DB
    // const famA = await createFamily(db, { id: 'fam_a', clerkUserId: 'user_a' });
    // const famB = await createFamily(db, { id: 'fam_b', clerkUserId: 'user_b' });
    // await createEntry(db, { familyId: famA.id, title: 'Private to A' });
    // await createEntry(db, { familyId: famB.id, title: 'Private to B' });

    // When: user_b fetches entries
    // asUser({ userId: 'user_b', familyId: 'fam_b' });
    // const req = new Request('http://localhost/api/entries', { method: 'GET' });
    // const res = await GET(req);

    // Then: only fam_b's entries are returned
    // const body = await res.json();
    // expect(body.entries).toHaveLength(1);
    // expect(body.entries[0].title).toBe('Private to B');
    asOtherFamily(); // silences unused-import lint when commented code is uncommented
    expect(true).toBe(true);
  });

  it('applies migrations correctly on a fresh branch', async () => {
    // This test's real value: if migrations are broken, the branch creation
    // step fails before any test runs, and CI gives a clear error about the
    // migration, not a mysterious runtime failure. The test body itself can
    // just be a smoke check that the expected tables exist.
    //
    // const tables = await db.execute(
    //   sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    // );
    // const names = tables.rows.map((r) => r.tablename);
    // expect(names).toContain('families');
    // expect(names).toContain('learning_entries');
    expect(true).toBe(true);
  });
});
