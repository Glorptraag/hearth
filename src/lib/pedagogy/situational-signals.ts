/**
 * Situational-signal mapper — turns the Logger's structured capture context
 * (observation chips, activity-type chip, where, how long, engagement
 * ratings, child ages) into the controlled vocabulary the pedagogy corpus is
 * tagged with (`corpus/pedagogy/tags.json`: `situation` and `age_band`
 * categories).
 *
 * Why this exists: retrieval reranks chunks by tag overlap, but the only
 * caller that ever sent signals passed the raw chip labels ("Deeply focused"),
 * which match no tag, and the write-time enrichment caller sent none at all.
 * So the whole situational layer of the rerank was dead. This module is the
 * single place the two vocabularies meet; a test pins every emitted token
 * against tags.json so the mapping cannot drift silently.
 *
 * Rules:
 *  - Emit only tokens that exist in tags.json (pinned by test). Prefer the
 *    canonical form where tags.json carries near-duplicates.
 *  - Map conservatively: a chip maps to a tag only when the tag's meaning is
 *    what the chip actually says. Absence beats guesswork.
 *  - Pure and dependency-free so both the write-time enrichment path and the
 *    pre-save coach-hints path can call it.
 */
import type { LoggerContext } from '@/types/logger-context';

/** Observation chip label → corpus `situation` tags. */
export const CHIP_SIGNALS: Readonly<Record<string, readonly string[]>> = {
  // Engagement
  'Deeply focused': ['child_deeply_focused', 'long_concentration_observed'],
  'Curious': ['child_asks_many_questions', 'spontaneous_interest'],
  'Enthusiastic': ['child_deeply_interested_in_topic'],
  'Reluctant at first': ['child_resistance', 'child_resists_lesson'],
  'Easily distracted': ['child_fidgets', 'restless_child'],
  'Self-directed': ['spontaneous_interest', 'off_curriculum_engagement'],
  // Social
  'Worked alone': ['quiet_observation_moment'],
  'Collaborated': ['multi_child'],
  'Led others': ['multi_child'],
  'Asked for help': ['parent_wants_to_help_without_directing'],
  'Taught someone': ['multi_child'],
  'Negotiated / compromised': ['multi_child', 'moral_moment'],
  // Thinking
  'Asked questions': ['child_asks_many_questions'],
  'Tried alternatives': ['spontaneous_research'],
  'Persisted through difficulty': ['long_concentration_observed'],
  'Made connections': ['spontaneous_research', 'off_curriculum_engagement'],
  'Self-corrected': ['child_producing_careless_work'],
  'Explained reasoning': ['child_telling_back'],
  // Emotional
  'Proud of work': ['child_telling_back'],
  'Joyful': ['child_deeply_interested_in_topic'],
  'Calm & settled': ['quiet_observation_moment'],
  'Frustrated → resolved': ['child_resistance', 'long_concentration_observed'],
  'Surprised / delighted': ['child_fascinated_by_something'],
  'Confident': ['child_telling_back'],
};

/** Activity-type chip key → corpus `situation` tags. */
export const ACTIVITY_SIGNALS: Readonly<Record<string, readonly string[]>> = {
  nature: ['nature_walk', 'outdoor_activity', 'outdoor_free_observation'],
  reading: ['reading_aloud_session', 'after_reading'],
  freeplay: ['child_in_free_play'],
  structured: ['copywork_session'],
  social: ['multi_child'],
  // cooking / art / physical carry no situational tag today (the corpus
  // describes them through `domain`/`concept` tags, which retrieval already
  // reaches through the embedding); map only when a tag genuinely fits.
};

/**
 * Activity-type chip key → the corpus `activityType` value worked examples
 * carry (exact match drives a rerank boost). Keys without a corpus
 * counterpart pass through as a stable snake_case token so future worked
 * examples can adopt it.
 */
