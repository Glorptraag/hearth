/**
 * The one seam between the Confirm surface and the evidence backend.
 *
 * Today a confirmed chip is a parent assertion on the DLO
 * (`POST /api/capabilities/[learnerId]/dlo/[dloId]/confirm`, provenance
 * 'asserted'); a second tap clears it. When the proposed → confirmed evidence
 * ledger lands, only this function changes.
 */
export type ProposalDecision = 'confirm' | 'dispute';

export function confirmEndpoint(learnerId: string, dloId: string): string {
  return `/api/capabilities/${encodeURIComponent(learnerId)}/dlo/${encodeURIComponent(dloId)}/confirm`;
}

export async function confirmProposal(
  proposal: { learnerId: string; dloId: string },
  action: ProposalDecision,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const res = await fetchImpl(confirmEndpoint(proposal.learnerId, proposal.dloId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(`confirm ${res.status}`);
}
