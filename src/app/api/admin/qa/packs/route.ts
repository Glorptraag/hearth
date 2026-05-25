import { NextResponse } from 'next/server';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { fetchAllPackSummaries } from '@/lib/content-qa/run';
import { routeHandler } from '@/lib/api-helpers';

export const GET = routeHandler(async () => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const packs = await fetchAllPackSummaries();
  return NextResponse.json({ packs });
}, { route: 'GET /api/admin/qa/packs' });
