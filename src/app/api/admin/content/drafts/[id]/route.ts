import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentStudioDrafts } from '@/lib/db/schema';
import { isAdmin } from '@/lib/auth/admin';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const [draft] = await db
    .select()
    .from(contentStudioDrafts)
    .where(and(eq(contentStudioDrafts.id, id), eq(contentStudioDrafts.clerkUserId, userId)))
    .limit(1);

  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(draft);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.draftData !== undefined) updates.draftData = body.draftData;
  if (body.title !== undefined) updates.title = body.title;
  if (body.status !== undefined) updates.status = body.status;

  const [updated] = await db
    .update(contentStudioDrafts)
    .set(updates)
    .where(and(eq(contentStudioDrafts.id, id), eq(contentStudioDrafts.clerkUserId, userId)))
    .returning({ id: contentStudioDrafts.id, updatedAt: contentStudioDrafts.updatedAt });

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const [deleted] = await db
    .delete(contentStudioDrafts)
    .where(and(eq(contentStudioDrafts.id, id), eq(contentStudioDrafts.clerkUserId, userId)))
    .returning({ id: contentStudioDrafts.id });

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
