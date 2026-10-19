/**
 * Per-child "Hearth noticed" feed — assembled at snapshot-rebuild time from
 * signals the enrichment pipeline already persists on each entry, plus two
 * rebuild-level comparisons. Deterministic; no model call (the two-layer AI
 * rule holds: write-time enrichment produced the raw text, this just decides
 * what is worth carrying forward and where it should sit).
 *
 * Sources, in the order they appear here:
 *  - journey_observation — Haiku's 1-in-5 "genuinely meaningful pattern" note.
 *    Previously visible only as a Portfolio card callout (expanded view) or as
 *    a post-save fallback when no insight suggestion existed.
 *  - per_child_signals[child].notable — a per-child sentence the prompt asks
 *    for and nothing ever rendered.
 *  - milestone crossings — detectMilestoneEntries already computes WHY an
 *    entry is a milestone (which thread / which badge) and the rebuild threw
 *    the reason away, keeping only the flag.
 *  - thread_lit — the first entry that lit a thread (from first_evidence_date).
 *  - tier_shift — a thread's parent-facing tier rose since the prior snapshot.
 *    Carried forward from the prior feed for a window, since the comparison
 *    only exists at the rebuild that observed it.
 *
 * Every text is written in Hearth's gentle-friend voice and names the child.
 */
import type { EnrichmentResult } from './enrich';
import type { MilestoneReason } from './milestone-detect';
import type { SnapshotInsight } from '@/types/snapshot';
import type { ObservationStatus } from '@/types';

export const INSIGHT_FEED_CAP = 12;
/** thread_lit entries older than this (days) are not worth announcing. */
export const THREAD_LIT_WINDOW_DAYS = 30;
/** tier_shift entries are carried forward from the prior feed for this long. */
export const TIER_SHIFT_WINDOW_DAYS = 30;

export interface InsightFeedEntry {
  id: string;
  dateOccurred: string;
  aiEnrichment: unknown;
}

export interface InsightFeedInput {
  childId: string;
  childName: string;
  /** This child's complete entries. Any order; the feed sorts. */
  entries: InsightFeedEntry[];
  /** entryId → crossings, from detectMilestoneEntries. */
  milestones: Map<string, MilestoneReason[]>;
  /** Badge id → title, for badge_ready milestone text. */
  badgeTitles: Map<string, string>;
  /** thread id → first evidence date (yyyy-MM-dd). */
  firstEvidenceByThread: Record<string, string>;
  /** thread id → parent-facing tier as the PRIOR snapshot had it. */
  priorTierByThread: Record<string, string>;
  /** thread id → parent-facing tier as THIS rebuild derived it. */
  newTierByThread: Record<string, string>;
  /** The prior snapshot's feed (for carrying tier shifts forward). */
  priorInsights: SnapshotInsight[];
  threadName: (threadId: string) => string;
  isSuppressedThread: (threadId: string) => boolean;
  /** yyyy-MM-dd for "today" — the rebuild date. */
  today: string;
}

const TIER_RANK: Record<string, number> = { unobserved: 0, emerging: 1, developing: 2, demonstrating: 3 };

const TIER_PHRASE: Record<ObservationStatus, string> = {
  emerging: 'emerging',
  developing: 'developing',
  demonstrating: 'demonstrating',
};

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function lookupNotable(
  signals: EnrichmentResult['per_child_signals'] | undefined,
  childName: string,
): string | null {
  if (!signals) return null;
  // validateEnrichment keeps keys that match the stored child name; Haiku
  // occasionally answers with a first name, so accept that too — but never
  // a sibling's line.
  const full = childName.trim().toLowerCase();
  const first = full.split(/\s+/)[0];
  const keys = Object.keys(signals);
  const key =
    keys.find((k) => k.trim().toLowerCase() === full) ??
    keys.find((k) => k.trim().toLowerCase() === first);
  const notable = key ? signals[key]?.notable : null;
  return typeof notable === 'string' && notable.trim().length > 10 ? notable.trim() : null;
}

