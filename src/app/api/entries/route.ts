import { after, NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { getFamilyByClerkId, checkWritePermission } from '@/lib/auth/helpers';
import { eq, and, gte, lte, desc, arrayContains } from 'drizzle-orm';
import { SUBJECTS, ENTRY_SOURCES, ENTRY_STATUSES } from '@/types';
import { enrichEntry } from '@/lib/ai/enrich';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';
import { triggerDraftResume } from '@/lib/notifications/triggers';
import { rateLimit } from '@/lib/rate-limit';
import { parseBody } from '@/lib/api-helpers';
import { trackServer } from '@/lib/analytics/posthog-server';

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

  if (learnerId) {
    conditions.push(arrayContains(learningEntries.learnerIds, [learnerId]));
  }
  if (status) {
    conditions.push(eq(learningEntries.status, status));
  }
  if (startDate) {
    conditions.push(gte(learningEntries.dateOccurred, startDate));
  }
  if (endDate) {
    conditions.push(lte(learningEntries.dateOccurred, endDate));
  }

  const entries = await db
    .select()
    .from(learningEntries)
    .where(and(...conditions))
    .orderBy(desc(learningEntries.dateOccurred))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(entries);
}

const observationDetailSchema = z.object({
  detail: z.string(),
  durationMin: z.number().int().positive().optional(),
});

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
  sourceSessionId: z.string().uuid().optional(),
  status: z.enum(ENTRY_STATUSES).optional(),
  observationDetails: z.record(z.string(), observationDetailSchema).optional(),
  mode: z.enum(['guided', 'quick']).optional(),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit: 30 entries per minute per user (protects AI pipeline)
  const rl = rateLimit(`entries:${userId}`, { limit: 30, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  // Check write permission: only owner/editor can create entries (viewer is read-only)
  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions to create entries' }, { status: writeCheck.statusCode });
  }

  const result = await parseBody(request, createEntrySchema);
  if ('error' in result) return result.error;
  const parsed = result;

  const { mode, ...entryData } = parsed.data;

  // Log mode for telemetry (informational only — not gated server-side)
  if (mode) {
    console.log(JSON.stringify({ event: 'entry_save', mode, familyId: family.id }));
  }

  const [entry] = await db
    .insert(learningEntries)
    .values({
      familyId: family.id,
      ...entryData,
    })
    .returning();

  // Async AI enrichment — does not block the response.
  // CRITICAL: wrap in `after()` so Vercel serverless keeps the function
  // instance alive past the response. A bare fire-and-forget Promise
  // (the old pattern) is killed the moment NextResponse returns —
  // entries land but never get enriched, with no error trace anywhere.
  if (parsed.data.status === 'complete') {
    const enrichStart = Date.now();
    after(async () => {
      try {
        await enrichEntry({ entryId: entry.id, familyId: family.id });
        await rebuildSnapshot(family.id, 'entry_saved').catch(() => {});
        // Identify on Clerk userId so the event joins with client-side
        // events (entry_created, etc.) which identify the same way.
        trackServer('entry_enriched', userId, {
          duration_ms: Date.now() - enrichStart,
          status: 'ok',
        }, { familyId: family.id });
      } catch (err) {
        console.error('[entries/POST] AI pipeline error:', err);
        trackServer('entry_enriched', userId, {
          duration_ms: Date.now() - enrichStart,
          status: 'error',
        }, { familyId: family.id });
      }
    });
  } else {
    // Draft saved — schedule a gentle resume nudge (frequency-capped).
    // Also wrapped in `after()` for the same termination-safety reason.
    after(async () => {
      try {
        await triggerDraftResume(family.id, { title: entry.title });
      } catch (err) {
        console.error('[entries/POST] draft_resume notification error:', err);
      }
    });
  }

  return NextResponse.json(entry, { status: 201 });
}
