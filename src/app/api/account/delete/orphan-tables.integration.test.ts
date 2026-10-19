/**
 * Account deletion covers EVERY foreign key into `families` — the regression
 * pin for docs/hearth-account-deletion-defect-v1.md (formerly an `it.fails`).
 *
 * The seed below is checked against the Postgres catalog before the delete:
 * every FK column into `families` must hold a row for the family. A new table
 * that references `families` therefore fails this test until it is both
 * seeded here and handled by `src/lib/account/delete.ts` — the class of bug
 * that left 27 `ON DELETE no action` constraints unhandled can't recur
 * silently.
 */
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { del, list } from '@vercel/blob';
import { eq, inArray } from 'drizzle-orm';
import { asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry, createLoggerDraft } from '@/test/db-factories';
import {
  aiPipelineLogs,
  badgeAssessmentLogs,
  badgeAwards,
  badgeDefinitions,
  complianceReports,
  customThreads,
  deviceTokens,
  entitlements,
  facilitatorNotes,
  families,
  familyIntelligenceSnapshots,
  familyLibrary,
  familyLibraryState,
  familyMembers,
  familyPackState,
  familySettings,
  feedback,
  hearthInvites,
  hearthMemberships,
  hearthSessions,
  hearths,
  invitations,
  learnerDloStatus,
  learners,
  learningEntryEvidence,
  libraryUpgradeEvents,
  moduleDrafts,
  moduleRuns,
  notifications,
  observationDloLinks,
  plannerEntries,
  providerCodes,
  sessionAttendance,
  sessionEvidence,
  sessionReflections,
  suggestedObservations,
  workSampleAnnotations,
  workSamples,
} from '@/lib/db/schema';
import { POST } from './route';
import { deleteUser, deletedBlobRefs, installAccountDeletionDoubles, referencesTo } from './test-support';

installAccountDeletionDoubles();

