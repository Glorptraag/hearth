/**
 * Decision D1 (Drew, 2026-10-19): an owner with another adult member hands the
 * family over instead of destroying it. Successor = highest role, then
 * longest-standing; see `src/lib/account/delete.ts`. Also covers the
 * co-facilitator path, Hearth successor choice, atomicity and post-commit
 * cleanup failures.
 */
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { del } from '@vercel/blob';
import { sql, eq } from 'drizzle-orm';
import { asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry, createLoggerDraft } from '@/test/db-factories';
import {
  deviceTokens,
  families,
  familyMembers,
  hearthMemberships,
  hearths,
  learners,
  learningEntries,
  loggerDrafts,
} from '@/lib/db/schema';
import { deleteAccount } from '@/lib/account/delete';
import { POST } from './route';
import { deleteUser, installAccountDeletionDoubles } from './test-support';

installAccountDeletionDoubles();

function jsonReq(body: unknown) {
  return new NextRequest('http://x/api/account/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const days = (n: number) => new Date(Date.UTC(2026, 0, 1 + n));

async function addMember(
  familyId: string,
  role: 'editor' | 'viewer',
  joinedDay: number,
  opts: { status?: string; clerkUserId?: string | null } = {},
) {
  const clerkUserId = opts.clerkUserId === undefined ? `user_${randomUUID()}` : opts.clerkUserId;
  const [row] = await db
    .insert(familyMembers)
    .values({
      familyId,
      clerkUserId,
      email: `${randomUUID()}@example.com`,
      role,
      status: opts.status ?? 'active',
      joinedAt: days(joinedDay),
    })
    .returning();
  return row;
}

async function ownedFamily() {
  const ownerId = `user_${randomUUID()}`;
  const family = await createFamily(db, { clerkUserId: ownerId });
  const learner = await createLearner(db, { familyId: family.id });
  await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });
  await createLoggerDraft(db, { clerkUserId: ownerId, familyId: family.id });
  await db.insert(deviceTokens).values({ familyId: family.id, clerkUserId: ownerId, token: `tok_${randomUUID()}`, platform: 'ios' });
  return { ownerId, family, learner };
}

async function deleteAs(userId: string) {
  asUser({ userId });
  return POST(jsonReq({ confirmation: 'DELETE MY ACCOUNT' }));
}

