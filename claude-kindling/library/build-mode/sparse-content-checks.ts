/**
 * Sparse-content detection — implements the checks described in
 * `design/sparse-content-detection.md`.
 *
 * Two surfaces:
 *   - `checkActivity(input)` — returns hard-fail and soft-warning criteria for one activity
 *   - `checkModule(input)` — returns hard-fail and soft-warning criteria for one module
 *   - `checkPack(input)` — returns hard-fail and soft-warning criteria for one pack
 *
 * The checks operate on the structured input the orchestrator collects from the user (via
 * spec + interactive prompts) BEFORE the Sanity write. This means a hard-fail can block
 * the create call entirely, so we never persist sparse content and then have to clean it up.
 *
 * The criteria_failed codes match the canonical names listed in
 * `design/sparse-content-detection.md` §5.
 */

// ─── Activity input shape ────────────────────────────────────────────────────

export interface ActivityCheckInput {
  title: string;
  instructions: string;             // the full instruction text (for keyword anti-pattern scan)
  materials?: { name: string; required?: boolean; alternative?: string }[];
  facilitatorGuidance?: { before?: string; during?: string; challenges?: string };
  duration?: { min: number; max: number };
  setting?: string | null;
  energyLevel?: string | null;
  modality?: string | null;
  observationPrompts?: string[];
  capabilityThreads?: { id: string; primary: boolean }[];
}

export interface ModuleCheckInput {
  title: string;
  targetUnderstanding: string | null;
  understandingIndicators: {
    emerging: string[];
    developing: string[];
    demonstrating: string[];
  };
  approachCount: number;
  approachModalities: (string | null)[];
  subjects?: string[];
  ageRange?: { min: number; max: number } | null;
  duration?: { min: number; max: number } | null;
  capabilityThreads?: { id: string }[];
}

export interface PackCheckInput {
  title: string;
  description?: string;
  intro?: unknown;
  moduleIds?: string[];
  worldview?: string | null;
  ageRange?: { min: number; max: number } | null;
  subjects?: string[];
  termWeeks?: number | null;
  specDocPath?: string;             // path to design/specs/{pack-slug}.md (caller resolves existence)
  specDocExists?: boolean;
}

// ─── Result shape ────────────────────────────────────────────────────────────

export interface CheckResult {
  hardFails: string[];
  softWarnings: string[];
}

export function combineResults(...results: CheckResult[]): CheckResult {
  return {
    hardFails: results.flatMap((r) => r.hardFails),
    softWarnings: results.flatMap((r) => r.softWarnings),
  };
}

export function passes(result: CheckResult): boolean {
  return result.hardFails.length === 0;
}

// ─── Anti-pattern keywords (asset architecture §4) ───────────────────────────

const HANDWAVING_PATTERNS: RegExp[] = [
  /\bfind\s+a\s+library\s+book\b/i,
  /\bsearch\s+online\b/i,
  /\bwatch\s+a\s+youtube\b/i,
  /\buse\s+any\s+(?:age-appropriate|book|picture)\b/i,
  /\bprint\s+out\s+a\s+worksheet\s+from\b/i,
];

// Conservative emoji range — matches common pictographic/emoticon ranges. Won't catch
// every variant but covers the cases the ruleset cares about (badge emoji, decorative
// glyphs, smileys). Note: technical glyphs like ✓ in checklists are also matched, which
// is intentional — they don't belong in titles.
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;

// ─── Activity check ─────────────────────────────────────────────────────────

export function checkActivity(input: ActivityCheckInput): CheckResult {
  const hardFails: string[] = [];
  const softWarnings: string[] = [];

  // instructions
  if (!input.instructions || input.instructions.trim().length === 0) {
    hardFails.push('missing-instructions');
  } else {
    const wordCount = input.instructions.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 50) softWarnings.push('thin-instructions');
    if (HANDWAVING_PATTERNS.some((re) => re.test(input.instructions))) {
      hardFails.push('library-book-handwaving');
    }
  }

  // materials
  if (input.materials === undefined) {
    hardFails.push('missing-materials');
  } else if (input.materials.length === 0) {
    softWarnings.push('empty-materials');
  }

  // Scan material names for handwaving anti-patterns too
  if (input.materials) {
    for (const m of input.materials) {
      if (HANDWAVING_PATTERNS.some((re) => re.test(m.name))) {
        hardFails.push('library-book-handwaving');
        break;
      }
    }
  }

  // facilitatorGuidance — non-optional triad
  const guidance = input.facilitatorGuidance ?? {};
  const before = (guidance.before ?? '').trim();
  const during = (guidance.during ?? '').trim();
  const challenges = (guidance.challenges ?? '').trim();
  if (!before && !during && !challenges) {
    hardFails.push('missing-facilitator-guidance');
  }
  // pivot section mandatory for activities >10 min (using max as the trigger)
  if (input.duration && input.duration.max > 10 && !challenges) {
    hardFails.push('missing-pivot-on-long-activity');
  }

  // observationPrompts
  const prompts = input.observationPrompts ?? [];
  if (prompts.length === 0) {
    hardFails.push('missing-observation-prompts');
  } else {
    if (prompts.length < 2) softWarnings.push('too-few-observation-prompts');
    if (prompts.length > 4) softWarnings.push('too-many-observation-prompts');
  }

  // capabilityThreads
  const threads = input.capabilityThreads ?? [];
  if (threads.length === 0) {
    hardFails.push('missing-thread-mappings');
  } else {
    if (threads.length > 3) hardFails.push('over-thread-cap');
    const primaryCount = threads.filter((t) => t.primary).length;
    if (threads.length === 3 && primaryCount === 3) hardFails.push('all-threads-primary');
    if (threads.length > 0 && primaryCount > 2) hardFails.push('all-threads-primary');
  }

  // duration
  if (!input.duration) {
    hardFails.push('missing-duration');
  }

  // setting / energyLevel / modality
  if (!input.setting) softWarnings.push('missing-setting');
  if (!input.energyLevel) softWarnings.push('missing-energy-level');
  if (!input.modality) softWarnings.push('missing-modality');

  // emoji in title
  if (EMOJI_RE.test(input.title)) hardFails.push('emoji-in-title');

  return dedupe({ hardFails, softWarnings });
}