function jsonReq(body: unknown) {
  return new NextRequest('http://x/api/account/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const LEGACY_BLOB_URL = 'https://store1.public.blob.vercel-storage.com/evidence/legacy-photo.jpg';
const PASTED_LINK = 'https://example.com/a-lovely-article';

/**
 * Family F (the deleter, sole adult) with rows in every table that references
 * `families`, plus another family G sharing community Hearths with it.
 */
async function seedEverywhere() {
  const clerkUserId = `user_${randomUUID()}`;
  const family = await createFamily(db, { clerkUserId });
  const other = await createFamily(db, { clerkUserId: `user_${randomUUID()}` });
  const learner = await createLearner(db, { familyId: family.id });
  const otherLearner = await createLearner(db, { familyId: other.id });
  const F = family.id;
  const G = other.id;

  // ── Family-scoped ──
  const [run] = await db.insert(moduleRuns).values({ familyId: F, sanityModuleId: 'mod-1' }).returning();
  const [plan] = await db
    .insert(plannerEntries)
    .values({ familyId: F, date: '2026-10-01', title: 'Nature walk' })
    .returning();
  const photoPath = `evidence/${F}/1700000000000-abc.jpg`;
  const entry = await createEntry(db, {
    familyId: F,
    learnerIds: [learner.id],
    evidenceUrls: [LEGACY_BLOB_URL],
    moduleRunId: run.id,
    plannerEntryId: plan.id,
  });
  await db.insert(learningEntryEvidence).values([
    { entryId: entry.id, kind: 'photo', content: photoPath },
    { entryId: entry.id, kind: 'link', content: PASTED_LINK },
  ]);
  await db.insert(observationDloLinks).values({ observationId: entry.id, learnerId: learner.id, dloId: 'dlo-1', tier: 'emerging' });
  await db.insert(learnerDloStatus).values({ learnerId: learner.id, dloId: 'dlo-1', status: 'emerging', sourceObservationId: entry.id });

  await db.insert(familySettings).values({ familyId: F, state: 'QLD' });
  await db.insert(familyIntelligenceSnapshots).values({ familyId: F });
  await db.insert(aiPipelineLogs).values({ familyId: F, entryId: entry.id, modelUsed: 'haiku', inputTokens: 1, outputTokens: 1, latencyMs: 1 });
  await db.insert(notifications).values({ familyId: F, type: 'nudge', title: 'Hello' });
  await db.insert(familyLibrary).values({ familyId: F, sanityModuleId: 'mod-1' });
  await db.insert(moduleDrafts).values({ familyId: F, pathway: 'material' });
  // Invited but never joined: no Clerk identity, so not an ownership successor.
  await db.insert(familyMembers).values({ familyId: F, email: 'gran@example.com', role: 'editor', status: 'invited' });
  await db.insert(facilitatorNotes).values({ familyId: F, learnerId: learner.id, noteText: 'private' });
  const [badge] = await db.insert(badgeDefinitions).values({ familyId: F, title: 'Explorer' }).returning();
  await db.insert(badgeAwards).values({ badgeDefinitionId: badge.id, learnerId: learner.id });
  await db.insert(badgeAssessmentLogs).values({ badgeDefinitionId: badge.id, learnerId: learner.id, responses: {}, outcome: 'pass' });
  const [report] = await db.insert(complianceReports).values({ familyId: F, learnerId: learner.id, reportYear: 2026 }).returning();
  const [sample] = await db.insert(workSamples).values({ reportId: report.id, slot: 'early_writing', entryId: entry.id }).returning();
  await db.insert(workSampleAnnotations).values({ workSampleId: sample.id, observations: 'Neat letters' });
  await db.insert(entitlements).values({ familyId: F, sanityPackId: 'pack-1', stripeSessionId: `cs_${randomUUID()}`, amountCents: 1900 });
  await db.insert(familyPackState).values({ familyId: F, sanityPackId: 'pack-1' });
  await db.insert(familyLibraryState).values({ familyId: F, pinnedAtVersion: '2.0.0' });
  await db.insert(libraryUpgradeEvents).values({ familyId: F, fromVersion: '1.0.0', toVersion: '2.0.0' });
  await db.insert(customThreads).values({ id: `thread_${randomUUID()}`, familyId: F, createdByUserId: clerkUserId, name: 'Bushcraft' });
  await createLoggerDraft(db, { clerkUserId, familyId: F });
  await db.insert(feedback).values({ familyId: F, userId: clerkUserId, category: 'idea', message: 'More maps' });
  await db.insert(deviceTokens).values({ familyId: F, clerkUserId, token: `tok_${randomUUID()}`, platform: 'ios' });
  const [invitation] = await db
    .insert(invitations)
    .values({ code: randomUUID().slice(0, 8), intendedFamilyName: 'F', createdByAdminId: 'admin_1', redeemedByFamilyId: F })
    .returning();
  const [providerCode] = await db
    .insert(providerCodes)
    .values({ code: randomUUID().slice(0, 8), redeemedByFamilyId: F })
    .returning();

  // ── Community ──
  // H1: F created it, G is an active member → handed to G.
  const [h1] = await db.insert(hearths).values({ name: 'Riverside', createdByFamilyId: F }).returning();
  await db.insert(hearthMemberships).values([
    { hearthId: h1.id, familyId: F, role: 'coordinator' },
    { hearthId: h1.id, familyId: G, role: 'member', invitedByFamilyId: F },
  ]);
  await db.insert(hearthInvites).values({ hearthId: h1.id, invitedByFamilyId: F, code: randomUUID(), expiresAt: new Date(Date.now() + 86_400_000) });
  const [s1] = await db.insert(hearthSessions).values({ hearthId: h1.id, title: 'Pond dip', date: '2026-10-02', facilitatorFamilyId: G }).returning();
  await db.insert(sessionAttendance).values({ sessionId: s1.id, familyId: G });

  // H2: F created it and is its only active member → deleted outright.
  const [h2] = await db.insert(hearths).values({ name: 'Solo circle', createdByFamilyId: F }).returning();
  await db.insert(hearthMemberships).values([
    { hearthId: h2.id, familyId: F, role: 'coordinator' },
    { hearthId: h2.id, familyId: G, role: 'member', status: 'left' },
  ]);
  const [s2] = await db.insert(hearthSessions).values({ hearthId: h2.id, title: 'Bark rubbing', date: '2026-10-03', facilitatorFamilyId: F }).returning();
  const h2PhotoByG = 'https://store1.public.blob.vercel-storage.com/hearth-evidence/s2/g.jpg';
  await db.insert(sessionEvidence).values({ sessionId: s2.id, uploadedByFamilyId: G, fileUrl: h2PhotoByG });
  await db.insert(sessionReflections).values({ sessionId: s2.id, familyId: G, reflectionText: 'Lovely' });

  // H3: G created it, F is a member and facilitated a session → session survives, reassigned to G.
  const [h3] = await db.insert(hearths).values({ name: 'Hilltop', createdByFamilyId: G }).returning();
  await db.insert(hearthMemberships).values([
    { hearthId: h3.id, familyId: G, role: 'coordinator' },
    { hearthId: h3.id, familyId: F, role: 'member', invitedByFamilyId: G },
  ]);
  await db.insert(hearthInvites).values({ hearthId: h3.id, invitedByFamilyId: G, code: randomUUID(), expiresAt: new Date(Date.now() + 86_400_000), usedByFamilyId: F });
  const [s3] = await db
    .insert(hearthSessions)
    .values({ hearthId: h3.id, title: 'Clay day', date: '2026-10-04', facilitatorFamilyId: F, facilitatorUserId: clerkUserId })
    .returning();
  await db.insert(sessionAttendance).values([
    { sessionId: s3.id, familyId: F },
    { sessionId: s3.id, familyId: G },
  ]);
  const s3PhotoByF = 'https://store1.public.blob.vercel-storage.com/hearth-evidence/s3/f.jpg';
  await db.insert(sessionEvidence).values({ sessionId: s3.id, uploadedByFamilyId: F, fileUrl: s3PhotoByF });
  await db.insert(sessionReflections).values([
    { sessionId: s3.id, familyId: F, reflectionText: 'Messy' },
    { sessionId: s3.id, familyId: G, reflectionText: 'Fun' },
  ]);
  await db.insert(suggestedObservations).values([
    { sessionId: s3.id, observerFamilyId: F, targetFamilyId: G, targetLearnerId: otherLearner.id, observationText: 'Shared well' },
    { sessionId: s3.id, observerFamilyId: G, targetFamilyId: F, targetLearnerId: learner.id, observationText: 'Focused', familyEntryId: entry.id },
  ]);

  return {
    clerkUserId,
    family,
    other,
    learner,
    entry,
    invitation,
    providerCode,
    h1,
    h2,
    h3,
    s1,
    s3,
    photoPath,
    h2PhotoByG,
    s3PhotoByF,
  };
}

describe('POST /api/account/delete — sole owner deletes the whole family', () => {
  it('removes every row referencing the family, hands over or deletes its Hearths, and cleans up Clerk + Blob', async () => {
    const seed = await seedEverywhere();
    const F = seed.family.id;
    const G = seed.other.id;

    // Guard: the seed must touch every FK column into `families`, or this test
    // proves nothing about the column it missed.
    const before = await referencesTo('families', [F]);
    // 35 FK columns into families as of migration 0030 — a floor, so an empty
    // catalog read can't make this test pass vacuously.
    expect(Object.keys(before).length).toBeGreaterThanOrEqual(35);
    const unseeded = Object.entries(before).filter(([, n]) => n === 0).map(([col]) => col);
    expect(unseeded).toEqual([]);

    const blobbed = `${seed.photoPath.replace(/\.jpg$/, '')}-orphan.jpg`;
    vi.mocked(list).mockResolvedValueOnce({
      blobs: [{ url: `https://store1.private.blob.vercel-storage.com/${blobbed}`, pathname: blobbed }],
      hasMore: false,
    } as never);

    asUser({ userId: seed.clerkUserId });
    const res = await POST(jsonReq({ confirmation: 'DELETE MY ACCOUNT' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true, outcome: 'family_deleted' });

    // No row anywhere still points at the family, its learners or its entries.
    const after = await referencesTo('families', [F]);
    expect(Object.entries(after).filter(([, n]) => n > 0)).toEqual([]);
    expect(Object.entries(await referencesTo('learners', [seed.learner.id])).filter(([, n]) => n > 0)).toEqual([]);
    expect(Object.entries(await referencesTo('learning_entries', [seed.entry.id])).filter(([, n]) => n > 0)).toEqual([]);
    expect(await db.select().from(families).where(eq(families.id, F))).toHaveLength(0);

    // Admin records survive without the pointer.
    const [inv] = await db.select().from(invitations).where(eq(invitations.id, seed.invitation.id));
    expect(inv.redeemedByFamilyId).toBeNull();
    const [code] = await db.select().from(providerCodes).where(eq(providerCodes.id, seed.providerCode.id));
    expect(code.redeemedByFamilyId).toBeNull();

    // H1 handed to G, who becomes its coordinator.
    const [h1] = await db.select().from(hearths).where(eq(hearths.id, seed.h1.id));
    expect(h1.createdByFamilyId).toBe(G);
    const [gInH1] = await db.select().from(hearthMemberships).where(eq(hearthMemberships.hearthId, seed.h1.id));
    expect(gInH1).toMatchObject({ familyId: G, role: 'coordinator', invitedByFamilyId: null });
    expect(await db.select().from(sessionAttendance).where(eq(sessionAttendance.sessionId, seed.s1.id))).toHaveLength(1);

    // H2 had no other active member → gone, with its sessions.
    expect(await db.select().from(hearths).where(eq(hearths.id, seed.h2.id))).toHaveLength(0);
    expect(await db.select().from(hearthMemberships).where(eq(hearthMemberships.hearthId, seed.h2.id))).toHaveLength(0);
    expect(await db.select().from(hearthSessions).where(eq(hearthSessions.hearthId, seed.h2.id))).toHaveLength(0);

    // H3 is G's; F's session survives under G, with G's attendance and reflection intact.
    const [s3] = await db.select().from(hearthSessions).where(eq(hearthSessions.id, seed.s3.id));
    expect(s3).toMatchObject({ facilitatorFamilyId: G, facilitatorUserId: null });
    expect(await db.select().from(sessionAttendance).where(eq(sessionAttendance.sessionId, seed.s3.id))).toHaveLength(1);
    expect(await db.select().from(sessionReflections).where(eq(sessionReflections.sessionId, seed.s3.id))).toHaveLength(1);
    const [h3Invite] = await db.select().from(hearthInvites).where(eq(hearthInvites.hearthId, seed.h3.id));
    expect(h3Invite.usedByFamilyId).toBeNull();

    // Clerk user deleted.
    expect(deleteUser).toHaveBeenCalledWith(seed.clerkUserId);

    // Blobs: the family's prefix was swept and every DB-known blob deleted —
    // never the link a parent pasted.
    expect(vi.mocked(list)).toHaveBeenCalledWith(expect.objectContaining({ prefix: `evidence/${F}/` }));
    const deleted = deletedBlobRefs();
    expect(deleted).toEqual(
      expect.arrayContaining([
        seed.photoPath,
        LEGACY_BLOB_URL,
        seed.h2PhotoByG,
        seed.s3PhotoByF,
        `https://store1.private.blob.vercel-storage.com/${blobbed}`,
      ]),
    );
    expect(deleted).not.toContain(PASTED_LINK);
    expect(vi.mocked(del)).toHaveBeenCalled();
  });

  it('leaves the other family completely intact', async () => {
    const seed = await seedEverywhere();
    asUser({ userId: seed.clerkUserId });
    const res = await POST(jsonReq({ confirmation: 'DELETE MY ACCOUNT' }));
    expect(res.status).toBe(200);

    expect(await db.select().from(families).where(eq(families.id, seed.other.id))).toHaveLength(1);
    const gMemberships = await db
      .select()
      .from(hearthMemberships)
      .where(inArray(hearthMemberships.hearthId, [seed.h1.id, seed.h3.id]));
    expect(gMemberships.every((m) => m.familyId === seed.other.id)).toBe(true);
    expect(gMemberships).toHaveLength(2);
    expect(await db.select().from(learners).where(eq(learners.familyId, seed.other.id))).toHaveLength(1);
  });
});
