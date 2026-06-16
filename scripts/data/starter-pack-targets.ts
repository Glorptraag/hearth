/**
 * WS-6 — Starter Pack `capabilityTargets` proposal (editorial, per-tier).
 *
 * The "Hearth Starter Collection" pack (`drafts.seed-pack-starter-collection`,
 * 9 published activities across 3 modules). Each activity's targets were chosen
 * by reading the activity's actual content against the per-tier DLO descriptor
 * (`docs/hearth-capability-dlo-reference.md`) — NOT a blanket migrate-to-
 * `developing`. Tie-break rule (B1 gold-label principle): when a capability only
 * shows in a single familiar context, prefer the LOWER tier.
 *
 * Consumed by `scripts/apply-capability-targets.ts` (gated; dry-run by default).
 * `STARTER_PACK_TARGETS` is the apply contract (activityId → targets); the
 * `MANIFEST` carries the editorial trail for the proposal doc + review.
 *
 * Confidence:
 *   - 'high'   — activity already declared the correct thread(s); we only chose
 *                the tier. (Kitchen Chemistry / bread module.)
 *   - 'review' — threads were proposed (the activity had none, or its legacy
 *                threads were a mistag). Needs Drew's eye before/at apply.
 *
 * Verified 2026-06-16 against g5zhwbxg/production: all 9 threads + all 11
 * `dlo.<thread>.<tier>` ids resolve to published docs (scripts/probe-verify-ids.mjs).
 */

export type Tier = 'emerging' | 'developing' | 'demonstrating';
export type ProposedTarget = { threadCode: string; tier: Tier };

/** The apply contract: activity _id → capabilityTargets to set (if missing). */
export const STARTER_PACK_TARGETS: Record<string, ProposedTarget[]> = {
  // ─── Module: Kitchen Chemistry — The Magic of Bread (seed-mod-bread) ───────
  'seed-act-measure-mix': [
    { threadCode: 'M5', tier: 'developing' },
    { threadCode: 'S5', tier: 'emerging' },
  ],
  'seed-act-knead-wait': [
    { threadCode: 'S5', tier: 'developing' },
  ],
  'seed-act-shape-bake': [
    { threadCode: 'M5', tier: 'developing' },
    { threadCode: 'S5', tier: 'developing' },
  ],

  // ─── Module: Stories in the Stars (seed-mod-stars) — NO legacy threads ─────
  'seed-act-stars-a1': [
    { threadCode: 'S3', tier: 'emerging' },
    { threadCode: 'S5', tier: 'emerging' },
  ],
  'seed-act-stars-a2': [
    { threadCode: 'C5', tier: 'emerging' },
    { threadCode: 'C1', tier: 'emerging' },
  ],
  'seed-act-stars-a3': [
    { threadCode: 'H6', tier: 'developing' },
    { threadCode: 'L9', tier: 'emerging' },
  ],

  // ─── Module: Nature's Patterns (seed-mod-patterns) — legacy M1+C1 (C1 mistag) ─
  'seed-act-patterns-a1': [
    { threadCode: 'M4', tier: 'emerging' },
    { threadCode: 'M1', tier: 'emerging' },
  ],
  'seed-act-patterns-a2': [
    { threadCode: 'M4', tier: 'emerging' },
    { threadCode: 'C5', tier: 'emerging' },
  ],
  'seed-act-patterns-a3': [
    { threadCode: 'M4', tier: 'developing' },
    { threadCode: 'M1', tier: 'emerging' },
  ],
};

export type ManifestEntry = {
  module: string;
  title: string;
  /** Threads the activity declares today in `capabilityThreads` (legacy). */
  legacyThreads: string[];
  confidence: 'high' | 'review';
  /** One line per target: why this thread×tier matches the activity's content. */
  rationale: string;
};

