import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invitations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { normalizeCode } from '@/lib/admin/invitation-codes';
import { routeHandler } from '@/lib/api-helpers';

export const GET = routeHandler(async (req: NextRequest) => {
  const rawCode = req.nextUrl.searchParams.get('code');
  if (!rawCode) {
    return NextResponse.json({ valid: false, error: 'no_code' }, { status: 400 });
  }

  const code = normalizeCode(rawCode);

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.code, code))
    .limit(1);

  if (!invitation) {
    return NextResponse.json({
      valid: false,
      error: 'not_found',
      message: "This invitation code isn't recognised. Check that you've copied it exactly, including the dashes.",
    });
  }

  if (invitation.status === 'redeemed') {
    return NextResponse.json({
      valid: false,
      error: 'already_redeemed',
      message: "This invitation has already been used. If you've already signed up, just log in. If you need a new invitation, get in touch.",
    });
  }

  if (
    invitation.status === 'revoked' ||
    invitation.status === 'expired' ||
    (invitation.expiresAt && new Date(invitation.expiresAt) < new Date())
  ) {
    return NextResponse.json({
      valid: false,
      error: 'expired_or_revoked',
      message: "This invitation is no longer valid. Get in touch and we'll sort it out.",
    });
  }

  return NextResponse.json({
    valid: true,
    prepopulation: {
      familyName: invitation.intendedFamilyName,
      primaryEmail: invitation.intendedPrimaryEmail ?? undefined,
      locationState: invitation.intendedLocationState ?? undefined,
    },
  });
}, { route: 'GET /api/invitations/validate' });
