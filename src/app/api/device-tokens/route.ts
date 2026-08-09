import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { deviceTokens } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { parseBody, routeHandler } from '@/lib/api-helpers';

// Device registration for native push (App Store / Play pivot, Phase 3).
// The Capacitor shell calls POST after the OS grants push permission and
// DELETE on sign-out. Sending (APNs/FCM) is a later PR — this table is the
// audience it will fan out to.

const registerSchema = z.object({
  // APNs tokens are 64 hex chars, FCM registration tokens are longer and
  // opaque; validate shape loosely and length hard.
  token: z.string().min(16).max(4096),
  platform: z.enum(['ios', 'android']),
});

export const POST = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const parsed = await parseBody(request, registerSchema);
  if ('error' in parsed) return parsed.error;
  const { token, platform } = parsed.data;

  // Upsert on the token, not (user, token): a push token identifies a physical
  // device. If that device re-registers under a different sign-in, ownership
  // must MOVE — a stale row would push one family's notification to a device
  // now signed into another family.
  await db
    .insert(deviceTokens)
    .values({ familyId: family.id, clerkUserId: userId, token, platform })
    .onConflictDoUpdate({
      target: deviceTokens.token,
      set: {
        familyId: family.id,
        clerkUserId: userId,
        platform,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}, { route: 'POST /api/device-tokens' });

const unregisterSchema = z.object({
  token: z.string().min(16).max(4096),
});

export const DELETE = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const parsed = await parseBody(request, unregisterSchema);
  if ('error' in parsed) return parsed.error;

  // Scoped to the caller's family so one account cannot unregister another's
  // device. Idempotent: deleting an already-gone token still returns ok.
  await db
    .delete(deviceTokens)
    .where(
      and(
        eq(deviceTokens.token, parsed.data.token),
        eq(deviceTokens.familyId, family.id)
      )
    );

  return NextResponse.json({ ok: true });
}, { route: 'DELETE /api/device-tokens' });