describe('POST /api/account/delete — ownership transfer (D1)', () => {
  it('hands the family to the highest-role member, keeping its data', async () => {
    const { ownerId, family, learner } = await ownedFamily();
    await addMember(family.id, 'viewer', 1); // longest-standing, but a viewer
    const editor = await addMember(family.id, 'editor', 5);

    const res = await deleteAs(ownerId);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true, outcome: 'ownership_transferred' });

    const [after] = await db.select().from(families).where(eq(families.id, family.id));
    expect(after.clerkUserId).toBe(editor.clerkUserId);
    expect(await db.select().from(learners).where(eq(learners.id, learner.id))).toHaveLength(1);
    expect(await db.select().from(learningEntries).where(eq(learningEntries.familyId, family.id))).toHaveLength(1);

    // The new owner is modelled by families.clerk_user_id, not a member row;
    // the viewer stays a viewer.
    const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, family.id));
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('viewer');

    // The departing owner's personal rows and Clerk identity are gone; no blobs touched.
    expect(await db.select().from(loggerDrafts).where(eq(loggerDrafts.clerkUserId, ownerId))).toHaveLength(0);
    expect(await db.select().from(deviceTokens).where(eq(deviceTokens.clerkUserId, ownerId))).toHaveLength(0);
    expect(deleteUser).toHaveBeenCalledWith(ownerId);
    expect(vi.mocked(del)).not.toHaveBeenCalled();
  });

  it('picks the longest-standing member among equal roles', async () => {
    const { ownerId, family } = await ownedFamily();
    await addMember(family.id, 'editor', 9);
    const senior = await addMember(family.id, 'editor', 2);

    expect((await deleteAs(ownerId)).status).toBe(200);
    const [after] = await db.select().from(families).where(eq(families.id, family.id));
    expect(after.clerkUserId).toBe(senior.clerkUserId);
  });

  it('promotes a viewer when no editor exists', async () => {
    const { ownerId, family } = await ownedFamily();
    const viewer = await addMember(family.id, 'viewer', 3);

    expect((await deleteAs(ownerId)).status).toBe(200);
    const [after] = await db.select().from(families).where(eq(families.id, family.id));
    expect(after.clerkUserId).toBe(viewer.clerkUserId);
  });

  it('skips members who are only invited, removed, or already own a family', async () => {
    const { ownerId, family } = await ownedFamily();
    await addMember(family.id, 'editor', 1, { status: 'invited', clerkUserId: null });
    await addMember(family.id, 'editor', 2, { status: 'removed' });
    const ownsAnother = `user_${randomUUID()}`;
    await createFamily(db, { clerkUserId: ownsAnother });
    await addMember(family.id, 'editor', 3, { clerkUserId: ownsAnother });

    const res = await deleteAs(ownerId);
    expect(await res.json()).toEqual({ deleted: true, outcome: 'family_deleted' });
    expect(await db.select().from(families).where(eq(families.id, family.id))).toHaveLength(0);
  });

  it('a co-facilitator deleting their account removes only themselves', async () => {
    const { ownerId, family } = await ownedFamily();
    const editor = await addMember(family.id, 'editor', 1);
    await createLoggerDraft(db, { clerkUserId: editor.clerkUserId!, familyId: family.id });

    const res = await deleteAs(editor.clerkUserId!);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true, outcome: 'member_removed' });

    const [after] = await db.select().from(families).where(eq(families.id, family.id));
    expect(after.clerkUserId).toBe(ownerId);
    expect(await db.select().from(familyMembers).where(eq(familyMembers.id, editor.id))).toHaveLength(0);
    expect(await db.select().from(loggerDrafts).where(eq(loggerDrafts.clerkUserId, editor.clerkUserId!))).toHaveLength(0);
    expect(await db.select().from(loggerDrafts).where(eq(loggerDrafts.clerkUserId, ownerId))).toHaveLength(1);
    expect(deleteUser).toHaveBeenCalledWith(editor.clerkUserId);
  });

  it('hands a community Hearth to a coordinator ahead of a longer-standing member', async () => {
    const { ownerId, family } = await ownedFamily();
    const veteran = await createFamily(db, { clerkUserId: `user_${randomUUID()}` });
    const coordinator = await createFamily(db, { clerkUserId: `user_${randomUUID()}` });
    const [hearth] = await db.insert(hearths).values({ name: 'Creek', createdByFamilyId: family.id }).returning();
    await db.insert(hearthMemberships).values([
      { hearthId: hearth.id, familyId: family.id, role: 'coordinator', joinedAt: days(0) },
      { hearthId: hearth.id, familyId: veteran.id, role: 'member', joinedAt: days(1) },
      { hearthId: hearth.id, familyId: coordinator.id, role: 'coordinator', joinedAt: days(7) },
    ]);

    const result = await deleteAccount(ownerId);
    expect(result?.transferredHearths).toEqual([{ hearthId: hearth.id, toFamilyId: coordinator.id }]);
    const [after] = await db.select().from(hearths).where(eq(hearths.id, hearth.id));
    expect(after.createdByFamilyId).toBe(coordinator.id);
  });
});

describe('account deletion — transaction + post-commit cleanup', () => {
  it('rolls back every DB write when any statement fails, and skips Clerk/Blob', async () => {
    const { ownerId, family, learner } = await ownedFamily();
    // A table the deletion doesn't know about, referencing the family: the
    // final DELETE FROM families fails after most statements have run.
    // DDL is transactional — the test's rollback removes it.
    await db.execute(sql`create table account_delete_blocker (family_id uuid references families(id))`);
    await db.execute(sql`insert into account_delete_blocker values (${family.id})`);

    await expect(deleteAccount(ownerId)).rejects.toThrow();

    expect(await db.select().from(families).where(eq(families.id, family.id))).toHaveLength(1);
    expect(await db.select().from(learners).where(eq(learners.id, learner.id))).toHaveLength(1);
    expect(await db.select().from(learningEntries).where(eq(learningEntries.familyId, family.id))).toHaveLength(1);
    expect(await db.select().from(loggerDrafts).where(eq(loggerDrafts.clerkUserId, ownerId))).toHaveLength(1);
    expect(deleteUser).not.toHaveBeenCalled();
    expect(vi.mocked(del)).not.toHaveBeenCalled();
  });

  it('still succeeds when Clerk and Blob cleanup fail after the commit', async () => {
    const { ownerId, family } = await ownedFamily();
    await db.update(learningEntries).set({ evidenceUrls: [`evidence/${family.id}/x.jpg`] }).where(eq(learningEntries.familyId, family.id));
    deleteUser.mockRejectedValueOnce(new Error('clerk down'));
    vi.mocked(del).mockRejectedValueOnce(new Error('blob down'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await deleteAs(ownerId);
    expect(res.status).toBe(200);
    expect(await db.select().from(families).where(eq(families.id, family.id))).toHaveLength(0);

    const logged = errorSpy.mock.calls.map((c) => String(c[0]));
    expect(logged.some((m) => m.includes('clerk-delete-user'))).toBe(true);
    expect(logged.some((m) => m.includes('blob-delete'))).toBe(true);
    errorSpy.mockRestore();
  });
});
