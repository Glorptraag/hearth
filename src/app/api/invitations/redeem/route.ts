import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { invitations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { normalizeCode } from '@/lib/admin/invitation-codes';
import { z } from 'zod';
import { routeHandler } from '@/lib/api-helpers';

const redeemSchema = z.object({
  code: z.string().min(1),
  familyId: z.string().uuid(),
});

export const POST = routeHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: z.infer<typeof redeemSchema>;
  try {
    body = redeemSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const code = normalizeCode(body.code);

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.code, code))
    .limit(1);

  if (!invitation) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  if (invitation.status !== 'pending') {
    return NextResponse.json(
      { ok: false, error: `Invitation status is '${invitation.status}'` },
      { status: 409 }
    );
  }

  if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
    return NextResponse.json(
      { ok: false, error: 'Invitation has expired' },
      { status: 410 }
    );
  }

  await db
    .update(invitations)
    .set({
      status: 'redeemed',
      redeemedAt: new Date(),
      redeemedByFamilyId: body.familyId,
    })
    .where(eq(invitations.id, invitation.id));

  return NextResponse.json({ ok: true });
}, { route: 'POST /api/invitations/redeem' });
