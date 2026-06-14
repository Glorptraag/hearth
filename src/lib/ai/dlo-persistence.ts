/**
 * Persist DLO enrichment output:
 *   1. Insert one observation_dlo_links row per (learner, dlo) the entry covers.
 *   2. Aggregate links to compute current per-DLO status per learner:
 *        - ≥1 'demonstrating' evidence → 'demonstrating'
 *        - else ≥2 'developing'        → 'developing'
 *        - else ≥1 'emerging'          → 'emerging'
 *      Status mirrors evidence accumulated to date, not just this entry.
 *   3. Upsert learner_dlo_status.
 *
 * Per-learner attribution (D-OS2): the caller decides *which* learners on the
 * entry an objective belongs to before calling — DLO evidence is no longer
 * copied to every tagged learner. Use gateLearnersByNamedSignals() to resolve
 * the attributed set from the enrichment's per_child_signals.
 */
import { db } from '@/lib/db';
import { observationDloLinks, learnerDloStatus } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getValidDlos } from './dlo-cache';

export type DloEnrichmentItem = {
  dlo_id: string;
  tier: 'emerging' | 'developing' | 'demonstrating';
  confidence: number;
  rationale?: string;
  /** Set by validateDlos when the model's claimed tier differed from the Sanity-authoritative tier. */
  claimed_tier?: string | null;
};

const MIN_CONFIDENCE = 0.4;
const MAX_DLOS_PER_ENTRY = 3;
const VALID_TIERS = new Set(['emerging', 'developing', 'demonstrating']);

export async function validateDlos(
  raw: DloEnrichmentItem[] | undefined,
): Promise<DloEnrichmentItem[]> {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const { ids, tierById } = await getValidDlos();
  const seen = new Set<string>();
  const out: DloEnrichmentItem[] = [];
  for (const d of raw) {
    if (!d || typeof d.dlo_id !== 'string') continue;
    if (!ids.has(d.dlo_id)) continue;
    if (!VALID_TIERS.has(d.tier)) continue;
    if (typeof d.confidence !== 'number' || d.confidence < MIN_CONFIDENCE) continue;
    if (seen.has(d.dlo_id)) continue;
    seen.add(d.dlo_id);

    // Tier-coherence clamp: trust the Sanity-authoritative tier over the model's
    // claim. When they disagree, record the model's claim as claimed_tier so the
    // mismatch rate is visible in admin analytics. When they agree, claimed_tier
    // is null (the common path).
    const authoritative = tierById.get(d.dlo_id);
    const tierMismatch = authoritative != null && authoritative !== d.tier;
    const finalTier = tierMismatch
      ? authoritative
      : d.tier;

    out.push({
      dlo_id: d.dlo_id,
      tier: finalTier,
      confidence: Math.max(0, Math.min(1, d.confidence)),
      rationale: typeof d.rationale === 'string' ? d.rationale.slice(0, 500) : undefined,
      claimed_tier: tierMismatch ? d.tier : null,
    });
    if (out.length >= MAX_DLOS_PER_ENTRY) break;
  }
  return out;
}

/**
 * D-OS2 (decided by Drew, 2026-06-13) — per-learner attribution gate.
 *
 * DLO evidence attaches ONLY to the learner(s) the enrichment actually named in
 * `per_child_signals` — never copy-to-all. The rule:
 *   - 0 or 1 learner on the entry → unambiguous (the lone child IS the subject),
 *     so the gate is a no-op and that learner is attributed.
 *   - ≥2 learners → strict gate: only learners named in per_child_signals are
 *     attributed. If the enrichment named nobody, NOBODY is attributed — we
 *     never fall back to copy-to-all (that is exactly what D-OS2 forbids; a
 *     group session must not stamp a 5-year-old and a 13-year-old with the
 *     same objective).
 *
 * Names are matched case-insensitively and trimmed, mirroring the
 * per_child_signals filter in enrich.ts's validateEnrichment.
 */
export function gateLearnersByNamedSignals(args: {
  learners: { id: string; name: string }[];
  perChildSignals: Record<string, unknown> | null | undefined;
}): string[] {
  const { learners, perChildSignals } = args;
  if (learners.length <= 1) return learners.map((l) => l.id);

  const named = new Set(
    Object.keys(perChildSignals ?? {}).map((n) => n.trim().toLowerCase()),
  );
  return learners
    .filter((l) => named.has(l.name.trim().toLowerCase()))
    .map((l) => l.id);
}

export async function persistDloLinks(args: {
  entryId: string;
  learnerIds: string[];
  dlos: DloEnrichmentItem[];
  observedAt: Date;
  provenance?: 'inferred' | 'declared' | 'asserted';
}): Promise<void> {
  const { entryId, learnerIds, dlos, observedAt, provenance = 'inferred' } = args;
  if (dlos.length === 0 || learnerIds.length === 0) return;

  const rows = learnerIds.flatMap((learnerId) =>
    dlos.map((d) => ({
      observationId: entryId,
      learnerId,
      dloId: d.dlo_id,
      tier: d.tier,
      confidence: String(d.confidence),
      rationale: d.rationale ?? null,
      provenance,
      claimedTier: d.claimed_tier ?? null,
    }))
  );

  await db.insert(observationDloLinks).values(rows);

  // Recompute status per (learner, dlo) touched by this entry.
  for (const learnerId of learnerIds) {
    for (const d of dlos) {
      const counts = await db
        .select({
          tier: observationDloLinks.tier,
          n: sql<number>`count(*)::int`,
        })
        .from(observationDloLinks)
        .where(
          and(
            eq(observationDloLinks.learnerId, learnerId),
            eq(observationDloLinks.dloId, d.dlo_id),
          ),
        )
        .groupBy(observationDloLinks.tier);

      let demonstrating = 0;
      let developing = 0;
      let emerging = 0;
      for (const row of counts) {
        if (row.tier === 'demonstrating') demonstrating = row.n;
        else if (row.tier === 'developing') developing = row.n;
        else if (row.tier === 'emerging') emerging = row.n;
      }
      const status =
        demonstrating >= 1 ? 'demonstrating'
        : developing >= 2 ? 'developing'
        : emerging >= 1 ? 'emerging'
        : 'not-started';

      await db
        .insert(learnerDloStatus)
        .values({
          learnerId,
          dloId: d.dlo_id,
          status,
          confidence: String(d.confidence),
          lastObservedAt: observedAt,
          sourceObservationId: entryId,
        })
        .onConflictDoUpdate({
          target: [learnerDloStatus.learnerId, learnerDloStatus.dloId],
          set: {
            status,
            confidence: String(d.confidence),
            lastObservedAt: observedAt,
            sourceObservationId: entryId,
            updatedAt: new Date(),
          },
        });
    }
  }
}
