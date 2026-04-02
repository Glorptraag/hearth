import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  families,
  learners,
  hearths,
  hearthMemberships,
  hearthSessions,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { differenceInYears } from 'date-fns';
import { getFamilyByClerkId } from './helpers';
import type { HearthMembership, HearthSession, Family } from '@/types';

// ─── Core membership check ───

export async function getHearthMembership(
  familyId: string,
  hearthId: string
): Promise<HearthMembership | null> {
  const membership = await db.query.hearthMemberships.findFirst({
    where: and(
      eq(hearthMemberships.hearthId, hearthId),
      eq(hearthMemberships.familyId, familyId),
      eq(hearthMemberships.status, 'active')
    ),
  });
  return membership ?? null;
}

// ─── API route wrappers ───
// These return either { family, membership } or { error: NextResponse }
// so API routes can destructure cleanly:
//   const result = await requireHearthMember(userId, hearthId);
//   if ('error' in result) return result.error;
//   const { family, membership } = result;

type AuthSuccess = {
  family: Family;
  membership: HearthMembership;
};

type AuthFailure = {
  error: NextResponse;
};

export async function requireHearthMember(
  clerkUserId: string,
  hearthId: string
): Promise<AuthSuccess | AuthFailure> {
  const family = await getFamilyByClerkId(clerkUserId);
  if (!family) {
    return { error: NextResponse.json({ error: 'Family not found' }, { status: 404 }) };
  }

  const membership = await getHearthMembership(family.id, hearthId);
  if (!membership) {
    return { error: NextResponse.json({ error: 'Not a member of this hearth' }, { status: 403 }) };
  }

  return { family, membership };
}

export async function requireHearthCoordinator(
  clerkUserId: string,
  hearthId: string
): Promise<AuthSuccess | AuthFailure> {
  const result = await requireHearthMember(clerkUserId, hearthId);
  if ('error' in result) return result;

  if (result.membership.role !== 'coordinator') {
    return { error: NextResponse.json({ error: 'Coordinator access required' }, { status: 403 }) };
  }

  return result;
}

type FacilitatorSuccess = AuthSuccess & {
  session: HearthSession;
};

export async function requireSessionFacilitator(
  clerkUserId: string,
  hearthId: string,
  sessionId: string
): Promise<FacilitatorSuccess | AuthFailure> {
  const result = await requireHearthMember(clerkUserId, hearthId);
  if ('error' in result) return result;

  const session = await db.query.hearthSessions.findFirst({
    where: and(
      eq(hearthSessions.id, sessionId),
      eq(hearthSessions.hearthId, hearthId)
    ),
  });

  if (!session) {
    return { error: NextResponse.json({ error: 'Session not found' }, { status: 404 }) };
  }

  if (session.facilitatorFamilyId !== result.family.id) {
    return { error: NextResponse.json({ error: 'Only the session facilitator can perform this action' }, { status: 403 }) };
  }

  return { ...result, session };
}

// ─── Privacy boundary ───
// This is the ONLY function that shapes member data for cross-family exposure.
// No other code path should ever return raw learner/family data to non-family members.

export type SanitizedMember = {
  familyId: string;
  familyName: string;
  role: string;
  joinedAt: Date | null;
  consentCrossObservation: boolean;
  consentEvidenceSharing: boolean;
  children: Array<{
    firstName: string;
    ageInYears: number | null;
    colourToken: string | null;
  }>;
};

export async function sanitizeMembersForExposure(
  hearthId: string
): Promise<SanitizedMember[]> {
  const memberships = await db.query.hearthMemberships.findMany({
    where: and(
      eq(hearthMemberships.hearthId, hearthId),
      eq(hearthMemberships.status, 'active')
    ),
  });

  const results: SanitizedMember[] = [];

  for (const m of memberships) {
    const family = await db.query.families.findFirst({
      where: eq(families.id, m.familyId),
    });
    if (!family) continue;

    const familyLearners = await db.query.learners.findMany({
      where: eq(learners.familyId, m.familyId),
    });

    results.push({
      familyId: m.familyId,
      familyName: family.familyName,
      role: m.role,
      joinedAt: m.joinedAt,
      consentCrossObservation: m.consentCrossObservation,
      consentEvidenceSharing: m.consentEvidenceSharing,
      children: familyLearners.map((l) => ({
        firstName: l.name.split(' ')[0],
        ageInYears: l.dateOfBirth
          ? differenceInYears(new Date(), new Date(l.dateOfBirth))
          : null,
        colourToken: l.colourToken,
      })),
    });
  }

  return results;
}

// ─── Session access helper ───
// Loads a session and verifies the requesting family is a member of its hearth.

type SessionAccessSuccess = AuthSuccess & {
  session: HearthSession;
};

export async function requireSessionAccess(
  clerkUserId: string,
  hearthId: string,
  sessionId: string
): Promise<SessionAccessSuccess | AuthFailure> {
  const result = await requireHearthMember(clerkUserId, hearthId);
  if ('error' in result) return result;

  const session = await db.query.hearthSessions.findFirst({
    where: and(
      eq(hearthSessions.id, sessionId),
      eq(hearthSessions.hearthId, hearthId)
    ),
  });

  if (!session) {
    return { error: NextResponse.json({ error: 'Session not found' }, { status: 404 }) };
  }

  return { ...result, session };
}
