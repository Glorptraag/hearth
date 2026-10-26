import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { differenceInYears, isValid, parseISO } from 'date-fns';
import { db } from '@/lib/db';
import { familySettings, learners } from '@/lib/db/schema';
import { apiError, authenticatedFamily, routeHandler } from '@/lib/api-helpers';
import { sanityServerClient } from '@/lib/sanity/client';
import { FRAMEWORK_WATCH_HOW_QUERY, WATCH_FOR_NOTES_QUERY } from '@/lib/sanity/queries';
import { parseDloId } from '@/lib/ai/thread-tier';
import { isSuppressedThread } from '@/lib/capability-alpha-suppression';
import { composeWatchFor, type DloWatchNote, type FrameworkWatchHow, type WatchForLine } from '@/lib/watch/compose';

/**
 * GET /api/watch-for?learner=<id>&dlo=<dlo id>[&dlo=…] — composed "watch for
 * next" lines for one child's confirmed DLO chips on the Confirm surface
 * (W4.4; D-HC-5, D-LP-8).
 *
 * Server-side by design: dotted DLO ids are dark to the browser's Sanity
 * client, and both GROQ queries are gated on their confirmation fields, so an
 * unconfirmed note never reaches the client. Composition is a lookup
 * (`src/lib/watch/compose.ts`) — zero model calls. A DLO with no confirmed note
 * is simply absent from `items`. A Sanity failure degrades to no lines.
 *
 * Any family member may read (it's their child's own record). Another family's
 * learner → 404.
 */

const MAX_DLOS = 9;

const querySchema = z.object({
  learner: z.string().uuid(),
  dlo: z.array(z.string().min(1).max(64)).min(1).max(MAX_DLOS),
});

function ageOf(dateOfBirth: string | null, now: Date): number | null {
  if (!dateOfBirth) return null;
  const dob = parseISO(dateOfBirth);
  return isValid(dob) ? differenceInYears(now, dob) : null;
}

export const GET = routeHandler(async (request: NextRequest) => {
  const result = await authenticatedFamily({ rateLimitKey: 'watch-for', rateLimit: 120 });
  if ('error' in result) return result.error;
  const { family } = result;

  const params = request.nextUrl.searchParams;
  const parsed = querySchema.safeParse({ learner: params.get('learner'), dlo: params.getAll('dlo') });
  if (!parsed.success) return apiError('Invalid query', 400);

  const dloIds = [...new Set(parsed.data.dlo)].filter((id) => parseDloId(id) && !isSuppressedThread(id));

  const [child, settings] = await Promise.all([
    db.query.learners.findFirst({
      where: and(eq(learners.id, parsed.data.learner), eq(learners.familyId, family.id)),
      columns: { id: true, name: true, dateOfBirth: true },
    }),
    db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, family.id),
      columns: { pedagogyPreference: true },
    }),
  ]);
  if (!child) return apiError('Not found', 404);
  if (dloIds.length === 0) return NextResponse.json({ items: [] });

  let notes: DloWatchNote[] = [];
  let framework: FrameworkWatchHow | null = null;
  try {
    [notes, framework] = await Promise.all([
      sanityServerClient.fetch<DloWatchNote[]>(WATCH_FOR_NOTES_QUERY, { dloIds }),
      sanityServerClient.fetch<FrameworkWatchHow | null>(FRAMEWORK_WATCH_HOW_QUERY, {
        pedagogyKey: settings?.pedagogyPreference ?? 'eclectic',
      }),
    ]);
  } catch (err) {
    console.error('[watch-for] Sanity read failed:', err);
    return NextResponse.json({ items: [] });
  }

  const byId = new Map((Array.isArray(notes) ? notes : []).map((n) => [n.dloId, n]));
  const childInfo = { name: child.name, age: ageOf(child.dateOfBirth, new Date()) };
  const items: Array<WatchForLine & { learnerId: string }> = [];
  for (const dloId of dloIds) {
    const line = composeWatchFor({ dlo: byId.get(dloId), framework, child: childInfo });
    if (line) items.push({ ...line, learnerId: child.id });
  }

  return NextResponse.json({ items });
}, { route: 'GET /api/watch-for' });
