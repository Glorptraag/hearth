/**
 * Account deletion — decision D1 (Drew, 2026-10-19): transfer ownership.
 *
 * Three outcomes, picked from the caller's place in the family model
 * (`families.clerk_user_id` is the owner; `family_members` holds the
 * co-facilitators, role `editor` | `viewer`):
 *
 *  - `member_removed`       — the caller is a co-facilitator, not an owner. Only
 *                             their own membership + per-user rows go; the
 *                             family is untouched.
 *  - `ownership_transferred` — the caller owns the family and another adult
 *                             member is eligible. That member becomes owner and
 *                             the family's data stays with them.
 *  - `family_deleted`        — the caller is the sole adult. Every row that
 *                             references the family is removed, community
 *                             Hearths the family created are handed to another
 *                             member family (or deleted when none is left),
 *                             and every evidence blob is deleted.
 *
 * Successor rule (both levels): highest role first, then longest-standing.
 *  - Family:  `owner` > `editor` > `viewer`, then earliest join. Only `active`
 *             members with a Clerk identity who don't already own a family of
 *             their own (`families.clerk_user_id` is unique) are eligible.
 *  - Hearth:  `coordinator` > `member`, then earliest join, among `active`
 *             member families. The successor is made a coordinator.
 *
 * Database writes for one deletion run as a single transaction (neon-http
 * `batch`, which Neon executes atomically). Clerk and Blob cleanup runs only
 * after the commit; a failure there is logged and reported to Sentry but never
 * rolls back the database — the rows are already gone and a retry would 404.
 *
 * Spec + history: docs/hearth-account-deletion-defect-v1.md
 */
import { clerkClient } from '@clerk/nextjs/server';
import { del, list } from '@vercel/blob';
import { and, asc, eq, inArray, isNotNull, ne, notExists, or, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { db } from '@/lib/db';
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
  hearthInvites,
  hearthMemberships,
  hearthSessions,
  hearths,
  invitations,
  learners,
  learningEntries,
  learningEntryEvidence,
  libraryUpgradeEvents,
  loggerDrafts,
  moduleDrafts,
  moduleRuns,
  notifications,
  plannerEntries,
  providerCodes,
  sessionAttendance,
  sessionEvidence,
  sessionReflections,
  suggestedObservations,
  workSampleAnnotations,
  workSamples,
} from '@/lib/db/schema';
import { EVIDENCE_PREFIX } from '@/lib/evidence';

export type AccountDeletionOutcome = 'member_removed' | 'ownership_transferred' | 'family_deleted';

export interface AccountDeletionResult {
  outcome: AccountDeletionOutcome;
  familyId: string;
  /** Clerk id of the member promoted to owner (`ownership_transferred` only). */
  newOwnerClerkUserId?: string;
  /** Community Hearths handed to another member family (`family_deleted` only). */
  transferredHearths: { hearthId: string; toFamilyId: string }[];
  /** Community Hearths deleted because no other active member family remained. */
  deletedHearthIds: string[];
  cleanup: {
    clerkUserDeleted: boolean;
    blobsDeleted: number;
    blobFailures: number;
  };
}

type Handle = Pick<typeof db, 'select' | 'update' | 'delete'>;
type Statement = BatchItem<'pg'> & PromiseLike<unknown>;

const BLOB_DELETE_CHUNK = 100;

/**
 * Delete the account of `clerkUserId`. Returns null when the user neither owns
 * a family nor holds a membership in one.
 */
