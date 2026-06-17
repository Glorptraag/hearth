/**
 * Deterministic coverage service (WS-5).
 *
 * Server-side seam between the pure rollup (`deterministic-coverage.ts`) and the
 * two report consumers (the `/api/report/coverage` route and the PDF export
 * route, which calls this directly rather than over HTTP). Reads
 * `learner_dlo_status` × the DLO→framework mappings in Sanity and returns either
 * deterministic coverage or a fallback signal.
 *
 * Fallback contract: deterministic coverage activates only for a family with an
 * EXPLICIT, non-blank jurisdiction whose framework has authored mappings. A
 * blank/missing `state`, or a framework with ZERO authored mappings, returns
 * `{ mode: 'fallback' }` and the caller keeps today's LLM-derived path
 * unchanged. This is the load-bearing guarantee that nothing changes for
 * families until they choose a jurisdiction AND mapping content is authored.
 */

import { db } from '@/lib/db';
import { learnerDloStatus } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sanityClient } from '@/lib/sanity/client';
import { DLO_MAPPINGS_QUERY } from '@/lib/sanity/queries';
import {
  frameworkKeyForState,
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
 * Compute deterministic coverage for one learner against their family's
 * jurisdiction.
 *
 * Requires an EXPLICIT, non-blank `state`: a blank/missing jurisdiction returns
 * `{ mode: 'fallback' }` BEFORE any framework key is derived, so a family that
 * never chose a jurisdiction is never silently scored against QLD's mappings.
 * (Per the #204 coverage-risk audit, 13/18 ac-v9-qld families reached the QLD
 * framework via the blank-state default rather than an explicit QLD choice — a
 * NSW/VIC family with an unset state would be scored against QLD.) Also returns
 * `{ mode: 'fallback' }` if the family's framework has no authored mappings. In
 * either case the caller renders its existing LLM-derived coverage untouched.
 *
 * The report screen still *displays* a QLD default (`getJurisdiction`); this
 * guard is only about not activating deterministic *coverage* for blank-state
 * families.
 */
export async function getDeterministicCoverage(input: {
  learnerId: string;
  state: string | null | undefined;
}): Promise<CoverageResult> {
  const { learnerId, state } = input;

  // An explicit, non-blank jurisdiction is the gate into deterministic mode.
  if (!state || !state.trim()) return { mode: 'fallback' };

  const frameworkKey = frameworkKeyForState(state);

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
