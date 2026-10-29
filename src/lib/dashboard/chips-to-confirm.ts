/**
 * "To confirm" on the Dashboard (pivot W5.3): recent moments whose proposed
 * chips the parent hasn't confirmed yet. Pure.
 *
 * Proposals come from `deriveProposals` (the Confirm surface's own rule — D-OS2
 * attribution, H6 suppression), so the Dashboard shows exactly the chips the
 * Confirm surface would. A chip counts as confirmed when the parent's
 * assertion exists for that (learner, DLO) — the row the confirm seam
 * (`src/lib/logger/confirm-client.ts`) writes. A (learner, DLO) shown under a
 * newer moment isn't repeated under an older one.
 */
import type { AiEnrichment } from '@/types/enrichment';
import { deriveProposals, type Proposal, type ProposalLearner } from '@/lib/logger/proposals';

export type ChipsEntryInput = {
  id: string;
  title: string;
  dateOccurred: string;
  learnerIds: readonly string[] | null;
  aiEnrichment: AiEnrichment | null | undefined;
};

export type ChipsToConfirmEntry = {
  entryId: string;
  title: string;
  dateOccurred: string;
  proposals: Proposal[];
};

export function assertionKey(learnerId: string, dloId: string): string {
  return `${learnerId}:${dloId}`;
}

export function buildChipsToConfirm(
  entries: readonly ChipsEntryInput[],
  learners: readonly ProposalLearner[],
  assertedKeys: ReadonlySet<string>,
  opts: { maxEntries?: number } = {},
): ChipsToConfirmEntry[] {
  const maxEntries = opts.maxEntries ?? 2;
  const byId = new Map(learners.map((l) => [l.id, l]));
  const shown = new Set<string>();
  const out: ChipsToConfirmEntry[] = [];

  for (const entry of entries) {
    if (out.length >= maxEntries) break;
    const entryLearners = (entry.learnerIds ?? [])
      .map((id) => byId.get(id))
      .filter((l): l is ProposalLearner => l !== undefined);
    if (entryLearners.length === 0) continue;

    const proposals = deriveProposals(entry.aiEnrichment, entryLearners).filter((p) => {
      const key = assertionKey(p.learnerId, p.dloId);
      if (assertedKeys.has(key) || shown.has(key)) return false;
      shown.add(key);
      return true;
    });
    if (proposals.length === 0) continue;
    out.push({ entryId: entry.id, title: entry.title, dateOccurred: entry.dateOccurred, proposals });
  }
  return out;
}
