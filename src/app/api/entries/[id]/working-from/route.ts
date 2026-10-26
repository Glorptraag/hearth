import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { checkWritePermission, getFamilyByClerkId } from '@/lib/auth/helpers';
import { parseBody, routeHandler } from '@/lib/api-helpers';
import { parseReadOutput } from '@/lib/ai/read-schema';
import { matchShelf, type ShelfMatch } from '@/lib/shelf/match';
import { getShelfResources } from '@/lib/shelf/query';
import type { ShelfResource } from '@/lib/shelf/types';
import type { WorkingFrom } from '@/lib/logger/read-draft';

/**
 * The Confirm surface's Working-from chip (launch pivot W3.3; W2.4, D-LP-6).
 *
 * GET   → `{ suggestion, resources, current }`. `suggestion` is the
 *         deterministic Shelf match (`matchShelf`, zero model calls) on the
 *         entry's stored Read `printedText`, computed here so the Shelf read
 *         stays server-side. `resources` lists the published Shelf (wave 1 +
 *         the two universal sources) for "change". `current` is what the
 *         parent already confirmed.
 * PATCH `{ workingFrom: {resourceId, level?, lesson?, source} | null }` →
 *         writes `learning_entries.working_from`. Written ONLY on the parent's
 *         confirm (W2.4). `source: 'read'` must equal the server's own match,
 *         so provenance can't be claimed for a resource the Read didn't find.
 *
 * Write-checked (viewer → 403, nothing written); another family's entry → 404.
 */

type Params = { params: Promise<{ id: string }> };

type ShelfOption = { id: string; title: string; kind: ShelfResource['kind']; levels: string[] };

function optionsFrom(resources: ShelfResource[]): ShelfOption[] {
  return resources.map((r) => ({
    id: r._id,
    title: r.title,
    kind: r.kind,
    levels: (r.levels ?? []).map((l) => l.name),
  }));
}

async function loadEntry(userId: string, id: string, needWrite: boolean) {
  const family = await getFamilyByClerkId(userId);
  if (!family) return { error: NextResponse.json({ error: 'Family not found' }, { status: 404 }) } as const;
  if (needWrite) {
    const writeCheck = await checkWritePermission(userId, family.id);
    if (!writeCheck.allowed) {
      return {
        error: NextResponse.json({ error: 'Insufficient permissions to modify entries' }, { status: writeCheck.statusCode }),
      } as const;
    }
  }
  if (!z.string().uuid().safeParse(id).success) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) } as const;
  }
  const entry = await db.query.learningEntries.findFirst({
    where: and(eq(learningEntries.id, id), eq(learningEntries.familyId, family.id)),
  });
  if (!entry) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) } as const;
  return { family, entry } as const;
}

async function shelfResourcesOrEmpty(): Promise<ShelfResource[]> {
  try {
    return await getShelfResources();
  } catch (err) {
    console.error('[working-from] shelf read failed:', err);
    return [];
  }
}

function suggestionFor(readOutput: unknown, resources: ShelfResource[]): ShelfMatch | null {
  const read = parseReadOutput(readOutput ?? null);
  if (!read?.printedText) return null;
  return matchShelf(read.printedText, resources);
}

export const GET = routeHandler(async (_request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const loaded = await loadEntry(userId, id, false);
  if ('error' in loaded) return loaded.error;

  const resources = await shelfResourcesOrEmpty();
  const match = suggestionFor(loaded.entry.readOutput, resources);
  const matched = match ? resources.find((r) => r._id === match.resourceId) : undefined;

  return NextResponse.json({
    suggestion:
      match && matched
        ? {
            resourceId: match.resourceId,
            title: matched.title,
            ...(match.level ? { level: match.level } : {}),
            ...(match.lesson !== undefined ? { lesson: String(match.lesson) } : {}),
          }
        : null,
    resources: optionsFrom(resources),
    current: (loaded.entry.workingFrom as WorkingFrom | null) ?? null,
  });
}, { route: 'GET /api/entries/[id]/working-from' });

const workingFromSchema = z
  .object({
    resourceId: z.string().min(1).max(200),
    level: z.string().trim().min(1).max(80).optional(),
    lesson: z.string().trim().regex(/^\d{1,4}$/).optional(),
    source: z.enum(['read', 'parent']),
  })
  .strict();

const bodySchema = z.object({ workingFrom: workingFromSchema.nullable() }).strict();

export const PATCH = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const loaded = await loadEntry(userId, id, true);
  if ('error' in loaded) return loaded.error;
  const { family, entry } = loaded;

  const parsed = await parseBody(request, bodySchema);
  if ('error' in parsed) return parsed.error;
  const next = parsed.data.workingFrom;

  if (next) {
    const resources = await shelfResourcesOrEmpty();
    const resource = resources.find((r) => r._id === next.resourceId);
    if (!resource) return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
    if (next.level && !(resource.levels ?? []).some((l) => l.name === next.level)) {
      return NextResponse.json({ error: 'Unknown level' }, { status: 400 });
    }
    if (next.source === 'read') {
      const match = suggestionFor(entry.readOutput, resources);
      if (!match || match.resourceId !== next.resourceId) {
        return NextResponse.json({ error: 'That isn’t what the photo showed' }, { status: 400 });
      }
    }
  }

  const value: WorkingFrom | null = next
    ? {
        resourceId: next.resourceId,
        ...(next.level ? { level: next.level } : {}),
        ...(next.lesson ? { lesson: next.lesson } : {}),
        source: next.source,
      }
    : null;

  const [updated] = await db
    .update(learningEntries)
    .set({ workingFrom: value, updatedAt: new Date() })
    .where(and(eq(learningEntries.id, entry.id), eq(learningEntries.familyId, family.id)))
    .returning({ workingFrom: learningEntries.workingFrom });

  return NextResponse.json({ workingFrom: updated?.workingFrom ?? null });
}, { route: 'PATCH /api/entries/[id]/working-from' });
