import { NextResponse } from 'next/server';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { getDoc, patch, remove } from '@/lib/sanity/mutations';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const { id } = await params;
  const doc = await getDoc(id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const { id } = await params;
  const body = await req.json();
  const updated = await patch(id, body);

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'content.commons_text_update',
    targetResource: 'commonsText',
    targetId: id,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const { id } = await params;
  await remove(id);

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'content.commons_text_delete',
    targetResource: 'commonsText',
    targetId: id,
  });

  return NextResponse.json({ deleted: true });
}
