import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { families } from '@/lib/db/schema';
import { checkWritePermission } from '@/lib/auth/helpers';
import { apiError, authenticatedFamily, parseBody, routeHandler } from '@/lib/api-helpers';
import { photoReadAvailableFor } from '@/lib/ai/read-flags';

/**
 * Photo Read consent (launch pivot W3.2; P4, D-LP-4).
 *
 * GET  → `{ optIn, readAvailable }`. `optIn` is `families.photo_read_opt_in`:
 *        null until the family answers the first-photo disclosure, then the
 *        explicit answer. `readAvailable` says whether Read could run for this
 *        family right now (the PHOTO_READ_ENABLED flag + allowlist), so the
 *        client never claims "reading your photo" when it isn't.
 * PATCH `{ optIn: boolean }` → owner/editor only; a viewer gets 403 and
 *        nothing is written.
 *
 * The consent is stored regardless of the flag (A3): turning Read on after
 * zero-data-retention lands is then a flag change, not a re-ask.
 */

function body(familyId: string, optIn: boolean | null) {
  return { optIn, readAvailable: photoReadAvailableFor(familyId) };
}

export const GET = routeHandler(async () => {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;
  const { family } = result;
  return NextResponse.json(body(family.id, family.photoReadOptIn ?? null));
}, { route: 'GET /api/family/photo-read' });

const patchSchema = z.object({ optIn: z.boolean() }).strict();

export const PATCH = routeHandler(async (request: NextRequest) => {
  const result = await authenticatedFamily({ rateLimitKey: 'photo-read-consent', rateLimit: 30 });
  if ('error' in result) return result.error;
  const { userId, family } = result;

  const write = await checkWritePermission(userId, family.id);
  if (!write.allowed) return apiError('Your account can’t change this family’s settings', write.statusCode);

  const parsed = await parseBody(request, patchSchema);
  if ('error' in parsed) return parsed.error;

  const [updated] = await db
    .update(families)
    .set({ photoReadOptIn: parsed.data.optIn, updatedAt: new Date() })
    .where(eq(families.id, family.id))
    .returning({ photoReadOptIn: families.photoReadOptIn });

  return NextResponse.json(body(family.id, updated?.photoReadOptIn ?? parsed.data.optIn));
}, { route: 'PATCH /api/family/photo-read' });
