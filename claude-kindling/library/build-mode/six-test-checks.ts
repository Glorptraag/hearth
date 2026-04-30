/**
 * Six-test quality gate — runs after sparse-content checks have passed for an
 * activity, scoring the activity against the six tests in `CLAUDE.md` §8 and
 * `design/educational-design-reference.md`.
 *
 * Codes are namespaced `six-test:*` so they don't collide with the
 * field-completeness codes from `sparse-content-checks.ts`.
 *
 * **Severity policy** (see plan §"Six-test gate"):
 *   - HARD-FAIL — structural impossibilities only:
 *     * `six-test:no-facilitator-guidance` (>10 min activity with empty before+during)
 *     * `six-test:material-handwaving` (consolidated from sparse-content's library-book regex)
 *     * `six-test:modality-age-mismatch` (under-7 with written/symbolic modality)
 *   - SOFT-WARN — heuristic / lint-style:
 *     * `six-test:rote-verbs-only`
 *     * `six-test:pedagogy-jargon`
 *     * `six-test:tier3-no-alternative`
 *     * `six-test:internal-state-prompts`
 *     * `six-test:duration-spread-too-wide`
 *     * `six-test:duration-too-long`
 *     * `six-test:high-modality-low-age` (older child, sensory-only)
 *
 * The verb / jargon / pattern lists are exposed in the `CONSTANTS` block at the
 * top so Drew can adjust precedents without scrolling through code.
 */

import type { ActivityCheckInput, CheckResult } from './sparse-content-checks';

// ─── Tunable constants ──────────────────────────────────────────────────────
//
// These are intentionally hoisted into a named export so a future scribe-mode
// session can adjust thresholds without code-spelunking. The defaults mirror
// the heuristics in `educational-design-reference.md` §5/§6/§8 and
// `authoring-ruleset.md` §3 / §4.

export const SIX_TEST_CONSTANTS = {
  // Develops outcome — soft-warn if instructions only contain rote verbs.
  ROTE_VERBS: [
    'colour',
    'color',
    'cut',
    'glue',
    'paste',
    'tape',
    'trace',
    'fill',
    'circle',
    'tick',
  ],
  COGNITIVE_VERBS: [
    'predict',
    'explain',
    'compare',
    'observe',
    'contrast',
    'investigate',
    'describe',
    'reason',
    'wonder',
    'notice',
    'discuss',
    'sort',
    'classify',
    'estimate',
    'measure',
    'record',
    'sketch',
    'reflect',
  ],

  // Parent-facilitable — soft-warn if pedagogy-specific terms leak into instructions
  // or facilitator "during". Scoped intentionally narrow — pack/module-level
  // worldview tags legitimately reference these movements.
  PEDAGOGY_JARGON: [
    /\bcharlotte\s+mason\b/i,
    /\bmontessori\b/i,
    /\bnarration\b/i,
    /\bprepared\s+environment\b/i,
    /\bwaldorf\b/i,
    /\bsteiner\b/i,
    /\breggio\b/i,
  ],

  // Materials handwaving — consolidate the patterns from sparse-content's
  // HANDWAVING_PATTERNS plus a few six-test-specific ones.
  MATERIAL_HANDWAVING: [
    /\bfind\s+a\s+library\s+book\b/i,
    /\bsearch\s+online\b/i,
    /\bwatch\s+a\s+youtube\b/i,
    /\buse\s+any\s+(?:age-appropriate|book|picture)\b/i,
    /\bprint\s+out\s+a\s+worksheet\s+from\b/i,
  ],

  // Observable evidence — soft-warn if every observation prompt is internal-state.
  INTERNAL_STATE_VERBS: [
    'understands',
    'understand',
    'knows',
    'know',
    'appreciates',
    'appreciate',
    'realises',
    'realises',
    'realizes',
    'realize',
    'feels',
    'feel',
    'thinks',
    'think',
  ],
  OBSERVABLE_VERBS: [
    'retells',
    'retell',
    'points',
    'point',
    'counts',
    'count',
    'draws',
    'draw',
    'explains',
    'explain',
    'shows',
    'show',
    'sorts',
    'sort',
    'names',
    'name',
    'describes',
    'describe',
    'compares',
    'compare',
    'gestures',
    'gesture',
    'matches',
    'match',
    'measures',
    'measure',
    'records',
    'record',
  ],

  // Realistic duration — heuristic thresholds.
  DURATION_SPREAD_MAX: 30,    // soft-warn if max-min > 30
  DURATION_LONG_THRESHOLD: 60, // soft-warn if max > 60 without multi-session note
  MULTI_SESSION_HINTS: [/multi[-\s]?session/i, /\bbreak\b/i, /\bsplit\b/i],

  // Modality vs age.
  YOUNG_AGE_MAX: 6,             // ≤ 6 = "young"
  OLDER_AGE_MIN: 8,             // ≥ 8 = "older"
  YOUNG_BLOCKED_MODALITIES: ['written', 'symbolic'],
  OLDER_SOFT_MODALITY: 'sensory',

  // Pivot section trigger (mirrors sparse-content's >10).
  GUIDANCE_PIVOT_THRESHOLD: 10,
} as const;

// ─── Input shape — extends the sparse-content input with the extra fields we need ─

