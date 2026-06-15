import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { loggerDrafts } from '@/lib/db/schema';
import { authenticatedFamily, parseBody, routeHandler } from '@/lib/api-helpers';
import { DRAFT_EXPIRY_MS, type LoggerDraft } from '@/lib/logger/draft';

/**
 * Cross-device Logger draft mirror. `localStorage` is the offline-first
 * primary (see use-logger-draft); this route is the best-effort Postgres copy
 * that lets a draft started on one device surface on another. Keyed per Clerk
 * user so two co-facilitators of the same family never clobber each other.
 *
 * GET    → the user's draft, or `{ draft: null }` if none / expired (>7 days).
 * PUT    → upsert the draft blob (fire-and-forget from the autosave timer).
 * DELETE → drop the draft (after a successful save / explicit clear).
 */

const draftEvidenceSchema = z.object({
  type: z.enum(['photo', 'quote', 'note', 'link']),
  content: z.string(),
  caption: z.string().optional(),
  url: z.string().optional(),
  name: z.string().optional(),
});

const draftObservationDetailSchema = z.object({
  detail: z.string(),
  durationMin: z.number().optional(),
});

// Mirrors the LoggerDraft shape in src/lib/logger/draft.ts. The `satisfies`
// below pins the two together so a future field on LoggerDraft fails the build
// here until it's validated.
const loggerDraftSchema = z.object({
  description: z.string(),
  selectedLearners: z.array(z.string()),
  discoveries: z.record(z.string(), z.string()),
  activityType: z.string().nullable(),
  lessonSubjects: z.array(z.string()),
  engagement: z.record(z.string(), z.number()),
  whenDate: z.enum(['today', 'yesterday', 'earlier']),
  duration: z.string().nullable(),
  location: z.string().nullable(),
  observations: z.array(z.string()),
  evidence: z.array(draftEvidenceSchema),
  observationDetails: z.record(z.string(), draftObservationDetailSchema),
  savedAt: z.number(),
}) satisfies z.ZodType<LoggerDraft>;

const putBodySchema = z.object({ draft: loggerDraftSchema });

export const GET = routeHandler(async () => {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;

  const row = await db.query.loggerDrafts.findFirst({
    where: eq(loggerDrafts.clerkUserId, result.userId),
  });

  // Read-time 7-day expiry — no cron needed. A stale row is treated as absent
  // (and lazily ignored; the next PUT overwrites it).
  if (!row || !row.updatedAt || Date.now() - row.updatedAt.getTime() > DRAFT_EXPIRY_MS) {
    return NextResponse.json({ draft: null });
  }

  return NextResponse.json({ draft: row.draftData });
}, { route: 'GET /api/logger/draft' });

export const PUT = routeHandler(async (request: NextRequest) => {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;

  const parsed = await parseBody(request, putBodySchema);
  if ('error' in parsed) return parsed.error;

  const [row] = await db
    .insert(loggerDrafts)
    .values({
      clerkUserId: result.userId,
      familyId: result.family.id,
      draftData: parsed.data.draft,
    })
    .onConflictDoUpdate({
      target: loggerDrafts.clerkUserId,
      set: { draftData: parsed.data.draft, updatedAt: new Date() },
    })
    .returning();

  return NextResponse.json({ draft: row.draftData });
}, { route: 'PUT /api/logger/draft' });

export const DELETE = routeHandler(async () => {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;

  await db.delete(loggerDrafts).where(eq(loggerDrafts.clerkUserId, result.userId));

  return NextResponse.json({ ok: true });
}, { route: 'DELETE /api/logger/draft' });