export const ACTIVITY_TYPE_ALIASES: Readonly<Record<string, string>> = {
  reading: 'read_aloud_and_narration',
  cooking: 'practical_life_exercise',
  nature: 'nature_study',
  art: 'creative_arts',
  physical: 'physical',
  social: 'social',
  structured: 'lesson',
  freeplay: 'free_play',
};

/** Where chip key → corpus `situation` tags. */
export const LOCATION_SIGNALS: Readonly<Record<string, readonly string[]>> = {
  outdoors: ['outdoor_activity'],
  community: ['first_visit_to_a_place'],
  // home / online: no situational tag fits today.
};

/**
 * Age bands in tags.json, as [min, max] inclusive. A child's age emits every
 * band that contains it (bands overlap on purpose in the corpus).
 */
export const AGE_BANDS: ReadonlyArray<readonly [string, number, number]> = [
  ['age_2_to_3', 2, 3],
  ['age_2_to_4', 2, 4],
  ['age_2_to_6', 2, 6],
  ['age_3_to_5', 3, 5],
  ['age_4_to_5', 4, 5],
  ['age_4_to_6', 4, 6],
  ['age_5_to_7', 5, 7],
  ['age_6_to_8', 6, 8],
  ['age_7_to_9', 7, 9],
  ['age_8_to_10', 8, 10],
  ['age_11_to_13', 11, 13],
  ['under_six', 0, 5],
];

export interface SituationalInput {
  context?: LoggerContext | null;
  /** Per-learner engagement rating (1 struggled … 4 loved it). */
  engagement?: Record<string, number> | null;
  childAges?: number[];
}

export interface SituationalSignals {
  /** Deduped corpus `situation` + `age_band` tokens, insertion-ordered. */
  signals: string[];
  /** Corpus-vocabulary activity type, or undefined when no chip was set. */
  activityType?: string;
}

export function deriveSituationalSignals(input: SituationalInput): SituationalSignals {
  const out: string[] = [];
  const add = (tokens: readonly string[] | undefined) => {
    for (const t of tokens ?? []) if (!out.includes(t)) out.push(t);
  };

  const ctx = input.context ?? undefined;
  for (const chip of ctx?.observations ?? []) add(CHIP_SIGNALS[chip]);
  if (ctx?.activityType) add(ACTIVITY_SIGNALS[ctx.activityType]);
  if (ctx?.location) add(LOCATION_SIGNALS[ctx.location]);
  // Long outdoor stretches are a situation the corpus speaks to directly.
  if (ctx?.activityType === 'nature' && ctx?.duration === '1 hr+') add(['outdoor_hours']);

  const ratings = Object.values(input.engagement ?? {}).filter((n) => Number.isFinite(n));
  if (ratings.length > 0) {
    const min = Math.min(...ratings);
    const max = Math.max(...ratings);
    if (min <= 1) add(['child_resistance']);
    if (max >= 4) add(['child_deeply_interested_in_topic']);
  }

  for (const age of input.childAges ?? []) {
    if (!Number.isFinite(age)) continue;
    for (const [tag, lo, hi] of AGE_BANDS) {
      if (age >= lo && age <= hi) add([tag]);
    }
  }

  const activityType = ctx?.activityType ? ACTIVITY_TYPE_ALIASES[ctx.activityType] ?? ctx.activityType : undefined;
  return { signals: out, activityType };
}

/** Tokens this module can ever emit — the surface the vocabulary test pins. */
export function allEmittableSignals(): string[] {
  const set = new Set<string>();
  for (const v of Object.values(CHIP_SIGNALS)) v.forEach((t) => set.add(t));
  for (const v of Object.values(ACTIVITY_SIGNALS)) v.forEach((t) => set.add(t));
  for (const v of Object.values(LOCATION_SIGNALS)) v.forEach((t) => set.add(t));
  set.add('outdoor_hours');
  set.add('child_resistance');
  set.add('child_deeply_interested_in_topic');
  for (const [tag] of AGE_BANDS) set.add(tag);
  return [...set];
}
