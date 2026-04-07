import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { families, familyIntelligenceSnapshots } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { z } from 'zod';

const bodySchema = z.object({
  familyId: z.string().uuid(),
  reason: z.string().min(1, 'Reason is required'),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'familyId and reason are required' }, { status: 400 });
  }

  const [family] = await db
    .select({ id: families.id })
    .from(families)
    .where(eq(families.id, body.familyId))
    .limit(1);

  if (!family) {
    return NextResponse.json({ error: 'Family not found' }, { status: 404 });
  }

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'snapshot.rebuild',
    targetResource: 'family',
    targetId: body.familyId,
    reason: body.reason,
  });

  await db
    .update(familyIntelligenceSnapshots)
    .set({ rebuildTrigger: 'admin_manual', updatedAt: new Date() })
    .where(eq(familyIntelligenceSnapshots.familyId, body.familyId));

  return NextResponse.json({ queued: true, familyId: body.familyId });
}
