/**
 * Proposals — the Confirm surface's chips, derived from an enriched entry.
 *
 * Enrichment proposes at most three DLOs per entry. This module turns them into
 * per-child chips, applying the same rules the server applies when it persists
 * evidence, so what the parent sees is exactly what was recorded:
 *   - D-OS2 attribution: a single-child entry attributes that child; a
 *     multi-child entry attributes only the children the enrichment NAMED in
 *     per_child_signals; nobody named → nobody (never copy-to-all). This is a
 *     pure mirror of `gateLearnersByNamedSignals` in `src/lib/ai/dlo-persistence.ts`
 *     (which cannot be imported client-side — it loads `@/lib/db`); a parity test
 *     pins the two together.
 *   - alpha suppression: a suppressed thread (H6) never reaches a parent surface.
 *
 * Client-safe: imports only pure helpers.
 */
import type { AiEnrichment, DloEnrichmentItem } from '@/types/enrichment';
import { parseDloId } from '@/lib/ai/thread-tier';
import { getThreadName } from '@/lib/capability-threads';
import { isSuppressedThread } from '@/lib/capability-alpha-suppression';

export type ProposalTier = 'emerging' | 'developing' | 'demonstrating';

export type ProposalLearner = { id: string; name: string; colourToken: string | null };

export type Proposal = {
  /** `${learnerId}:${dloId}` — stable key for optimistic state. */
  key: string;
  learnerId: string;
  learnerName: string;
  colourToken: string | null;
  dloId: string;
  threadId: string;
  threadName: string;
  tier: ProposalTier;
  confidence: number;
};

/** Enriched = terminal success. Legacy rows predate `status`; treat populated threads as enriched. */
export function isEnriched(enrichment: AiEnrichment | null | undefined): boolean {
  if (!enrichment) return false;
  if (enrichment.status === 'enriched') return true;
  return enrichment.status === undefined && (enrichment.capability_threads?.length ?? 0) > 0;
}

/**
 * Client mirror of the D-OS2 gate. ≤1 learner → that learner; otherwise only
 * learners whose trimmed, lower-cased name is a key of per_child_signals.
 */
export function attributedLearnerIds(
  learners: ReadonlyArray<{ id: string; name: string }>,
  perChildSignals: Record<string, unknown> | null | undefined,
): string[] {
  if (learners.length <= 1) return learners.map((l) => l.id);
  const named = new Set(Object.keys(perChildSignals ?? {}).map((n) => n.trim().toLowerCase()));
  return learners.filter((l) => named.has(l.name.trim().toLowerCase())).map((l) => l.id);
}

/** Proposed DLOs that are well-formed, unsuppressed and unique by id (first wins). */
function usableDlos(enrichment: AiEnrichment): Array<DloEnrichmentItem & { threadId: string; tier: ProposalTier }> {
  const out: Array<DloEnrichmentItem & { threadId: string; tier: ProposalTier }> = [];
  const seen = new Set<string>();
  for (const d of enrichment.discrete_learning_objectives ?? []) {
    if (!d || typeof d.dlo_id !== 'string' || seen.has(d.dlo_id)) continue;
    const parsed = parseDloId(d.dlo_id);
    if (!parsed) continue;
    if (isSuppressedThread(d.dlo_id)) continue;
    seen.add(d.dlo_id);
    out.push({ ...d, threadId: parsed.threadId, tier: parsed.tier });
  }
  return out;
}

/**
 * Chips, grouped by learner in selection order. Within a learner the chip for
 * `preferThreadId` (a check-in deep link) sorts first, then confidence
 * descending, then the enrichment's own order.
 */
export function deriveProposals(
  enrichment: AiEnrichment | null | undefined,
  learners: ReadonlyArray<ProposalLearner>,
  opts: { preferThreadId?: string | null } = {},
): Proposal[] {
  if (!enrichment || !isEnriched(enrichment)) return [];
  const dlos = usableDlos(enrichment);
  if (dlos.length === 0) return [];

  const attributed = new Set(attributedLearnerIds(learners, enrichment.per_child_signals));
  const prefer = opts.preferThreadId ?? null;
  const ranked = dlos
    .map((d, index) => ({ d, index }))
    .sort((a, b) => {
      const ap = prefer !== null && a.d.threadId === prefer ? 0 : 1;
      const bp = prefer !== null && b.d.threadId === prefer ? 0 : 1;
      if (ap !== bp) return ap - bp;
      if (b.d.confidence !== a.d.confidence) return b.d.confidence - a.d.confidence;
      return a.index - b.index;
    })
    .map(({ d }) => d);

  const proposals: Proposal[] = [];
  for (const learner of learners) {
    if (!attributed.has(learner.id)) continue;
    for (const d of ranked) {
      proposals.push({
        key: `${learner.id}:${d.dlo_id}`,
        learnerId: learner.id,
        learnerName: learner.name,
        colourToken: learner.colourToken,
        dloId: d.dlo_id,
        threadId: d.threadId,
        threadName: getThreadName(d.threadId),
        tier: d.tier,
        confidence: typeof d.confidence === 'number' ? d.confidence : 0,
      });
    }
  }
  return proposals;
}

/**
 * True when a multi-child entry produced usable proposals but the enrichment
 * named nobody, so (per D-OS2) nothing is proposed. The surface says so plainly
 * rather than rendering an empty state that reads like "nothing happened".
 */
export function nobodyNamed(
  enrichment: AiEnrichment | null | undefined,
  learners: ReadonlyArray<{ id: string; name: string }>,
): boolean {
  if (!enrichment || !isEnriched(enrichment) || learners.length < 2) return false;
  if (usableDlos(enrichment).length === 0) return false;
  return attributedLearnerIds(learners, enrichment.per_child_signals).length === 0;
}
