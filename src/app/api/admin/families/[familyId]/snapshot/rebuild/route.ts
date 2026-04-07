import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { families, familyIntelligenceSnapshots } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { z } from 'zod';

const bodySchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
  }

  const { familyId } = await params;

  // Verify family exists
  const [family] = await db
    .select({ id: families.id })
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);

  if (!family) {
    return NextResponse.json({ error: 'Family not found' }, { status: 404 });
  }

  // Audit the rebuild action
  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'family.snapshot_rebuild',
    targetResource: 'family',
    targetId: familyId,
    reason: body.reason,
  });

  // Mark snapshot as rebuilding by updating the trigger field
  // In production this would enqueue a worker job; for now we update the record
  await db
    .update(familyIntelligenceSnapshots)
    .set({
      rebuildTrigger: 'admin_manual',
      updatedAt: new Date(),
    })
    .where(eq(familyIntelligenceSnapshots.familyId, familyId));

  return NextResponse.json({ queued: true, familyId });
}