export function buildChildInsights(input: InsightFeedInput): SnapshotInsight[] {
  const out: SnapshotInsight[] = [];
  const firstName = input.childName.split(' ')[0] || input.childName;

  // Entry-derived items: newest first so the cap keeps the freshest.
  const entries = [...input.entries].sort((a, b) => b.dateOccurred.localeCompare(a.dateOccurred));
  for (const entry of entries) {
    const enrichment = entry.aiEnrichment as EnrichmentResult | null | undefined;
    if (enrichment) {
      const journey = enrichment.journey_observation;
      if (journey && typeof journey.text === 'string' && journey.text.trim().length > 10) {
        out.push({
          id: `journey:${entry.id}`,
          kind: 'journey',
          text: journey.text.trim(),
          date: entry.dateOccurred,
          entry_id: entry.id,
          trigger: journey.trigger,
        });
      }
      const notable = lookupNotable(enrichment.per_child_signals, input.childName);
      if (notable) {
        out.push({
          id: `notable:${entry.id}`,
          kind: 'notable',
          text: notable,
          date: entry.dateOccurred,
          entry_id: entry.id,
        });
      }
    }

    for (const reason of input.milestones.get(entry.id) ?? []) {
      if (reason.kind === 'tier_advance') {
        if (input.isSuppressedThread(reason.thread_id)) continue;
        const n = reason.tier === 'developing' ? 'four' : 'eight';
        out.push({
          id: `milestone:${entry.id}:${reason.thread_id}:${reason.tier}`,
          kind: 'milestone',
          text: `${firstName} now has ${n} moments lighting ${input.threadName(reason.thread_id)} — a thread that is becoming a habit.`,
          date: entry.dateOccurred,
          entry_id: entry.id,
          thread_id: reason.thread_id,
        });
      } else {
        const title = input.badgeTitles.get(reason.badge_id);
        out.push({
          id: `milestone:${entry.id}:badge:${reason.badge_id}`,
          kind: 'milestone',
          text: title
            ? `This moment tipped ${firstName} over the line for the ${title} badge.`
            : `This moment tipped ${firstName} over a badge threshold.`,
          date: entry.dateOccurred,
          entry_id: entry.id,
        });
      }
    }
  }

  // Newly lit threads — only recent ones, so a family's whole history doesn't
  // read as "new" on the first rebuild after this ships.
  for (const [threadId, firstDate] of Object.entries(input.firstEvidenceByThread)) {
    if (input.isSuppressedThread(threadId)) continue;
    if (daysBetween(firstDate, input.today) > THREAD_LIT_WINDOW_DAYS) continue;
    out.push({
      id: `thread_lit:${threadId}`,
      kind: 'thread_lit',
      text: `A new thread lit up for ${firstName}: ${input.threadName(threadId)}.`,
      date: firstDate,
      thread_id: threadId,
    });
  }

  // Tier shifts observed at THIS rebuild (rises only — a lowered tier is the
  // honesty notice's job, never a feed item).
  for (const [threadId, newTier] of Object.entries(input.newTierByThread)) {
    if (input.isSuppressedThread(threadId)) continue;
    const prior = input.priorTierByThread[threadId];
    if (!prior) continue; // first time seen: covered by thread_lit
    if ((TIER_RANK[newTier] ?? 0) > (TIER_RANK[prior] ?? 0) && newTier in TIER_PHRASE) {
      out.push({
        id: `tier_shift:${threadId}:${newTier}`,
        kind: 'tier_shift',
        text: `${input.threadName(threadId)} has moved to ${TIER_PHRASE[newTier as ObservationStatus]} for ${firstName}.`,
        date: input.today,
        thread_id: threadId,
        tier: newTier as ObservationStatus,
      });
    }
  }
  // Carry prior tier shifts forward inside the window (dedupe by id).
  const have = new Set(out.map((i) => i.id));
  for (const prior of input.priorInsights) {
    if (prior.kind !== 'tier_shift' || have.has(prior.id)) continue;
    if (daysBetween(prior.date, input.today) > TIER_SHIFT_WINDOW_DAYS) continue;
    if (prior.thread_id && input.isSuppressedThread(prior.thread_id)) continue;
    out.push(prior);
    have.add(prior.id);
  }

  out.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  return out.slice(0, INSIGHT_FEED_CAP);
}
