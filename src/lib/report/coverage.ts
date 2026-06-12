/**
 * Deterministic coverage service (WS-5).
 *
 * Server-side seam between the pure rollup (`deterministic-coverage.ts`) and the
 * two report consumers (the `/api/report/coverage` route and the PDF export
 * route, which calls this directly rather than over HTTP). Reads
 * `learner_dlo_status` × the DLO→framework mappings in Sanity and returns either
 * deterministic coverage or a fallback signal.
 *
 * Fallback contract: when the requested framework has ZERO authored mappings,
 * returns `{ mode: 'fallback' }` and the caller keeps today's LLM-derived path
 * unchanged. This is the load-bearing guarantee that nothing changes for
 * families until mapping content is authored.
 */

import { db } from '@/lib/db';
import { learnerDloStatus } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sanityClient } from '@/lib/sanity/client';
import { DLO_MAPPINGS_QUERY } from '@/lib/sanity/queries';
import {
  rollupCoverage,
  type DeterministicCoverage,
  type RegulatoryMapping,
} from './deterministic-coverage';

/** One row of DLO_MAPPINGS_QUERY. */
type DloMappingDoc = {
  _id: string;
  tier: string | null;
  threadRef: string | null;
  regulatoryMappings: RegulatoryMapping[] | null;
};

export type CoverageResult =
  | { mode: 'fallback' }
  | { mode: 'deterministic'; coverage: DeterministicCoverage };

/**
 * Compute deterministic coverage for one learner against one framework.
 *
 * Returns `{ mode: 'fallback' }` if the framework has no authored mappings; the
 * caller then renders its existing LLM-derived coverage untouched.
 */
export async function getDeterministicCoverage(input: {
  learnerId: string;
  frameworkKey: string;
}): Promise<CoverageResult> {
  const { learnerId, frameworkKey } = input;

  const [statusRows, mappingDocs] = await Promise.all([
    db
      .select({ dloId: learnerDloStatus.dloId, status: learnerDloStatus.status })
      .from(learnerDloStatus)
      .where(eq(learnerDloStatus.learnerId, learnerId)),
    sanityClient.fetch<DloMappingDoc[]>(DLO_MAPPINGS_QUERY),
  ]);

  const docs = mappingDocs ?? [];

  // Fallback the instant the framework has no authored mappings — keeps the
  // legacy path live with zero visible change until content lands.
  const frameworkHasMappings = docs.some((d) =>
    (d.regulatoryMappings ?? []).some((m) => m.frameworkKey === frameworkKey),
  );
  if (!frameworkHasMappings) return { mode: 'fallback' };

  const dloStatuses: Record<string, { status: string }> = {};
  for (const row of statusRows) dloStatuses[row.dloId] = { status: row.status };

  const mappings: Record<string, RegulatoryMapping[]> = {};
  for (const d of docs) mappings[d._id] = d.regulatoryMappings ?? [];

  const coverage = rollupCoverage({ dloStatuses, mappings, frameworkKey });
  return { mode: 'deterministic', coverage };
}
