import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sessionReflections } from '@/lib/db/schema';
import { generateTermNarrative } from '@/lib/ai/hearth-narrative';
import { apiError, parseBody } from '@/lib/api-helpers';
import { requireSessionAccess } from '@/lib/auth/hearth-helpers';

const reflectionSchema = z.object({
  reflectionText: z.string().min(1).max(2000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const { id: hearthId, sessionId } = await params;

  const authResult = await requireSessionAccess(userId, hearthId, sessionId);
  if ('error' in authResult) return authResult.error;
  const { family } = authResult;

  const parsed = await parseBody(request, reflectionSchema);
  if ('error' in parsed) return parsed.error;
  const { data } = parsed;

  const existing = await db.query.sessionReflections.findFirst({
    where: and(
      eq(sessionReflections.sessionId, sessionId),
      eq(sessionReflections.familyId, family.id)
    ),
  });

  if (existing) {
    return apiError("You've already shared a reflection for this session", 400);
  }

  const [reflection] = await db
    .insert(sessionReflections)
    .values({
      sessionId,
      familyId: family.id,
      userId,
      reflectionText: data.reflectionText,
    })
    .returning();

  generateTermNarrative(hearthId).catch((err) =>
    console.error('[reflections/POST] narrative generation error:', err)
  );

  return NextResponse.json(reflection, { status: 201 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return apiError('Unauthorized', 401);

  const { id: hearthId, sessionId } = await params;

  const authResult = await requireSessionAccess(userId, hearthId, sessionId);
  if ('error' in authResult) return authResult.error;

  const reflections = await db.query.sessionReflections.findMany({
    where: eq(sessionReflections.sessionId, sessionId),
    orderBy: [asc(sessionReflections.createdAt)],
  });

  const familyIds = [...new Set(reflections.map((r) => r.familyId))];

  const familyRows = await db.query.families.findMany({
    where: (f, { inArray }) => inArray(f.id, familyIds),
  });

  const familyNameMap = new Map(familyRows.map((f) => [f.id, f.familyName]));

  const result = reflections.map((r) => ({
    ...r,
    familyName: familyNameMap.get(r.familyId) ?? null,
  }));

  return NextResponse.json(result);
}