export const STARTER_PACK_TARGETS_MANIFEST: Record<string, ManifestEntry> = {
  'seed-act-measure-mix': {
    module: 'Kitchen Chemistry: The Magic of Bread',
    title: 'Measure & Mix',
    legacyThreads: ['M5', 'S5'],
    confidence: 'high',
    rationale:
      'M5 developing — measures flour/water with cups & teaspoons, estimates before measuring, talks fractions (informal+standard units, growing accuracy). ' +
      'S5 emerging — one scaffolded observation moment ("notice if they comment on texture changes"); single detail in a familiar context → lower tier.',
  },
  'seed-act-knead-wait': {
    module: 'Kitchen Chemistry: The Magic of Bread',
    title: 'Knead & Wait',
    legacyThreads: ['S5'],
    confidence: 'high',
    rationale:
      'S5 developing — observes the dough every 10–15 min and records its size, notices texture change over time, predicts the rise. Notices change over time + describes multiple details = developing.',
  },
  'seed-act-shape-bake': {
    module: 'Kitchen Chemistry: The Magic of Bread',
    title: 'Shape, Bake & Discover',
    legacyThreads: ['S5', 'M5'],
    confidence: 'high',
    rationale:
      'M5 developing — divides into 8 equal pieces (informal-unit judgement), times the second rise, sets oven temp. ' +
      'S5 developing — connects the second rise to the first (pattern across observations) and uses sensory language when tasting (multiple details).',
  },
  'seed-act-stars-a1': {
    module: 'Stories in the Stars',
    title: 'Find the Southern Cross',
    legacyThreads: [],
    confidence: 'review',
    rationale:
      'No legacy threads — proposed. S3 emerging — "Notices sky (sun, moon, clouds, stars)" is the exact emerging descriptor; locating a constellation is naked-eye sky observation. ' +
      'S5 emerging — slows down to pick a specific star pattern out of the sky (points out a detail).',
  },
  'seed-act-stars-a2': {
    module: 'Stories in the Stars',
    title: 'Draw Your Own Constellation',
    legacyThreads: [],
    confidence: 'review',
    rationale:
      'No legacy threads — proposed. C5 emerging — connects dots on black paper to create an image of an imagined thing (explores materials, represents real/imagined). ' +
      'C1 emerging — "write its story" = a simple invented story with a beginning and end.',
  },
  'seed-act-stars-a3': {
    module: 'Stories in the Stars',
    title: 'Constellation Stories from Around the World',
    legacyThreads: [],
    confidence: 'review',
    rationale:
      'No legacy threads — proposed. H6 developing — "read and COMPARE Indigenous Australian and Greek stories about the same stars" structures a respectful cross-cultural comparison (developing); flag the tier — emerging ("notices cultural difference") if the comparison stays light. ' +
      'L9 emerging — enjoys stories read aloud and responds; comparing texts on the same topic is the upgrade path to developing.',
  },
  'seed-act-patterns-a1': {
    module: "Nature's Patterns",
    title: 'Nature Pattern Hunt',
    legacyThreads: ['M1', 'C1'],
    confidence: 'review',
    rationale:
      'Re-thread: legacy C1 (Narrative & Storytelling) is a mistag for a pattern hunt — dropped (no C1 target). ' +
      'M4 emerging — recognises/finds patterns in nature ("recognises patterns", "identifies what comes next"); M4 (Algebraic Thinking & Patterns) is the correct maths thread, not M1. ' +
      'M1 emerging — counts/collects 5 examples (one-to-one counting), kept as a light secondary.',
  },
  'seed-act-patterns-a2': {
    module: "Nature's Patterns",
    title: 'Pattern Rubbings',
    legacyThreads: ['M1', 'C1'],
    confidence: 'review',
    rationale:
      'Re-thread: legacy C1 mistag dropped; legacy M1 not carried (no counting in a rubbing). ' +
      'M4 emerging — crayon rubbings reveal/recognise the repeating pattern in a natural texture. ' +
      'C5 emerging — explores materials and texture to make an image (visual art).',
  },
  'seed-act-patterns-a3': {
    module: "Nature's Patterns",
    title: 'Fibonacci in the Garden',
    legacyThreads: ['M1', 'C1'],
    confidence: 'review',
    rationale:
      'Re-thread: legacy C1 mistag dropped. ' +
      'M4 developing — discovering the Fibonacci sequence is "identifies and describes growing patterns (1, 3, 5, 7)", a precise developing match. ' +
      'M1 emerging — counts spirals on sunflowers/pinecones (quantity counting), kept as a light secondary.',
  },
};
