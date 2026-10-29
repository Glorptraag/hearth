/**
 * The everyday watch-for, one per child (WF §3.2 "Everyday"; D-HC-4, HC-1c). Pure.
 *
 * select.ts picks each child's top frontier DLO among those with a confirmed
 * note; compose.ts writes the look-for + how line; siblings on the same DLO get
 * a per-child line. The Dashboard page calls this server-side from
 * learner_dlo_status + confirmed Sanity notes. Zero model calls.
 *
 * A child with no frontier DLO that has a confirmed note gets no card. When no
 * child has one, the result is empty and the Dashboard renders nothing.
 */
import { differenceInYears, isValid, parseISO } from 'date-fns';
import { getThreadName } from '@/lib/capability-threads';
import type { ObservationTier } from '@/types/capability-universe';
import {
  composeSiblingLines,
  composeWatchFor,
  type DloWatchNote,
  type EvidenceKind,
  type FrameworkWatchHow,
} from './compose';
import { selectWatchDlo, type DloStatusRow, type FrontierReason } from './select';

export type EverydayLearner = {
  id: string;
  name: string;
  colourToken: string | null;
  dateOfBirth: string | null;
};

export type EverydayWatchFor = {
  learnerId: string;
  learnerName: string;
  colourToken: string | null;
  dloId: string;
  threadId: string;
  threadName: string;
  tier: ObservationTier;
  kind: EvidenceKind;
  reason: FrontierReason;
  lookFor: string;
  how: string | null;
  siblingLines: string[];
  /** Opens the Logger as a check-in for this child and thread (src/lib/logger/source.ts). */
  logHref: string;
};

export function ageOn(dateOfBirth: string | null, now: Date): number | null {
  if (!dateOfBirth) return null;
  const dob = parseISO(dateOfBirth);
  return isValid(dob) ? differenceInYears(now, dob) : null;
}

export function checkInHref(learnerId: string, threadId: string, basePath = ''): string {
  const qs = new URLSearchParams({ source: 'check-in', learner: learnerId, thread: threadId });
  return `${basePath}/log?${qs.toString()}`;
}

export function buildEverydayWatchFors(input: {
  learners: readonly EverydayLearner[];
  /** learner id → that learner's learner_dlo_status rows. */
  statusRowsByLearner: Readonly<Record<string, readonly DloStatusRow[]>>;
  notes: readonly DloWatchNote[];
  framework: FrameworkWatchHow | null | undefined;
  threadLogCounts14d?: Readonly<Record<string, number>>;
  now?: Date;
  basePath?: string;
}): EverydayWatchFor[] {
  const now = input.now ?? new Date();
  const noteById = new Map(input.notes.map((n) => [n.dloId, n]));
  // Only notes that compose to a line count as confirmed (watchForConfirmedAt + neutral text).
  const confirmed = input.notes
    .filter((n) => composeWatchFor({ dlo: n, framework: null, child: { name: '', age: null } }) !== null)
    .map((n) => n.dloId);
  if (confirmed.length === 0) return [];

  const out: EverydayWatchFor[] = [];
  for (const learner of input.learners) {
    const rows = input.statusRowsByLearner[learner.id] ?? [];
    const pick = selectWatchDlo({
      statusRows: rows,
      confirmedDloIds: confirmed,
      threadLogCounts14d: input.threadLogCounts14d,
    });
    if (!pick) continue;
    const line = composeWatchFor({
      dlo: noteById.get(pick.dloId),
      framework: input.framework,
      child: { name: learner.name, age: ageOn(learner.dateOfBirth, now) },
    });
    if (!line) continue;

    const siblings = input.learners
      .filter((l) => l.id !== learner.id)
      .map((l) => ({
        name: l.name,
        status: (input.statusRowsByLearner[l.id] ?? []).find((r) => r.dloId === pick.dloId)?.status ?? null,
      }));

    out.push({
      learnerId: learner.id,
      learnerName: learner.name,
      colourToken: learner.colourToken,
      dloId: pick.dloId,
      threadId: pick.threadId,
      threadName: getThreadName(pick.threadId),
      tier: pick.tier,
      kind: line.kind,
      reason: pick.reason,
      lookFor: line.lookFor,
      how: line.how,
      siblingLines: composeSiblingLines(pick.tier, siblings),
      logHref: checkInHref(learner.id, pick.threadId, input.basePath),
    });
  }
  return out;
}
