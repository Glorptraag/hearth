/**
 * Persist DLO enrichment output and declarative DLO opportunities.
 *
 * Two kinds of observation_dlo_links row exist, distinguished by evidence_state:
 *
 *   - 'observed'    — counts as evidence. Written by persistDloLinks for Haiku's
 *                     inferred DLOs, and by corroboration when a declared
 *                     opportunity is confirmed.
 *   - 'opportunity' — a completed *targeted* activity declared this DLO at the
 *                     author's tier (WS-6). NOT evidence yet. Written by
 *                     persistDeclaredOpportunities. Promoted to 'observed' only
 *                     by corroborateDloOpportunities (a per-child Haiku signal
 *                     or, later, a parent tap).
 *
 * learner_dlo_status is rolled up from 'observed' rows ONLY:
 *        - ≥1 'demonstrating' evidence → 'demonstrating'
 *        - else ≥2 'developing'        → 'developing'
 *        - else ≥1 'emerging'          → 'emerging'
 *      Status mirrors evidence accumulated to date, not just this entry.
 *
 * This is what protects the evidence bar (WS-4 / C3): a bare activity completion
 * can never move a learner's DLO status on its own — only a corroborated one can.
 * D-OS1 (decided 2026-06-13): opportunity + corroboration.
 *
 * Per-learner attribution (D-OS2): the caller decides *which* learners on the
 * entry an objective belongs to before calling — DLO evidence is no longer
 * copied to every tagged learner. Use gateLearnersByNamedSignals() to resolve
 * the attributed set from the enrichment's per_child_signals; corroboration is
 * gated to that set so an opportunity is only promoted for a named learner.
 */
import { db } from '@/lib/db';
import { observationDloLinks, learnerDloStatus } from '@/lib/db/schema';
import { eq, and, inArray, isNull, sql } from 'drizzle-orm';
import { getValidDlos } from './dlo-cache';
import { parseDloId } from './thread-tier';

export type DloTier = 'emerging' | 'developing' | 'demonstrating';

export type DloEnrichmentItem = {
  dlo_id: string;
  tier: DloTier;
  confidence: number;
  rationale?: string;
  /** Set by validateDlos when the model's claimed tier differed from the Sanity-authoritative tier. */
  claimed_tier?: string | null;
};

/** A thread + author-declared tier from an activity's capabilityTargets. threadId is the bare canonical code (e.g. "M1"). */
export type DeclaredTarget = { threadId: string; tier: DloTier };

const MIN_CONFIDENCE = 0.4;
const MAX_DLOS_PER_ENTRY = 3;
const VALID_TIERS = new Set<DloTier>(['emerging', 'developing', 'demonstrating']);

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

/**
 * Pure: map declared (thread, tier) targets to deterministic DLO ids
 * (`dlo.{threadId}.{tier}`), deduped, dropping any whose tier is invalid or
 * whose DLO isn't in the published catalog. Exported for unit testing.
 */
export function declaredTargetsToDloIds(
  targets: DeclaredTarget[] | null | undefined,
  validDloIds: Set<string>,
): Array<{ dloId: string; tier: DloTier }> {
  const seen = new Set<string>();
  const out: Array<{ dloId: string; tier: DloTier }> = [];
  for (const t of targets ?? []) {
    if (!t || typeof t.threadId !== 'string') continue;
    if (!VALID_TIERS.has(t.tier)) continue;
    const dloId = `dlo.${t.threadId}.${t.tier}`;
    if (!validDloIds.has(dloId)) continue;
    if (seen.has(dloId)) continue;
    seen.add(dloId);
    out.push({ dloId, tier: t.tier });
  }
  return out;
}

/**
 * Recompute and upsert learner_dlo_status for one (learner, dlo) from its
 * 'observed' links only. Shared by persistDloLinks and corroboration so the
 * evidence-bar arithmetic lives in exactly one place.
 */
async function recomputeLearnerDloStatus(args: {
  learnerId: string;
  dloId: string;
  confidence: number | null;
  observedAt: Date;
  // Null for a parent assertion — the status has no backing learning entry.
  sourceObservationId: string | null;
}): Promise<void> {
  const { learnerId, dloId, confidence, observedAt, sourceObservationId } = args;

  const counts = await db
    .select({
      tier: observationDloLinks.tier,
      n: sql<number>`count(*)::int`,
    })
    .from(observationDloLinks)
    .where(
      and(
        eq(observationDloLinks.learnerId, learnerId),
        eq(observationDloLinks.dloId, dloId),
        // Opportunities never count toward status — only observed evidence does.
        eq(observationDloLinks.evidenceState, 'observed'),
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

  const confidenceStr = confidence == null ? null : String(confidence);

  await db
    .insert(learnerDloStatus)
    .values({
      learnerId,
      dloId,
      status,
      confidence: confidenceStr,
      lastObservedAt: observedAt,
      sourceObservationId,
    })
    .onConflictDoUpdate({
      target: [learnerDloStatus.learnerId, learnerDloStatus.dloId],
      set: {
        status,
        confidence: confidenceStr,
        lastObservedAt: observedAt,
        sourceObservationId,
        updatedAt: new Date(),
      },
    });
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
      // These are evidence the moment they land (Haiku read the entry text).
      evidenceState: 'observed' as const,
    }))
  );

  await db.insert(observationDloLinks).values(rows);

  // Recompute status per (learner, dlo) touched by this entry.
  for (const learnerId of learnerIds) {
    for (const d of dlos) {
      await recomputeLearnerDloStatus({
        learnerId,
        dloId: d.dlo_id,
        confidence: d.confidence,
        observedAt,
        sourceObservationId: entryId,
      });
    }
  }
}