export async function deleteAccount(clerkUserId: string): Promise<AccountDeletionResult | null> {
  const owned = await db.query.families.findFirst({
    where: eq(families.clerkUserId, clerkUserId),
  });

  if (owned) {
    const successor = await findFamilySuccessor(owned.id, clerkUserId);
    if (successor) {
      await commitAtomically((h) => [
        h
          .update(families)
          .set({ clerkUserId: successor.clerkUserId, updatedAt: new Date() })
          .where(eq(families.id, owned.id)),
        // The owner is modelled by families.clerk_user_id, not a member row.
        h.delete(familyMembers).where(eq(familyMembers.id, successor.memberId)),
        ...personalRowStatements(h, clerkUserId),
      ]);
      const clerkUserDeleted = await deleteClerkUser(clerkUserId, owned.id);
      return {
        outcome: 'ownership_transferred',
        familyId: owned.id,
        newOwnerClerkUserId: successor.clerkUserId,
        transferredHearths: [],
        deletedHearthIds: [],
        cleanup: { clerkUserDeleted, blobsDeleted: 0, blobFailures: 0 },
      };
    }

    const plan = await planCommunityHandover(owned.id);
    const blobRefs = await collectBlobRefs(owned.id, plan.deletedHearthIds);
    await commitAtomically((h) => familyDeletionStatements(h, owned.id, clerkUserId, plan));

    const blobs = await deleteBlobs(blobRefs, `${EVIDENCE_PREFIX}/${owned.id}/`, owned.id);
    const clerkUserDeleted = await deleteClerkUser(clerkUserId, owned.id);
    return {
      outcome: 'family_deleted',
      familyId: owned.id,
      transferredHearths: plan.transfers,
      deletedHearthIds: plan.deletedHearthIds,
      cleanup: { clerkUserDeleted, blobsDeleted: blobs.deleted, blobFailures: blobs.failed },
    };
  }

  const [membership] = await db
    .select({ familyId: familyMembers.familyId })
    .from(familyMembers)
    .where(and(eq(familyMembers.clerkUserId, clerkUserId), eq(familyMembers.status, 'active')))
    .limit(1);
  if (!membership) return null;

  await commitAtomically((h) => personalRowStatements(h, clerkUserId));
  const clerkUserDeleted = await deleteClerkUser(clerkUserId, membership.familyId);
  return {
    outcome: 'member_removed',
    familyId: membership.familyId,
    transferredHearths: [],
    deletedHearthIds: [],
    cleanup: { clerkUserDeleted, blobsDeleted: 0, blobFailures: 0 },
  };
}

/**
 * Run the statements as one transaction. Production's neon-http driver has no
 * interactive transactions; its `batch` is the atomic primitive. Drivers
 * without `batch` (node-postgres, used by the integration suite) get a real
 * `transaction`.
 */
async function commitAtomically(build: (h: Handle) => Statement[]): Promise<void> {
  if (typeof (db as { batch?: unknown }).batch === 'function') {
    const statements = build(db);
    if (statements.length === 0) return;
    await db.batch(statements as [Statement, ...Statement[]]);
    return;
  }
  await db.transaction(async (tx) => {
    for (const statement of build(tx)) await statement;
  });
}

/** Rows keyed to the person (not the family): memberships, drafts, push tokens. */
function personalRowStatements(h: Handle, clerkUserId: string): Statement[] {
  return [
    h.delete(familyMembers).where(eq(familyMembers.clerkUserId, clerkUserId)),
    h.delete(loggerDrafts).where(eq(loggerDrafts.clerkUserId, clerkUserId)),
    h.delete(deviceTokens).where(eq(deviceTokens.clerkUserId, clerkUserId)),
  ];
}

async function findFamilySuccessor(
  familyId: string,
  departingClerkUserId: string,
): Promise<{ memberId: string; clerkUserId: string } | null> {
  const [row] = await db
    .select({ memberId: familyMembers.id, clerkUserId: familyMembers.clerkUserId })
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.status, 'active'),
        isNotNull(familyMembers.clerkUserId),
        ne(familyMembers.clerkUserId, departingClerkUserId),
        notExists(
          db
            .select({ one: sql`1` })
            .from(families)
            .where(eq(families.clerkUserId, familyMembers.clerkUserId)),
        ),
      ),
    )
    .orderBy(
      sql`case ${familyMembers.role} when 'owner' then 0 when 'editor' then 1 when 'viewer' then 2 else 3 end`,
      asc(sql`coalesce(${familyMembers.joinedAt}, ${familyMembers.invitedAt}, ${familyMembers.createdAt})`),
      asc(familyMembers.id),
    )
    .limit(1);
  if (!row?.clerkUserId) return null;
  return { memberId: row.memberId, clerkUserId: row.clerkUserId };
}

interface CommunityPlan {
  transfers: { hearthId: string; toFamilyId: string }[];
  deletedHearthIds: string[];
}

