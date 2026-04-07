import { NextResponse } from 'next/server';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { fetchPackDetail } from '@/lib/content-qa/run';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packId: string }> }
) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const { packId } = await params;
  const detail = await fetchPackDetail(packId);
  if (!detail) {
    return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
  }

  return NextResponse.json(detail);
}
