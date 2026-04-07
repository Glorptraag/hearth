import { NextResponse } from 'next/server';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { fetchAllPackSummaries } from '@/lib/content-qa/run';

export async function GET() {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const packs = await fetchAllPackSummaries();
  return NextResponse.json({ packs });
}
