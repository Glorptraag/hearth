import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hearths } from '@/lib/db/schema';
import { apiError, parseBody } from '@/lib/api-helpers';
import { requireHearthMember, requireHearthCoordinator } from '@/lib/auth/hearth-helpers';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireHearthMember(userId, id);
  if ('error' in result) return result.error;
  const { family, membership } = result;

  const hearth = await db.query.hearths.findFirst({
    where: eq(hearths.id, id),
  });

  if (!hearth) return apiError('Hearth not found', 404);

  return NextResponse.json({ ...hearth, role: membership.role });
}

const patchHearthSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const result = await requireHearthCoordinator(userId, id);
  if ('error' in result) return result.error;

  const bodyResult = await parseBody(request, patchHearthSchema);
  if ('error' in bodyResult) return bodyResult.error;
  const { data } = bodyResult;

  const [updated] = await db
    .update(hearths)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(hearths.id, id))
    .returning();

  if (!updated) return apiError('Hearth not found', 404);

  return NextResponse.json(updated);
}