async function planCommunityHandover(familyId: string): Promise<CommunityPlan> {
  const created = await db
    .select({ id: hearths.id })
    .from(hearths)
    .where(eq(hearths.createdByFamilyId, familyId));

  const plan: CommunityPlan = { transfers: [], deletedHearthIds: [] };
  for (const hearth of created) {
    const [successor] = await db
      .select({ familyId: hearthMemberships.familyId })
      .from(hearthMemberships)
      .where(
        and(
          eq(hearthMemberships.hearthId, hearth.id),
          ne(hearthMemberships.familyId, familyId),
          eq(hearthMemberships.status, 'active'),
        ),
      )
      .orderBy(
        sql`case ${hearthMemberships.role} when 'coordinator' then 0 else 1 end`,
        asc(hearthMemberships.joinedAt),
        asc(hearthMemberships.id),
      )
      .limit(1);
    if (successor) plan.transfers.push({ hearthId: hearth.id, toFamilyId: successor.familyId });
    else plan.deletedHearthIds.push(hearth.id);
  }
  return plan;
}

function familyDeletionStatements(
  h: Handle,
  familyId: string,
  clerkUserId: string,
  plan: CommunityPlan,
): Statement[] {
  const learnerIds = () =>
    h.select({ id: learners.id }).from(learners).where(eq(learners.familyId, familyId));
  const entryIds = () =>
    h.select({ id: learningEntries.id }).from(learningEntries).where(eq(learningEntries.familyId, familyId));
  const reportIds = () =>
    h.select({ id: complianceReports.id }).from(complianceReports).where(eq(complianceReports.familyId, familyId));
  const badgeIds = () =>
    h.select({ id: badgeDefinitions.id }).from(badgeDefinitions).where(eq(badgeDefinitions.familyId, familyId));
  const sampleIds = () =>
    h
      .select({ id: workSamples.id })
      .from(workSamples)
      .where(or(inArray(workSamples.reportId, reportIds()), inArray(workSamples.entryId, entryIds())));

  const statements: Statement[] = [];

  // ── Community Hearths this family created: hand over, or delete outright ──
  for (const { hearthId, toFamilyId } of plan.transfers) {
    statements.push(
      h
        .update(hearths)
        .set({ createdByFamilyId: toFamilyId, updatedAt: new Date() })
        .where(eq(hearths.id, hearthId)),
      h
        .update(hearthMemberships)
        .set({ role: 'coordinator' })
        .where(and(eq(hearthMemberships.hearthId, hearthId), eq(hearthMemberships.familyId, toFamilyId))),
    );
  }
  if (plan.deletedHearthIds.length > 0) {
    const ids = plan.deletedHearthIds;
    const sessionIds = () =>
      h.select({ id: hearthSessions.id }).from(hearthSessions).where(inArray(hearthSessions.hearthId, ids));
    statements.push(
      h.delete(suggestedObservations).where(inArray(suggestedObservations.sessionId, sessionIds())),
      h.delete(sessionAttendance).where(inArray(sessionAttendance.sessionId, sessionIds())),
      h.delete(sessionEvidence).where(inArray(sessionEvidence.sessionId, sessionIds())),
      h.delete(sessionReflections).where(inArray(sessionReflections.sessionId, sessionIds())),
      h.delete(hearthSessions).where(inArray(hearthSessions.hearthId, ids)),
      h.delete(hearthInvites).where(inArray(hearthInvites.hearthId, ids)),
      h.delete(hearthMemberships).where(inArray(hearthMemberships.hearthId, ids)),
      h.delete(hearths).where(inArray(hearths.id, ids)),
    );
  }

  // ── This family's footprint in Hearths that live on ──
  statements.push(
    // Sessions it facilitated stay (other families attended and reflected on
    // them); they pass to the Hearth's owner, which is never this family now.
    h
      .update(hearthSessions)
      .set({
        facilitatorFamilyId: sql`(select h.created_by_family_id from hearths h where h.id = hearth_sessions.hearth_id)`,
        facilitatorUserId: null,
      })
      .where(eq(hearthSessions.facilitatorFamilyId, familyId)),
    h
      .delete(suggestedObservations)
      .where(
        or(
          eq(suggestedObservations.observerFamilyId, familyId),
          eq(suggestedObservations.targetFamilyId, familyId),
          inArray(suggestedObservations.targetLearnerId, learnerIds()),
          inArray(suggestedObservations.familyEntryId, entryIds()),
        ),
      ),
    h.delete(sessionAttendance).where(eq(sessionAttendance.familyId, familyId)),
    h.delete(sessionEvidence).where(eq(sessionEvidence.uploadedByFamilyId, familyId)),
    h.delete(sessionReflections).where(eq(sessionReflections.familyId, familyId)),
    h.delete(hearthInvites).where(eq(hearthInvites.invitedByFamilyId, familyId)),
    h.update(hearthInvites).set({ usedByFamilyId: null }).where(eq(hearthInvites.usedByFamilyId, familyId)),
    h
      .update(hearthMemberships)
      .set({ invitedByFamilyId: null })
      .where(eq(hearthMemberships.invitedByFamilyId, familyId)),
    h.delete(hearthMemberships).where(eq(hearthMemberships.familyId, familyId)),
  );

  // ── Reports, badges, notes: children of learners / entries ──
  statements.push(
    h.delete(workSampleAnnotations).where(inArray(workSampleAnnotations.workSampleId, sampleIds())),
    h.delete(workSamples).where(inArray(workSamples.id, sampleIds())),
    h.delete(complianceReports).where(eq(complianceReports.familyId, familyId)),
    h
      .delete(badgeAssessmentLogs)
      .where(
        or(
          inArray(badgeAssessmentLogs.learnerId, learnerIds()),
          inArray(badgeAssessmentLogs.badgeDefinitionId, badgeIds()),
        ),
      ),
    h
      .delete(badgeAwards)
      .where(or(inArray(badgeAwards.learnerId, learnerIds()), inArray(badgeAwards.badgeDefinitionId, badgeIds()))),
    h.delete(badgeDefinitions).where(eq(badgeDefinitions.familyId, familyId)),
    h
      .delete(facilitatorNotes)
      .where(or(eq(facilitatorNotes.familyId, familyId), inArray(facilitatorNotes.learnerId, learnerIds()))),
    h
      .delete(aiPipelineLogs)
      .where(or(eq(aiPipelineLogs.familyId, familyId), inArray(aiPipelineLogs.entryId, entryIds()))),
  );

  // ── Entries (cascades evidence rows + DLO links), then what entries point at ──
  statements.push(
    h.delete(learningEntries).where(eq(learningEntries.familyId, familyId)),
    h.delete(moduleRuns).where(eq(moduleRuns.familyId, familyId)),
    h.delete(plannerEntries).where(eq(plannerEntries.familyId, familyId)),
  );

  // ── Remaining family-scoped tables ──
  statements.push(
    h.delete(notifications).where(eq(notifications.familyId, familyId)),
    h.delete(familyLibrary).where(eq(familyLibrary.familyId, familyId)),
    h.delete(moduleDrafts).where(eq(moduleDrafts.familyId, familyId)),
    h.delete(familyMembers).where(eq(familyMembers.familyId, familyId)),
    h.delete(familyIntelligenceSnapshots).where(eq(familyIntelligenceSnapshots.familyId, familyId)),
    h.delete(familySettings).where(eq(familySettings.familyId, familyId)),
    h.delete(loggerDrafts).where(eq(loggerDrafts.familyId, familyId)),
    h.delete(entitlements).where(eq(entitlements.familyId, familyId)),
    h.delete(familyPackState).where(eq(familyPackState.familyId, familyId)),
    h.delete(familyLibraryState).where(eq(familyLibraryState.familyId, familyId)),
    h.delete(libraryUpgradeEvents).where(eq(libraryUpgradeEvents.familyId, familyId)),
    h.delete(customThreads).where(eq(customThreads.familyId, familyId)),
    // Admin-side records survive as history, without the pointer.
    h.update(invitations).set({ redeemedByFamilyId: null }).where(eq(invitations.redeemedByFamilyId, familyId)),
    h.update(providerCodes).set({ redeemedByFamilyId: null }).where(eq(providerCodes.redeemedByFamilyId, familyId)),
    // The owner's memberships of OTHER families, drafts and tokens.
    ...personalRowStatements(h, clerkUserId),
    // learner_dlo_status / observation_dlo_links cascade from learners;
    // feedback / device_tokens cascade from families.
    h.delete(learners).where(eq(learners.familyId, familyId)),
    h.delete(families).where(eq(families.id, familyId)),
  );

  return statements;
}

