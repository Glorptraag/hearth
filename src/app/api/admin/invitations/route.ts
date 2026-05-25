import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invitations } from '@/lib/db/schema';
import { eq, desc, sql, and, ilike, or } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { generateInvitationCode } from '@/lib/admin/invitation-codes';
import { routeHandler } from '@/lib/api-helpers';
import { z } from 'zod';

const createSchema = z.object({
  intendedFamilyName: z.string().min(1),
  intendedPrimaryEmail: z.string().email().optional(),
  intendedLocationState: z.string().optional(),
  sourceLabel: z.string().optional(),
  notes: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const GET = routeHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const url = req.nextUrl;
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '50', 10)));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (status) {
    conditions.push(eq(invitations.status, status));
  }
  if (search) {
    conditions.push(
      or(
        ilike(invitations.intendedFamilyName, `%${search}%`),
        ilike(invitations.intendedPrimaryEmail, `%${search}%`),
        ilike(invitations.sourceLabel, `%${search}%`),
        ilike(invitations.notes, `%${search}%`),
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(invitations)
      .where(where)
      .orderBy(desc(invitations.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(invitations)
      .where(where),
  ]);

  return NextResponse.json({
    invitations: rows,
    total: Number(countResult[0]?.count ?? 0),
    page,
    pageSize,
  });
}, { route: 'GET /api/admin/invitations' });

export const POST = routeHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const code = await generateInvitationCode();
  const defaultExpiry = new Date();
  defaultExpiry.setDate(defaultExpiry.getDate() + 30);

  const [invitation] = await db
    .insert(invitations)
    .values({
      code,
      intendedFamilyName: body.intendedFamilyName,
      intendedPrimaryEmail: body.intendedPrimaryEmail,
      intendedLocationState: body.intendedLocationState,
      sourceLabel: body.sourceLabel,
      notes: body.notes,
      status: 'pending',
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : defaultExpiry,
      createdByAdminId: admin.userId,
    })
    .returning();

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'invitation.create',
    targetResource: 'invitation',
    targetId: invitation!.id,
  });

  return NextResponse.json({ invitation }, { status: 201 });
}, { route: 'POST /api/admin/invitations' });