// ─── Module check ───────────────────────────────────────────────────────────

export function checkModule(input: ModuleCheckInput): CheckResult {
  const hardFails: string[] = [];
  const softWarnings: string[] = [];

  if (!input.targetUnderstanding || input.targetUnderstanding.trim().length === 0) {
    hardFails.push('missing-target-understanding');
  } else if (looksLikeTopicLabel(input.targetUnderstanding)) {
    softWarnings.push('topic-label-not-insight');
  }

  const tiers = input.understandingIndicators;
  if (!tiers.emerging?.length) hardFails.push('missing-tier-indicator');
  if (!tiers.developing?.length) hardFails.push('missing-tier-indicator');
  if (!tiers.demonstrating?.length) hardFails.push('missing-tier-indicator');
  // soft check: tiers too similar
  if (
    tiers.emerging?.length &&
    tiers.developing?.length &&
    tiers.demonstrating?.length &&
    tiersTooSimilar(tiers.emerging, tiers.developing, tiers.demonstrating)
  ) {
    softWarnings.push('tier-indicators-too-similar');
  }

  if ((input.approachCount ?? 0) < 2) hardFails.push('fewer-than-2-approaches');
  const modalities = input.approachModalities.filter(Boolean) as string[];
  if (modalities.length >= 2 && modalities.every((m) => m === modalities[0])) {
    hardFails.push('same-modality-approaches');
  }

  if (!input.subjects?.length) softWarnings.push('missing-subject-or-age-range');
  if (!input.ageRange) softWarnings.push('missing-subject-or-age-range');
  if (!input.duration) softWarnings.push('missing-duration');

  if (EMOJI_RE.test(input.title)) hardFails.push('emoji-in-title');

  const threads = input.capabilityThreads ?? [];
  if (threads.length === 0) hardFails.push('missing-thread-mappings');
  if (threads.length > 3) hardFails.push('module-thread-cap-exceeded');

  return dedupe({ hardFails, softWarnings });
}

// ─── Pack check ─────────────────────────────────────────────────────────────

export function checkPack(input: PackCheckInput): CheckResult {
  const hardFails: string[] = [];
  const softWarnings: string[] = [];

  if (!input.description || input.description.trim().length === 0) {
    hardFails.push('missing-pack-description');
  }
  if (!input.intro) softWarnings.push('missing-pack-intro');
  if (!input.moduleIds || input.moduleIds.length === 0) {
    hardFails.push('empty-modules');
  }
  if (!input.worldview) hardFails.push('missing-worldview');
  if (!input.ageRange) softWarnings.push('missing-subject-or-age-range');
  if (!input.subjects?.length) softWarnings.push('missing-subject-or-age-range');
  if (!input.termWeeks) softWarnings.push('missing-term-weeks');
  if (input.specDocExists === false) hardFails.push('missing-pack-spec');
  if (EMOJI_RE.test(input.title)) hardFails.push('emoji-in-title');

  return dedupe({ hardFails, softWarnings });
}

// ─── Heuristics ─────────────────────────────────────────────────────────────

/**
 * A `targetUnderstanding` is a topic label (rather than a transferable insight) if it's
 * very short and lacks any verb-like structure. Heuristic:
 *   - fewer than 8 words → topic-label flag
 *   - starts with "Understand " or "Learn about " → topic-label flag
 */
function looksLikeTopicLabel(text: string): boolean {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 8) return true;
  if (/^(understand|learn about|know about|appreciate)\s+/i.test(text.trim())) return true;
  return false;
}

/**
 * Detect when tier indicators are reworded versions of each other rather than genuinely
 * different observable behaviours. Heuristic: high token overlap (Jaccard >0.7) between
 * any two tiers' joined indicators.
 */
function tiersTooSimilar(emerging: string[], developing: string[], demonstrating: string[]): boolean {
  const tokens = (arr: string[]) => {
    const set = new Set<string>();
    for (const s of arr) {
      for (const w of s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
        if (w.length > 3 && !STOPWORDS.has(w)) set.add(w);
      }
    }
    return set;
  };
  const e = tokens(emerging);
  const d = tokens(developing);
  const m = tokens(demonstrating);
  return jaccard(e, d) > 0.7 || jaccard(d, m) > 0.7 || jaccard(e, m) > 0.7;
}

const STOPWORDS = new Set([
  'with',
  'without',
  'when',
  'they',
  'this',
  'that',
  'their',
  'them',
  'from',
  'into',
  'have',
  'will',
  'about',
  'while',
  'some',
  'most',
  'over',
  'each',
  'than',
  'then',
  'these',
  'those',
  'where',
  'which',
  'what',
  'were',
  'been',
  'because',
  'help',
  'helps',
  'between',
]);

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function dedupe(r: CheckResult): CheckResult {
  return {
    hardFails: Array.from(new Set(r.hardFails)),
    softWarnings: Array.from(new Set(r.softWarnings)),
  };
}