/**
 * Blob references that only the DB knows about, read BEFORE the rows holding
 * them are deleted. New-style evidence lives under `evidence/<familyId>/` and
 * is also swept by prefix after the commit; this list adds legacy public URLs
 * and Hearth session photos, which live elsewhere.
 */
async function collectBlobRefs(familyId: string, deletedHearthIds: string[]): Promise<string[]> {
  const entryIds = db
    .select({ id: learningEntries.id })
    .from(learningEntries)
    .where(eq(learningEntries.familyId, familyId));

  // Sequential, not Promise.all: the integration suite drives one pinned pg client.
  const evidenceRows = await db
    .select({ ref: learningEntryEvidence.content })
    .from(learningEntryEvidence)
    .where(
      and(
        inArray(learningEntryEvidence.entryId, entryIds),
        inArray(learningEntryEvidence.kind, ['photo', 'audio']),
      ),
    );
  const entryRows = await db
    .select({ refs: learningEntries.evidenceUrls })
    .from(learningEntries)
    .where(eq(learningEntries.familyId, familyId));
  const sessionScope = deletedHearthIds.length > 0
    ? or(
        eq(sessionEvidence.uploadedByFamilyId, familyId),
        inArray(
          sessionEvidence.sessionId,
          db
            .select({ id: hearthSessions.id })
            .from(hearthSessions)
            .where(inArray(hearthSessions.hearthId, deletedHearthIds)),
        ),
      )
    : eq(sessionEvidence.uploadedByFamilyId, familyId);
  const sessionRows = await db
    .select({ ref: sessionEvidence.fileUrl })
    .from(sessionEvidence)
    .where(sessionScope);

  const refs = [
    ...evidenceRows.map((r) => r.ref),
    ...entryRows.flatMap((r) => r.refs ?? []),
    ...sessionRows.map((r) => r.ref),
  ];
  return [...new Set(refs.filter(isBlobRef))];
}

