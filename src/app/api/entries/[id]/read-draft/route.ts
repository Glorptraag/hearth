import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { checkWritePermission, getFamilyByClerkId } from '@/lib/auth/helpers';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { parseReadOutput } from '@/lib/ai/read-schema';
import { deriveEntryTitle } from '@/lib/logger/entry-payload';

/**
 * PATCH /api/entries/[id]/read-draft — the parent accepts (or edits, then
 * accepts) the Photo Read draft on the Confirm surface (launch pivot W3.3; A1,
 * D-LP-2). Only an accepted or edited draft becomes entry text, and it is
 * marked `drafted_by = 'read'`.
 *
 * Guards:
 *   - signed in, family member with write access (viewer → 403, nothing written);
 *   - the entry belongs to the caller's family (else 404, never disclosing it exists);
 *   - the entry has a valid Read (else 409 — there is no draft to accept);
 *   - the parent hasn't written their own words (else 409 — a draft never
 *     replaces the parent's text; a previously accepted Read may be re-edited).
 *
 * Changing the words does NOT re-run enrichment: at most one model call per
 * save (D-LP-3), and the Read already informed this entry's proposals.
 */

type Params = { params: Promise<{ id: string }> };

const bodySchema = z
  .object({
    text: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1).max(2000)),
  })
  .strict();

export const PATCH = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions to modify entries' }, { status: writeCheck.statusCode });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const existing = await db.query.learningEntries.findFirst({
    where: and(eq(learningEntries.id, id), eq(learningEntries.familyId, family.id)),
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parsed = await parseBody(request, bodySchema);
  if ('error' in parsed) return parsed.error;

  if (!parseReadOutput(existing.readOutput ?? null)) {
    return NextResponse.json({ error: 'This moment has no photo draft' }, { status: 409 });
  }
  const parentWrote = existing.draftedBy !== 'read' && (existing.description ?? '').trim().length > 0;
  if (parentWrote) {
    return NextResponse.json({ error: 'This moment already has your words' }, { status: 409 });
  }

  const text = parsed.data.text;
  const [updated] = await db
    .update(learningEntries)
    .set({
      description: text,
      // A photo-only save carried a fallback title ("Photo on 6 Oct").
      title: deriveEntryTitle(text) || existing.title,
      draftedBy: 'read',
      updatedAt: new Date(),
    })
    .where(and(eq(learningEntries.id, id), eq(learningEntries.familyId, family.id)))
    .returning({
      id: learningEntries.id,
      title: learningEntries.title,
      description: learningEntries.description,
      draftedBy: learningEntries.draftedBy,
    });

  return NextResponse.json(updated);
}, { route: 'PATCH /api/entries/[id]/read-draft' });
