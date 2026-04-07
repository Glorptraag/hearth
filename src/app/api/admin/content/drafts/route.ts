import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentStudioDrafts } from '@/lib/db/schema';
import { isAdmin } from '@/lib/auth/admin';
import { eq, desc } from 'drizzle-orm';
import { createEmptyStudioState } from '@/lib/content-studio/factories';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const drafts = await db
    .select({
      id: contentStudioDrafts.id,
      title: contentStudioDrafts.title,
      draftType: contentStudioDrafts.draftType,
      status: contentStudioDrafts.status,
      updatedAt: contentStudioDrafts.updatedAt,
    })
    .from(contentStudioDrafts)
    .where(eq(contentStudioDrafts.clerkUserId, userId))
    .orderBy(desc(contentStudioDrafts.updatedAt))
    .limit(50);

  return NextResponse.json(drafts);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const title = body.title?.trim() || 'Untitled Draft';

  const [draft] = await db
    .insert(contentStudioDrafts)
    .values({
      clerkUserId: userId,
      title,
      draftType: 'pack',
      draftData: createEmptyStudioState(),
      status: 'draft',
    })
    .returning();

  return NextResponse.json(draft, { status: 201 });
}
