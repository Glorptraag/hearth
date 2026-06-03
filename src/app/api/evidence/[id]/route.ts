import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { learningEntries, learningEntryEvidence } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { parseBody, routeHandler } from '@/lib/api-helpers';

/**
 * PATCH /api/evidence/[id]
 *
 * Update a single learning_entry_evidence row's `content` URL (and optionally
 * extend its metadata). The primary caller is the offline-queue resolver:
 * when a pending photo/audio upload finally completes after the entry was
 * already saved with a `local://` placeholder, this route swaps in the
 * real Blob URL and clears the `pending_upload` flag.
 *
 * Auth: caller must own the family that owns the parent entry. We join
 * through learning_entries to enforce that boundary.
 *
 * Task 2.7.
 */
const patchSchema = z.object({
  content: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  /** When true, merges metadata with existing rather than replacing it. */
  mergeMetadata: z.boolean().optional(),
});

export const PATCH = routeHandler(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const family = await getFamilyByClerkId(userId);
    if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

    const { id } = await ctx.params;

    const parsed = await parseBody(request, patchSchema);
    if ('error' in parsed) return parsed.error;

    // Load the evidence row joined to its parent entry so we can check
    // family ownership in one round trip.
    const existing = await db
      .select({
        evidenceId: learningEntryEvidence.id,
        familyId: learningEntries.familyId,
        existingMetadata: learningEntryEvidence.metadata,
      })
      .from(learningEntryEvidence)
      .leftJoin(learningEntries, eq(learningEntries.id, learningEntryEvidence.entryId))
      .where(eq(learningEntryEvidence.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }
    if (existing[0].familyId !== family.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Merge or replace metadata. The resolver path passes mergeMetadata=true
    // so we preserve durationMs/mimeType set at capture time and just clear
    // pending_upload.
    let metadata: Record<string, unknown> | undefined;
    if (parsed.data.metadata !== undefined) {
      const existingMeta = (existing[0].existingMetadata ?? {}) as Record<string, unknown>;
      metadata = parsed.data.mergeMetadata
        ? { ...existingMeta, ...parsed.data.metadata, pending_upload: undefined }
        : parsed.data.metadata;
    }

    const [updated] = await db
      .update(learningEntryEvidence)
      .set({
        content: parsed.data.content,
        ...(metadata !== undefined ? { metadata } : {}),
      })
      .where(eq(learningEntryEvidence.id, id))
      .returning();

    return NextResponse.json(updated);
  },
  { route: 'PATCH /api/evidence/[id]' },
);
