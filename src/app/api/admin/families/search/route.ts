import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { families } from '@/lib/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1),
  type: z.enum(['id', 'email', 'name']),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const url = req.nextUrl;
  const parsed = searchSchema.safeParse({
    q: url.searchParams.get('q'),
    type: url.searchParams.get('type'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid q/type params' }, { status: 400 });
  }

  const { q, type } = parsed.data;

  // Audit the search before returning results
  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'family.search',
    targetResource: 'family',
    metadata: { query: q, searchType: type },
  });

  let condition;
  switch (type) {
    case 'id':
      condition = eq(families.id, q);
      break;
    case 'email':
      condition = ilike(families.clerkUserId, `%${q}%`);
      break;
    case 'name':
      condition = ilike(families.familyName, `%${q}%`);
      break;
  }

  const matches = await db
    .select({
      id: families.id,
      familyName: families.familyName,
      clerkUserId: families.clerkUserId,
      createdAt: families.createdAt,
    })
    .from(families)
    .where(condition)
    .limit(20);

  return NextResponse.json({ matches });
}
