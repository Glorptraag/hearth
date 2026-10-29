/**
 * Server reads for the Dashboard's "Watch for" and "To confirm" sections
 * (pivot W5.3, HC-1c). Plain Postgres reads, no model calls, no snapshot.
 *
 *   - statusRowsByLearner: learner_dlo_status per child (the frontier input).
 *   - assertedKeys: `${learnerId}:${dloId}` for every parent assertion — the
 *     row the confirm seam writes, so a chip already confirmed isn't asked again.
 *   - threadLogCounts14d: observed DLO links per thread across the family in the
 *     last 14 days (the frontier's tie-break).
 */
import { and, eq, gte, inArray, isNull } from 'drizzle-orm';
import { subDays } from 'date-fns';
import { db } from '@/lib/db';
import { learnerDloStatus, observationDloLinks } from '@/lib/db/schema';
import { parseDloId } from '@/lib/ai/thread-tier';
import type { DloStatusRow } from '@/lib/watch/select';
import { assertionKey } from './chips-to-confirm';

export const THREAD_LOG_WINDOW_DAYS = 14;

export type DashboardEvidence = {
  statusRowsByLearner: Record<string, DloStatusRow[]>;
  assertedKeys: Set<string>;
  threadLogCounts14d: Record<string, number>;
};

export async function loadDashboardEvidence(learnerIds: readonly string[], now: Date = new Date()): Promise<DashboardEvidence> {
  const empty: DashboardEvidence = { statusRowsByLearner: {}, assertedKeys: new Set(), threadLogCounts14d: {} };
  if (learnerIds.length === 0) return empty;
  const ids = [...learnerIds];

  const [statusRows, asserted, recentLinks] = await Promise.all([
    db
      .select({ learnerId: learnerDloStatus.learnerId, dloId: learnerDloStatus.dloId, status: learnerDloStatus.status })
      .from(learnerDloStatus)
      .where(inArray(learnerDloStatus.learnerId, ids)),
    db
      .select({ learnerId: observationDloLinks.learnerId, dloId: observationDloLinks.dloId })
      .from(observationDloLinks)
      .where(
        and(
          inArray(observationDloLinks.learnerId, ids),
          eq(observationDloLinks.provenance, 'asserted'),
          isNull(observationDloLinks.observationId),
        ),
      ),
    db
      .select({ dloId: observationDloLinks.dloId })
      .from(observationDloLinks)
      .where(
        and(
          inArray(observationDloLinks.learnerId, ids),
          eq(observationDloLinks.evidenceState, 'observed'),
          gte(observationDloLinks.createdAt, subDays(now, THREAD_LOG_WINDOW_DAYS)),
        ),
      ),
  ]);

  const statusRowsByLearner: Record<string, DloStatusRow[]> = {};
  for (const r of statusRows) (statusRowsByLearner[r.learnerId] ||= []).push({ dloId: r.dloId, status: r.status });

  const threadLogCounts14d: Record<string, number> = {};
  for (const r of recentLinks) {
    const parsed = parseDloId(r.dloId);
    if (parsed) threadLogCounts14d[parsed.threadId] = (threadLogCounts14d[parsed.threadId] ?? 0) + 1;
  }

  return {
    statusRowsByLearner,
    assertedKeys: new Set(asserted.map((a) => assertionKey(a.learnerId, a.dloId))),
    threadLogCounts14d,
  };
}
