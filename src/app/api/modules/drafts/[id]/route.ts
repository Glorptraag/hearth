import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { moduleDrafts } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export const DELETE = routeHandler(async (_request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  }
  const deleted = await db
    .delete(moduleDrafts)
    .where(and(eq(moduleDrafts.id, id), eq(moduleDrafts.familyId, family.id)))
    .returning({ id: moduleDrafts.id });

  if (deleted.length === 0) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}, { route: 'DELETE /api/modules/drafts/[id]' });
