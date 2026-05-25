import { NextResponse } from 'next/server';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { bustCache } from '@/lib/content-qa/cache';
import { fetchPackDetail } from '@/lib/content-qa/run';
import { routeHandler } from '@/lib/api-helpers';

export const POST = routeHandler(async (
  _request: Request,
  { params }: { params: Promise<{ packId: string }> }
) => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const { packId } = await params;

  // Bust cache and re-run
  bustCache(packId);

  const detail = await fetchPackDetail(packId);
  if (!detail) {
    return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
  }

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'qa.recheck',
    targetResource: 'pack',
    targetId: packId,
    metadata: {
      completeness: detail.pack.completeness,
      errors: detail.pack.errorCount,
      warnings: detail.pack.warningCount,
      readiness: detail.readinessState,
    },
  });

  return NextResponse.json(detail);
}, { route: 'POST /api/admin/qa/packs/[packId]/recheck' });
