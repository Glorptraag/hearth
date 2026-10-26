/**
 * The post-save (Confirm) surface's state machine. Owned by `useNoticeSave`,
 * rendered by `ConfirmSurface`. One surface, five honest states — no density
 * branch, no spinner that hangs.
 */
import type { AiEnrichment } from '@/types/enrichment';
import type { Proposal } from './proposals';
import type { ConfirmRead } from './read-draft';
import type { NoticeSource } from './source';

export type ConfirmBase = {
  entryId: string;
  savedAtMs: number;
  learnerIds: string[];
  evidenceCount: number;
  source: NoticeSource;
  /**
   * The save carried a photo and Photo Read can run for this family (flag,
   * allowlist and opt-in) — `pending` then says "reading your photo".
   */
  readingPhoto?: boolean;
  /** What the Photo Read offers once enriched: a draft and/or a printed header (W3.3). */
  read?: ConfirmRead | null;
};

export type ConfirmState =
  /** Offline: the outbox accepted the entry; it will post on reconnect. */
  | { kind: 'queued'; learnerIds: string[] }
  /** Saved; enrichment poll running (≤30 s). */
  | (ConfirmBase & { kind: 'pending' })
  /** Enriched with at least one proposal chip. */
  | (ConfirmBase & { kind: 'proposals'; enrichment: AiEnrichment; proposals: Proposal[] })
  /** Enriched, nothing to confirm. `nobodyNamed` = multi-child entry where the enrichment named nobody. */
  | (ConfirmBase & { kind: 'nothing'; enrichment: AiEnrichment; nobodyNamed: boolean })
  /** Enrichment failed or the poll timed out. The moment itself is safe. */
  | (ConfirmBase & { kind: 'failed' });
