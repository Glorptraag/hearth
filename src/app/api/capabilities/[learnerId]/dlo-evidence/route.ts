import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
  learners,
  observationDloLinks,
  learningEntries,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, desc } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';

/**
 * GET /api/capabilities/[learnerId]/dlo-evidence?dloId=<sanityId>
 *
 * Returns the list of observations that contributed evidence to a specific DLO
 * for a specific learner. Drives the constellation Level-4 drill-down.
 *
 * Response shape:
 *   {
 *     evidence: Array<{
 *       entryId: string | null;      // null for a parent confirmation (no entry)
 *       title: string;               // 'You confirmed this' for a parent confirmation
 *       dateOccurred: string;        // ISO date (the confirmation day for assertions)
 *       source: string;              // 'logger' | 'module' | 'hearth_session' | 'parent' | ...
 *       tier: 'emerging' | 'developing' | 'demonstrating';
 *       confidence: number | null;   // 0..1
 *       rationale: string | null;    // 1-2 sentence parent-facing Haiku output
 *       provenance: string;          // 'inferred' | 'declared' | 'asserted'
 *       createdAt: string;           // ISO timestamp link was written
 *     }>;
 *   }
 *
 * Cross-family isolation: a 404 is returned if the learner doesn't belong to
 * the signed-in user's family. dlo_id is the Sanity document _id of the DLO;
 * we never expose any other family's links because we always join through
 * `learners.familyId` first.
 */
type Params = { params: Promise<{ learnerId: string }> };

export const GET = routeHandler(async (request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const { learnerId } = await params;
  const dloId = request.nextUrl.searchParams.get('dloId');
  if (!dloId) return NextResponse.json({ error: 'dloId is required' }, { status: 400 });

  const learner = await db.query.learners.findFirst({
    where: and(eq(learners.id, learnerId), eq(learners.familyId, family.id)),
  });
  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  // Join links → entries so we can return human-readable titles + dates in a
  // single query rather than an N+1 fetch from the client. LEFT join: a
  // parent's explicit confirmation is an `asserted` link with no observation
  // (upsertParentAssertion), and it is evidence — the inner join used here
  // before meant the one moment the parent contributed never appeared in
  // their own evidence list, and the "You confirmed" provenance label could
  // never render.
  const rows = await db
    .select({
      entryId: observationDloLinks.observationId,
      title: learningEntries.title,
      dateOccurred: learningEntries.dateOccurred,
      source: learningEntries.source,
      tier: observationDloLinks.tier,
      confidence: observationDloLinks.confidence,
      rationale: observationDloLinks.rationale,
      provenance: observationDloLinks.provenance,
      createdAt: observationDloLinks.createdAt,
    })
    .from(observationDloLinks)
    .leftJoin(learningEntries, eq(learningEntries.id, observationDloLinks.observationId))
    .where(and(
      eq(observationDloLinks.learnerId, learnerId),
      eq(observationDloLinks.dloId, dloId),
      // Only observed evidence — uncorroborated declared opportunities (WS-6)
      // are not evidence yet, so they never surface in the drill-down.
      eq(observationDloLinks.evidenceState, 'observed'),
    ))
    .orderBy(desc(learningEntries.dateOccurred), desc(observationDloLinks.createdAt));

  const evidence = rows
    // A link whose entry was deleted (observationId set, no entry row) is
    // dangling — skip it rather than render a blank moment.
    .filter((r) => r.entryId === null || r.title !== null)
    .map((r) => {
      const createdAt = r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt);
      const isAssertion = r.entryId === null;
      return {
        entryId: r.entryId,
        title: isAssertion ? 'You confirmed this' : r.title!,
        dateOccurred: isAssertion ? createdAt.slice(0, 10) : r.dateOccurred!,
        source: isAssertion ? 'parent' : r.source!,
        tier: r.tier,
        confidence: r.confidence != null ? Number(r.confidence) : null,
        rationale: r.rationale,
        provenance: r.provenance,
        createdAt,
      };
    })
    // Newest first across both kinds (an assertion sorts by the day it was made).
    .sort((a, b) => b.dateOccurred.localeCompare(a.dateOccurred) || b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ evidence });
}, { route: 'GET /api/capabilities/[learnerId]/dlo-evidence' });
