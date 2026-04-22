import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentStudioDrafts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { createBadge, createFullModule, createPack } from '@/lib/sanity/mutations';
import { transformBadge, transformModuleForFullCreate, transformPack } from '@/lib/content-studio/sanity-transform';
import { packPublishSchema } from '@/lib/content-studio/validation';
import type { StudioState, PackDraft } from '@/lib/content-studio/types';

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const body = await req.json();
  const { draftId, packIndex } = body as { draftId: string; packIndex: number };

  if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 });

  // Load draft
  const [draft] = await db
    .select()
    .from(contentStudioDrafts)
    .where(and(eq(contentStudioDrafts.id, draftId), eq(contentStudioDrafts.clerkUserId, admin.userId)))
    .limit(1);

  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

  const state = draft.draftData as unknown as StudioState;
  const pack = state.packs?.[packIndex ?? 0];
  if (!pack) return NextResponse.json({ error: 'Pack not found at index' }, { status: 400 });

  // Validate
  const validation = packPublishSchema.safeParse(pack);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: validation.error.issues },
      { status: 422 },
    );
  }

  try {
    // 1. Create badges first (no dependencies)
    const badgeIds: string[] = [];
    for (const badge of pack.badges) {
      const created = await createBadge(transformBadge(badge));
      badgeIds.push(created._id);
    }

    // 2. Create modules (each handles approach+activity circular refs)
    const moduleIds: string[] = [];
    for (const mod of pack.modules) {
      const input = transformModuleForFullCreate(mod);
      const result = await createFullModule(input as Parameters<typeof createFullModule>[0]);
      moduleIds.push(result.module._id);
    }

    // 3. Create the pack with collected IDs
    const packInput = transformPack(pack, moduleIds, badgeIds);
    const createdPack = await createPack(packInput as Parameters<typeof createPack>[0]);

    // 4. Update draft status
    await db
      .update(contentStudioDrafts)
      .set({ status: 'active', sanityPackId: createdPack._id, updatedAt: new Date() })
      .where(eq(contentStudioDrafts.id, draftId));

    await logAdminAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'content.publish',
      targetResource: 'pack',
      targetId: createdPack._id,
    });

    return NextResponse.json({
      packId: createdPack._id,
      moduleIds,
      badgeIds,
    });
  } catch (err) {
    console.error('Publish failed:', err);
    return NextResponse.json(
      { error: 'Publishing failed', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
