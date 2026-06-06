import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { familyLibrary } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';

/**
 * DELETE /api/library/[id]
 *
 * Soft-delete a family_library row by setting `removed_at = now()`. Entries
 * already logged against the underlying pack/module continue to read
 * gracefully — the partial unique index filters on `removed_at IS NULL` so
 * the parent can re-add later (which restores this exact row via POST).
 *
 * Auth: row must belong to the caller's family.
 *
 * Task 4.2.
 */
export const DELETE = routeHandler(
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const family = await getFamilyByClerkId(userId);
    if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

    const { id } = await ctx.params;

    // Family-scoped update: WHERE id = $id AND family_id = $familyId so we
    // never soft-delete another family's row.
    const [updated] = await db
      .update(familyLibrary)
      .set({ removedAt: new Date() })
      .where(and(eq(familyLibrary.id, id), eq(familyLibrary.familyId, family.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Library row not found' }, { status: 404 });
    }

    rebuildSnapshot(family.id, 'library_change').catch((err) =>
      console.error('[library DELETE] Snapshot rebuild failed:', err),
    );

    return NextResponse.json({ id: updated.id, removedAt: updated.removedAt?.toISOString() });
  },
  { route: 'DELETE /api/library/[id]' },
);
