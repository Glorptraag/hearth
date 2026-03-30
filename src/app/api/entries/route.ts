import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { SUBJECTS, ENTRY_SOURCES, ENTRY_STATUSES } from '@/types';
import { enrichEntry } from '@/lib/ai/enrich';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const params = request.nextUrl.searchParams;
  const learnerId = params.get('learnerId');
  const status = params.get('status');
  const startDate = params.get('startDate');
  const endDate = params.get('endDate');
  const limit = parseInt(params.get('limit') ?? '50', 10);
  const offset = parseInt(params.get('offset') ?? '0', 10);

  const conditions = [eq(learningEntries.familyId, family.id)];

  if (status) {
    conditions.push(eq(learningEntries.status, status));
  }
  if (startDate) {
    conditions.push(gte(learningEntries.dateOccurred, startDate));
  }
  if (endDate) {
    conditions.push(lte(learningEntries.dateOccurred, endDate));
  }

  const query = db
    .select()
    .from(learningEntries)
    .where(and(...conditions))
    .orderBy(desc(learningEntries.dateOccurred))
    .limit(limit)
    .offset(offset);

  const entries = await query;

  const filtered = learnerId
    ? entries.filter((e) => e.learnerIds?.includes(learnerId))
    : entries;

  return NextResponse.json(filtered);
}

const createEntrySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dateOccurred: z.string().optional(),
  subjects: z.array(z.enum(SUBJECTS)).optional(),
  learnerIds: z.array(z.string().uuid()).optional(),
  engagementPerLearner: z.record(z.string(), z.number().min(1).max(4)).optional(),
  discoveriesPerLearner: z.record(z.string(), z.string()).optional(),
  evidenceUrls: z.array(z.string()).optional(),
  source: z.enum(ENTRY_SOURCES).optional(),
  sourceModuleId: z.string().optional(),
  sourceProjectId: z.string().optional(),
  sourceStageNumber: z.number().optional(),
  status: z.enum(ENTRY_STATUSES).optional(),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const body = await request.json();
  const parsed = createEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [entry] = await db
    .insert(learningEntries)
    .values({
      familyId: family.id,
      ...parsed.data,
    })
    .returning();

  // Async AI enrichment — does not block the response
  if (parsed.data.status === 'complete') {
    enrichEntry({ entryId: entry.id, familyId: family.id })
      .then(() => rebuildSnapshot(family.id, 'entry_saved'))
      .catch((err) => console.error('[entries/POST] AI pipeline error:', err));
  }

  return NextResponse.json(entry, { status: 201 });
}