export interface SixTestActivityInput extends ActivityCheckInput {
  /** From the parent module's spec (or the module Sanity doc). */
  ageRange?: { min: number; max: number } | null;
  /** From the parent module's spec — used to gauge whether the activity advances it. */
  targetUnderstanding?: string | null;
  /**
   * Material tier — sparse-content already collects materials with name/required/alternative;
   * we additionally check tier (when known) for the "tier 3+ without alternative" warning.
   * `tier` is per-material; if undefined, we skip the per-material tier check.
   */
  materials?: { name: string; required?: boolean; alternative?: string; tier?: number }[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function tokenSet(s: string | null | undefined): Set<string> {
  if (!s) return new Set();
  return new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

function anyMatchInString(s: string | null | undefined, patterns: RegExp[]): boolean {
  if (!s) return false;
  return patterns.some((re) => re.test(s));
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

// ─── Entry point ────────────────────────────────────────────────────────────

export function sixTestCheckActivity(input: SixTestActivityInput): CheckResult {
  const hardFails: string[] = [];
  const softWarnings: string[] = [];
  const C = SIX_TEST_CONSTANTS;

  const instructions = (input.instructions ?? '').trim();
  const before = (input.facilitatorGuidance?.before ?? '').trim();
  const during = (input.facilitatorGuidance?.during ?? '').trim();
  const challenges = (input.facilitatorGuidance?.challenges ?? '').trim();

  // ── Test 1: Develops outcome — soft-warn if instructions only have rote verbs.
  // We tokenise instructions and check whether any cognitive verb appears.
  // Skip if instructions are missing — sparse-content already hard-failed that.
  if (instructions.length > 0) {
    const insTokens = tokenSet(instructions);
    const hasCognitive = C.COGNITIVE_VERBS.some((v) => insTokens.has(v));
    const hasRote = C.ROTE_VERBS.some((v) => insTokens.has(v));
    if (!hasCognitive && hasRote) {
      softWarnings.push('six-test:rote-verbs-only');
    }
  }

  // ── Test 2: Parent-facilitable
  //   2a. hard-fail if duration > threshold AND both before+during empty
  if (
    input.duration &&
    input.duration.max > C.GUIDANCE_PIVOT_THRESHOLD &&
    !before &&
    !during
  ) {
    hardFails.push('six-test:no-facilitator-guidance');
  }
  //   2b. soft-warn if pedagogy jargon leaks into instructions OR facilitator "during"
  //       (NOT before/challenges and NOT module-level worldview, which is intentionally scoped).
  if (
    anyMatchInString(instructions, [...C.PEDAGOGY_JARGON]) ||
    anyMatchInString(during, [...C.PEDAGOGY_JARGON])
  ) {
    softWarnings.push('six-test:pedagogy-jargon');
  }

  // ── Test 3: Accessible materials
  //   3a. consolidated material handwaving check (hard-fail)
  if (
    anyMatchInString(instructions, [...C.MATERIAL_HANDWAVING]) ||
    (input.materials ?? []).some((m) => anyMatchInString(m.name, [...C.MATERIAL_HANDWAVING]))
  ) {
    hardFails.push('six-test:material-handwaving');
  }
  //   3b. tier 3+ without alternative (soft warning)
  for (const m of input.materials ?? []) {
    if (typeof m.tier === 'number' && m.tier >= 3) {
      if (!m.alternative || m.alternative.trim().length === 0) {
        softWarnings.push('six-test:tier3-no-alternative');
        break;
      }
    }
  }

  // ── Test 4: Observable evidence
  // Soft-warn if every observation prompt is internal-state without an observable verb.
  const prompts = input.observationPrompts ?? [];
  if (prompts.length > 0) {
    const allInternal = prompts.every((p) => {
      const promptTokens = tokenSet(p);
      const hasObservable = C.OBSERVABLE_VERBS.some((v) => promptTokens.has(v));
      const hasInternal = C.INTERNAL_STATE_VERBS.some((v) => promptTokens.has(v));
      return hasInternal && !hasObservable;
    });
    if (allInternal) {
      softWarnings.push('six-test:internal-state-prompts');
    }
  }

  // ── Test 5: Realistic duration
  if (input.duration) {
    const spread = input.duration.max - input.duration.min;
    if (spread > C.DURATION_SPREAD_MAX) {
      softWarnings.push('six-test:duration-spread-too-wide');
    }
    if (input.duration.max > C.DURATION_LONG_THRESHOLD) {
      const guidanceText = `${before}\n${during}\n${challenges}`;
      const hasMultiSessionHint = anyMatchInString(guidanceText, [...C.MULTI_SESSION_HINTS]);
      if (!hasMultiSessionHint) {
        softWarnings.push('six-test:duration-too-long');
      }
    }
  }

  // ── Test 6: Modality vs age
  if (input.ageRange && input.modality) {
    if (
      input.ageRange.min <= C.YOUNG_AGE_MAX &&
      (C.YOUNG_BLOCKED_MODALITIES as readonly string[]).includes(input.modality)
    ) {
      hardFails.push('six-test:modality-age-mismatch');
    }
    if (
      input.ageRange.min >= C.OLDER_AGE_MIN &&
      input.modality === C.OLDER_SOFT_MODALITY
    ) {
      softWarnings.push('six-test:high-modality-low-age');
    }
  }

  return {
    hardFails: dedupe(hardFails),
    softWarnings: dedupe(softWarnings),
  };
}
