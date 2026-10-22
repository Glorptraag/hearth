import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { routeHandler } from '@/lib/api-helpers';
import { deleteAccount } from '@/lib/account/delete';

const deleteSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT'),
});

/**
 * Delete the caller's account. A co-facilitator removes only themselves; an
 * owner with another eligible adult member hands the family over; a sole owner
 * deletes the family, its evidence blobs and their Clerk user. Rules and
 * successor choice live in `@/lib/account/delete`.
 */
export const POST = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = rateLimit(`account-delete:${userId}`, { limit: 3, windowMs: 3600_000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Type "DELETE MY ACCOUNT" to confirm' }, { status: 400 });
  }

  const result = await deleteAccount(userId);
  if (!result) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  return NextResponse.json({ deleted: true, outcome: result.outcome });
}, { route: 'POST /api/account/delete' });
