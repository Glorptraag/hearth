import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentStudioDrafts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const { id } = await params;
  const [draft] = await db
    .select()
    .from(contentStudioDrafts)
    .where(and(eq(contentStudioDrafts.id, id), eq(contentStudioDrafts.clerkUserId, admin.userId)))
    .limit(1);

  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(draft);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.draftData !== undefined) updates.draftData = body.draftData;
  if (body.title !== undefined) updates.title = body.title;
  if (body.status !== undefined) updates.status = body.status;

  const [updated] = await db
    .update(contentStudioDrafts)
    .set(updates)
    .where(and(eq(contentStudioDrafts.id, id), eq(contentStudioDrafts.clerkUserId, admin.userId)))
    .returning({ id: contentStudioDrafts.id, updatedAt: contentStudioDrafts.updatedAt });

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'content.draft_update',
    targetResource: 'content_draft',
    targetId: id,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const { id } = await params;
  const [deleted] = await db
    .delete(contentStudioDrafts)
    .where(and(eq(contentStudioDrafts.id, id), eq(contentStudioDrafts.clerkUserId, admin.userId)))
    .returning({ id: contentStudioDrafts.id });

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'content.draft_delete',
    targetResource: 'content_draft',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
