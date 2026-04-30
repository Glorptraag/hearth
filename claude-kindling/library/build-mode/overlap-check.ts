/**
 * Overlap detection — flag modules whose `targetUnderstanding` is too close to an
 * already-registered module's understanding goal.
 *
 * Heuristic: Jaccard token-overlap on tokenised understandings.
 *   - >= 0.7 → blocking (the orchestrator throws)
 *   - >= 0.5 → soft warning (recorded; build proceeds)
 *
 * Token-set guard: if either side tokenises to fewer than 6 distinct tokens, we
 * skip the comparison entirely — short understandings produce noisy overlap
 * scores (a 4-word phrase shares half its content words with anything in the
 * same domain).
 *
 * Source of "registered" understandings: `register/modules.jsonl`. We walk every
 * `created` and `revised{field:'targetUnderstanding'}` event and keep the latest
 * known understanding per kindlingId. Modules that never recorded a
 * `targetUnderstanding` field on the event payload are skipped silently — the
 * register may pre-date the convention, and we don't want to re-fetch from
 * Sanity at gate time.
 */

import { readEvents } from '../../register/helper';
import { tokens, jaccard } from './text-similarity';
import type { ModuleSpec } from './spec-parser';

export interface OverlapHit {
  kindlingId: string;
  jaccard: number;
  otherUnderstanding: string;
}

export interface OverlapResult {
  blocking: OverlapHit[];
  warnings: OverlapHit[];
}

const BLOCKING_THRESHOLD = 0.7;
const WARNING_THRESHOLD = 0.5;
const MIN_TOKEN_SET_SIZE = 6;

/**
 * Build a map of kindlingId → latest known targetUnderstanding by replaying
 * `register/modules.jsonl`. Excludes the spec being built (matched by kindlingId).
 */
async function loadRegisteredUnderstandings(
  excludeKindlingId: string,
): Promise<Map<string, string>> {
  const events = await readEvents('module');
  const out = new Map<string, string>();
  // Sort ascending by ts so later events override earlier ones.
  const sorted = [...events].sort((a, b) =>
    a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0,
  );
  for (const e of sorted) {
    if (e.type !== 'module') continue;
    const id = (e.kindlingId as string) ?? (e.sanityId as string);
    if (!id || id === excludeKindlingId) continue;
    // `created` events on this orchestrator's events do NOT currently carry
    // targetUnderstanding (only title/slug/packRef). We accept any event payload
    // that exposes the field — most likely future-revised events with
    // field=targetUnderstanding+after, or a content_constructed payload extension.
    const tu = (e.targetUnderstanding as string) ?? null;
    if (typeof tu === 'string' && tu.trim().length > 0) {
      out.set(id, tu);
      continue;
    }
    // Handle revised events with `field: 'targetUnderstanding'` and an `after` digest.
    if (
      e.event === 'revised' &&
      typeof e.field === 'string' &&
      e.field === 'targetUnderstanding' &&
      typeof e.after === 'string' &&
      e.after.trim().length > 0
    ) {
      out.set(id, e.after as string);
    }
  }
  return out;
}

export async function checkOverlap(spec: ModuleSpec): Promise<OverlapResult> {
  const blocking: OverlapHit[] = [];
  const warnings: OverlapHit[] = [];

  const own = spec.targetUnderstanding ?? '';
  const ownTokens = tokens(own);
  if (ownTokens.length < MIN_TOKEN_SET_SIZE) {
    // Too short to score reliably — bail with empty result rather than emit false positives.
    return { blocking, warnings };
  }

  const registered = await loadRegisteredUnderstandings(spec.kindlingId);
  for (const [otherId, otherTu] of registered) {
    const otherTokens = tokens(otherTu);
    if (otherTokens.length < MIN_TOKEN_SET_SIZE) continue;
    const score = jaccard(ownTokens, otherTokens);
    if (score >= BLOCKING_THRESHOLD) {
      blocking.push({ kindlingId: otherId, jaccard: score, otherUnderstanding: otherTu });
    } else if (score >= WARNING_THRESHOLD) {
      warnings.push({ kindlingId: otherId, jaccard: score, otherUnderstanding: otherTu });
    }
  }
  // Sort highest-similarity first in each bucket for deterministic, reviewer-friendly output.
  blocking.sort((a, b) => b.jaccard - a.jaccard);
  warnings.sort((a, b) => b.jaccard - a.jaccard);
  return { blocking, warnings };
}
