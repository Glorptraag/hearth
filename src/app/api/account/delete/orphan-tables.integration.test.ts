/**
 * PINS A KNOWN, UNFIXED DEFECT: account deletion 500s for most real families.
 *
 * Full write-up, evidence and acceptance criteria:
 *   docs/hearth-account-deletion-defect-v1.md
 *
 * The pre-existing integration test seeds only the tables the delete route
 * already removes, so it passes while proving nothing about the other twelve.
 * Every foreign key into `families(id)` is declared `ON DELETE no action`
 * (27 of them — `grep 'REFERENCES "public"."families"' drizzle/*.sql`), so a
 * single leftover row makes the final `DELETE FROM families` raise a
 * foreign-key violation and the request 500s.
 *
 * Verified against real Postgres 2026-08-05:
 *   expected 500 to be 200
 *   cause: update or delete on table "learners" violates foreign key
 *          constraint "heu_reports_learner_id_learners_id_fk"
 *          on table "compliance_reports"
 *
 * `it.fails()` is deliberate rather than `.skip`. It keeps CI green while the
 * defect stands, but the moment someone fixes the route this test FAILS and
 * forces them here — a skipped test would just rot. When you fix it: flip
 * `it.fails` to `it`, and add the coverage assertions listed in the defect doc.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry, createLoggerDraft } from '@/test/db-factories';
import {
  entitlements,
  invitations,
  customThreads,
  moduleRuns,
  familyPackState,
  familyLibraryState,
  badgeDefinitions,
  complianceReports,
} from '@/lib/db/schema';
import { POST } from './route';

function jsonReq(body: unknown) {
  return new NextRequest('http://x/api/account/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * A family carrying rows in tables the delete route never touches. None of
 * this is exotic — a family that has been invited, run a module, bought a
 * pack or generated a report is in this state.
 */
async function seedFamilyWithOrphanRows() {
  const clerkUserId = `user_${randomUUID()}`;
  const family = await createFamily(db, { clerkUserId });
  const learner = await createLearner(db, { familyId: family.id });
  await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

  await db.insert(entitlements).values({
    familyId: family.id,
    sanityPackId: 'pack-1',
    stripeSessionId: `cs_${randomUUID()}`,
    amountCents: 1900,
  });
  await db.insert(invitations).values({
    code: randomUUID().slice(0, 8),
    intendedFamilyName: 'Test Family',
    createdByAdminId: `admin_${randomUUID()}`,
    redeemedByFamilyId: family.id,
  });
  await db.insert(customThreads).values({
    // Application-supplied text PK — no DB default on this table.
    id: `thread_${randomUUID()}`,
    familyId: family.id,
    createdByUserId: clerkUserId,
    name: 'Bushcraft',
  });
  await db.insert(moduleRuns).values({ familyId: family.id, sanityModuleId: 'mod-1' });
  await db.insert(familyPackState).values({ familyId: family.id, sanityPackId: 'pack-1' });
  await db.insert(familyLibraryState).values({ familyId: family.id, pinnedAtVersion: '2.0.0' });
  await db.insert(badgeDefinitions).values({ familyId: family.id, title: 'Explorer' });
  await createLoggerDraft(db, { clerkUserId, familyId: family.id });
  await db.insert(complianceReports).values({
    familyId: family.id,
    learnerId: learner.id,
    reportYear: 2026,
  });

  return { clerkUserId, family, learner };
}

describe('POST /api/account/delete — tables outside the original cascade', () => {
  it.fails(
    'KNOWN DEFECT: 500s for a family with entitlements, runs, invitations or reports',
    async () => {
      const { clerkUserId } = await seedFamilyWithOrphanRows();
      asUser({ userId: clerkUserId });

      const res = await POST(jsonReq({ confirmation: 'DELETE MY ACCOUNT' }));

      // Currently 500 — a foreign-key violation from one of the 27
      // `ON DELETE no action` constraints. Both stores require working
      // deletion (Apple 5.1.1(v), Play data deletion policy), so this blocks
      // submission as well as being a live bug.
      expect(res.status).toBe(200);
    },
  );
});
