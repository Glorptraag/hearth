/**
 * Pack-gate check — refuses to build module content unless the parent pack has
 * reached `specced` (or beyond) on the bucket lifecycle.
 *
 * Rationale: `CLAUDE.md` §3.5 says "A pack must be `specced` before any of its
 * modules can move past `specced`." The orchestrator already enforces the
 * module-level gate via `latestEventForId(events, module.kindlingId).event === 'specced'`.
 * This module mirrors that enforcement on the pack side.
 *
 * Pure read — no writes. Returns a structured result rather than throwing so
 * the caller can integrate the failure into a richer error message.
 */

import { readEvents, replayBucketState } from '../../register/helper';

const ALLOWED_PACK_BUCKETS: ReadonlySet<string> = new Set([
  'specced',
  'content_constructed',
  'assets_constructed',
  'ready_for_check',
  'checked',
  'published',
]);

export interface PackGateResult {
  ok: boolean;
  bucket: string | null;
  /** Human-friendly explanation; populated whether or not ok=true. */
  error?: string;
}

/**
 * Check whether the parent pack referenced by `packRef` has progressed far enough
 * for module-level build mode to run. Returns ok=true iff the pack's latest bucket
 * event (per `register/packs.jsonl`) is in ALLOWED_PACK_BUCKETS.
 *
 * If no events exist for the pack, returns ok=false with a hint to fire `specced`
 * via the existing `register/confirm-spec.ts` flow.
 */
export async function checkPackGate(packRef: string): Promise<PackGateResult> {
  if (!packRef) {
    return {
      ok: false,
      bucket: null,
      error: 'pack-gate: spec is missing packRef — cannot verify parent-pack bucket.',
    };
  }
  const events = await readEvents('pack');
  const bucket = replayBucketState(events, packRef);
  if (bucket === null) {
    return {
      ok: false,
      bucket: null,
      error:
        `pack-gate: no register events found for pack \`${packRef}\`. ` +
        `Build mode requires the parent pack to be at \`specced\` or beyond. ` +
        `Fire \`specced\` for the pack first (typically via a scribe-mode confirmation ` +
        `that the pack-level spec doc is complete).`,
    };
  }
  if (!ALLOWED_PACK_BUCKETS.has(bucket)) {
    return {
      ok: false,
      bucket,
      error:
        `pack-gate: pack \`${packRef}\` is at \`${bucket}\`, expected ` +
        `\`specced\` or beyond. Build mode for any of its modules cannot run yet.`,
    };
  }
  return { ok: true, bucket };
}