/** A stored ref we own in Vercel Blob — never an arbitrary link a parent pasted. */
export function isBlobRef(ref: string | null | undefined): ref is string {
  if (!ref) return false;
  if (/^https?:\/\//i.test(ref)) {
    try {
      return new URL(ref).hostname.endsWith('.blob.vercel-storage.com');
    } catch {
      return false;
    }
  }
  if (ref.startsWith('/') || ref.includes('..')) return false;
  return ref.startsWith(`${EVIDENCE_PREFIX}/`) || ref.startsWith('hearth-evidence/');
}

async function deleteBlobs(
  refs: string[],
  prefix: string,
  familyId: string,
): Promise<{ deleted: number; failed: number }> {
  const targets = new Set(refs);
  try {
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      for (const blob of page.blobs) targets.add(blob.url);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  } catch (err) {
    await reportCleanupFailure('blob-list', familyId, err);
  }

  const all = [...targets];
  let deleted = 0;
  let failed = 0;
  for (let i = 0; i < all.length; i += BLOB_DELETE_CHUNK) {
    const chunk = all.slice(i, i + BLOB_DELETE_CHUNK);
    try {
      await del(chunk);
      deleted += chunk.length;
    } catch (err) {
      failed += chunk.length;
      await reportCleanupFailure('blob-delete', familyId, err);
    }
  }
  return { deleted, failed };
}

async function deleteClerkUser(clerkUserId: string, familyId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    await client.users.deleteUser(clerkUserId);
    return true;
  } catch (err) {
    await reportCleanupFailure('clerk-delete-user', familyId, err);
    return false;
  }
}

async function reportCleanupFailure(step: string, familyId: string, err: unknown): Promise<void> {
  console.error(`[account-delete] post-commit ${step} failed for family ${familyId}`, err);
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(err, { tags: { route: 'POST /api/account/delete', step }, extra: { familyId } });
  } catch {
    // Sentry failures must never mask the cleanup error.
  }
}
