import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentStudioDrafts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createEmptyStudioState } from '@/lib/content-studio/factories';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';

export async function GET() {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const drafts = await db
    .select({
      id: contentStudioDrafts.id,
      title: contentStudioDrafts.title,
      draftType: contentStudioDrafts.draftType,
      status: contentStudioDrafts.status,
      updatedAt: contentStudioDrafts.updatedAt,
    })
    .from(contentStudioDrafts)
    .where(eq(contentStudioDrafts.clerkUserId, admin.userId))
    .orderBy(desc(contentStudioDrafts.updatedAt))
    .limit(50);

  return NextResponse.json(drafts);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const body = await req.json();
  const title = body.title?.trim() || 'Untitled Draft';

  const [draft] = await db
    .insert(contentStudioDrafts)
    .values({
      clerkUserId: admin.userId,
      title,
      draftType: 'pack',
      draftData: createEmptyStudioState(),
      status: 'draft',
    })
    .returning();

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'content.draft_create',
    targetResource: 'content_draft',
    targetId: draft!.id,
  });

  return NextResponse.json(draft, { status: 201 });
}
