import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learners, facilitatorNotes } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { encryptField, decryptField } from '@/lib/crypto/field-encryption';

type Params = { params: Promise<{ id: string }> };

/**
 * Facilitator private notes (E19): "encrypted; excluded from all exports and AI".
 *
 * These live in the dedicated `facilitator_notes` table, encrypted at rest via
 * {@link encryptField} — NOT in `learners.profileData`, where they would sit in
 * plaintext and have to be redacted from the account export by hand. One note
 * per learner; the write path upserts.
 *
 * Every query is scoped by `and(learnerId, familyId)`, so a caller can only
 * read or write notes for a learner that belongs to their own family.
 */

/** Resolve the caller's family and confirm the learner belongs to it. */
async function authoriseLearner(learnerId: string) {
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;

  const family = await getFamilyByClerkId(userId);
  if (!family) return { error: NextResponse.json({ error: 'Family not found' }, { status: 404 }) } as const;

  const learner = await db.query.learners.findFirst({
    where: and(eq(learners.id, learnerId), eq(learners.familyId, family.id)),
  });
  if (!learner) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) } as const;

  return { family } as const;
}

export const GET = routeHandler(async (_request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const access = await authoriseLearner(id);
  if ('error' in access) return access.error;

  const existing = await db.query.facilitatorNotes.findFirst({
    where: and(
      eq(facilitatorNotes.learnerId, id),
      eq(facilitatorNotes.familyId, access.family.id)
    ),
  });

  return NextResponse.json({
    noteText: existing ? decryptField(existing.noteText) : '',
  });
}, { route: 'GET /api/learners/[id]/facilitator-notes' });

const updateNoteSchema = z.object({
  noteText: z.string(),
});

export const PUT = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const access = await authoriseLearner(id);
  if ('error' in access) return access.error;

  const result = await parseBody(request, updateNoteSchema);
  if ('error' in result) return result.error;

  const noteText = encryptField(result.data.noteText);

  const existing = await db.query.facilitatorNotes.findFirst({
    where: and(
      eq(facilitatorNotes.learnerId, id),
      eq(facilitatorNotes.familyId, access.family.id)
    ),
  });

  if (existing) {
    await db
      .update(facilitatorNotes)
      .set({ noteText, updatedAt: new Date() })
      .where(eq(facilitatorNotes.id, existing.id));
  } else {
    await db.insert(facilitatorNotes).values({
      familyId: access.family.id,
      learnerId: id,
      noteText,
    });
  }

  return NextResponse.json({ success: true });
}, { route: 'PUT /api/learners/[id]/facilitator-notes' });