/**
 * Write declared DLO opportunities from a completed targeted activity.
 *
 * One 'opportunity' row per (learner × declared DLO), provenance 'declared'.
 * These do NOT count toward learner_dlo_status — they are intentionally left
 * uncomputed until corroborated. Returns the number of rows written.
 */
export async function persistDeclaredOpportunities(args: {
  entryId: string;
  learnerIds: string[];
  targets: DeclaredTarget[];
  observedAt: Date;
}): Promise<number> {
  const { entryId, learnerIds, targets } = args;
  if (targets.length === 0 || learnerIds.length === 0) return 0;

  const { ids: validDloIds } = await getValidDlos();
  const dloTargets = declaredTargetsToDloIds(targets, validDloIds);
  if (dloTargets.length === 0) return 0;

  const rows = learnerIds.flatMap((learnerId) =>
    dloTargets.map(({ dloId, tier }) => ({
      observationId: entryId,
      learnerId,
      dloId,
      tier,
      // Declared by the author, not measured — no model confidence to record.
      confidence: null,
      rationale: null,
      provenance: 'declared' as const,
      claimedTier: null,
      evidenceState: 'opportunity' as const,
    }))
  );

  await db.insert(observationDloLinks).values(rows);
  // Deliberately no status recompute — opportunities are not evidence yet.
  return rows.length;
}

/**
 * Promote declared opportunities to observed evidence when corroborated.
 *
 * `signals` is the corroborating evidence — Haiku's validated inferred DLOs for
 * the same entry (a per-child signal), or, in future, a parent-tapped DLO. A
 * declared opportunity is promoted only when its exact DLO id appears in the
 * signals (tier-exact, so a target can't over-claim a tier the child didn't
 * show). Promoted rows then recompute learner_dlo_status. Returns the count
 * promoted.
 */
export async function corroborateDloOpportunities(args: {
  entryId: string;
  learnerIds: string[];
  signals: Array<{ dlo_id: string; confidence?: number | null }>;
  observedAt: Date;
}): Promise<number> {
  const { entryId, learnerIds, signals, observedAt } = args;
  if (signals.length === 0 || learnerIds.length === 0) return 0;

  const confidenceByDlo = new Map<string, number | null>(
    signals.map((s) => [s.dlo_id, s.confidence ?? null]),
  );
  const signalDloIds = [...new Set(signals.map((s) => s.dlo_id))];

  let promoted = 0;
  for (const learnerId of learnerIds) {
    const updated = await db
      .update(observationDloLinks)
      .set({ evidenceState: 'observed' })
      .where(
        and(
          eq(observationDloLinks.observationId, entryId),
          eq(observationDloLinks.learnerId, learnerId),
          eq(observationDloLinks.evidenceState, 'opportunity'),
          inArray(observationDloLinks.dloId, signalDloIds),
        ),
      )
      .returning({ dloId: observationDloLinks.dloId });

    for (const row of updated) {
      promoted += 1;
      await recomputeLearnerDloStatus({
        learnerId,
        dloId: row.dloId,
        confidence: confidenceByDlo.get(row.dloId) ?? null,
        observedAt,
        sourceObservationId: entryId,
      });
    }
  }
  return promoted;
}

/**
 * Record an explicit parent assertion for one (learner, DLO): "yes, I've seen
 * this". Lands an `asserted` / `observed` link with NO backing observation
 * (observation_id NULL), confidence 1, at the DLO's own authored tier (parsed
 * from the id, so a parent can only confirm the tier the catalog defines — never
 * over-claim). Recomputes learner_dlo_status, which under PRODUCTION_TIER_BAR is
 * the corroboration the "demonstrating" bar needs. Idempotent: the partial
 * unique index (learner_id, dlo_id WHERE asserted & observation_id IS NULL) makes
 * a re-confirm a no-op. Returns the asserted tier, or null if the DLO id is
 * malformed or not in the published catalog.
 */
export async function upsertParentAssertion(args: {
  learnerId: string;
  dloId: string;
  observedAt: Date;
}): Promise<{ tier: DloTier } | null> {
  const { learnerId, dloId, observedAt } = args;
  const parsed = parseDloId(dloId);
  if (!parsed) return null;
  const tier = parsed.tier as DloTier;
  const { ids } = await getValidDlos();
  if (!ids.has(dloId)) return null;

  await db
    .insert(observationDloLinks)
    .values({
      observationId: null,
      learnerId,
      dloId,
      tier,
      confidence: '1',
      rationale: null,
      provenance: 'asserted' as const,
      claimedTier: null,
      evidenceState: 'observed' as const,
    })
    .onConflictDoNothing({
      target: [observationDloLinks.learnerId, observationDloLinks.dloId],
      where: sql`provenance = 'asserted' and observation_id is null`,
    });

  await recomputeLearnerDloStatus({
    learnerId,
    dloId,
    confidence: 1,
    observedAt,
    sourceObservationId: null,
  });
  return { tier };
}

/**
 * Clear a parent assertion (dispute / undo). Deletes the parent's asserted,
 * observation-less link for the (learner, DLO) and recomputes status from
 * whatever evidence remains. Does NOT touch inferred/declared evidence.
 */
export async function clearParentAssertion(args: {
  learnerId: string;
  dloId: string;
  observedAt: Date;
}): Promise<void> {
  const { learnerId, dloId, observedAt } = args;
  await db
    .delete(observationDloLinks)
    .where(
      and(
        eq(observationDloLinks.learnerId, learnerId),
        eq(observationDloLinks.dloId, dloId),
        eq(observationDloLinks.provenance, 'asserted'),
        isNull(observationDloLinks.observationId),
      ),
    );

  await recomputeLearnerDloStatus({
    learnerId,
    dloId,
    confidence: null,
    observedAt,
    sourceObservationId: null,
  });
}
