import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  deriveSituationalSignals,
  allEmittableSignals,
  CHIP_SIGNALS,
  ACTIVITY_TYPE_ALIASES,
} from './situational-signals';

// The Logger chip vocabulary as it was persisted to `logger_context` before the
// Notice → Confirm rebuild (D-LPS-14) removed the chips from the form. Rows
// saved in that window still carry these labels, so the mapping must keep
// covering them. Frozen here because the form's catalog was deleted with it.
const LEGACY_OBSERVATION_CHIPS = [
  'Deeply focused', 'Curious', 'Enthusiastic', 'Reluctant at first', 'Easily distracted', 'Self-directed',
  'Worked alone', 'Collaborated', 'Led others', 'Asked for help', 'Taught someone', 'Negotiated / compromised',
  'Asked questions', 'Tried alternatives', 'Persisted through difficulty', 'Made connections', 'Self-corrected', 'Explained reasoning',
  'Proud of work', 'Joyful', 'Calm & settled', 'Frustrated → resolved', 'Surprised / delighted', 'Confident',
];
const LEGACY_ACTIVITY_KEYS = ['nature', 'cooking', 'reading', 'art', 'physical', 'social', 'structured', 'freeplay'];

type TagRegistry = Record<string, { category: string }>;
const tags: TagRegistry = JSON.parse(
  readFileSync(resolve(process.cwd(), 'corpus/pedagogy/tags.json'), 'utf8'),
);

describe('situational-signals — vocabulary contract', () => {
  it('every token the mapper can emit is a registered situation or age_band tag', () => {
    const unknown = allEmittableSignals().filter((t) => !tags[t]);
    expect(unknown).toEqual([]);
    const wrongCategory = allEmittableSignals().filter(
      (t) => tags[t] && !['situation', 'age_band'].includes(tags[t].category),
    );
    expect(wrongCategory).toEqual([]);
  });

  it('every legacy Logger observation chip has a mapping entry (or an explicit decision not to)', () => {
    const unmapped = LEGACY_OBSERVATION_CHIPS.filter((c) => !(c in CHIP_SIGNALS));
    expect(unmapped).toEqual([]);
  });

  it('every legacy Logger activity-type key has an activityType alias', () => {
    const missing = LEGACY_ACTIVITY_KEYS.filter((k) => !(k in ACTIVITY_TYPE_ALIASES));
    expect(missing).toEqual([]);
  });
});

describe('deriveSituationalSignals', () => {
  it('maps chips, activity, location and duration into deduped tokens', () => {
    const { signals, activityType } = deriveSituationalSignals({
      context: {
        activityType: 'nature',
        observations: ['Deeply focused', 'Persisted through difficulty', 'Curious'],
        location: 'outdoors',
        duration: '1 hr+',
      },
    });
    expect(signals).toEqual([
      'child_deeply_focused',
      'long_concentration_observed',
      'child_asks_many_questions',
      'spontaneous_interest',
      'nature_walk',
      'outdoor_activity',
      'outdoor_free_observation',
      'outdoor_hours',
    ]);
    expect(activityType).toBe('nature_study');
  });

  it('reads engagement extremes and child ages', () => {
    const { signals } = deriveSituationalSignals({
      engagement: { a: 1, b: 4 },
      childAges: [5, 12],
    });
    expect(signals).toContain('child_resistance');
    expect(signals).toContain('child_deeply_interested_in_topic');
    expect(signals).toContain('age_4_to_6');
    expect(signals).toContain('age_5_to_7');
    expect(signals).toContain('under_six');
    expect(signals).toContain('age_11_to_13');
    expect(signals).not.toContain('age_7_to_9');
  });

  it('returns nothing for an empty context and passes unknown activity keys through', () => {
    expect(deriveSituationalSignals({})).toEqual({ signals: [], activityType: undefined });
    expect(deriveSituationalSignals({ context: { activityType: 'woodwork' } }).activityType).toBe('woodwork');
    expect(deriveSituationalSignals({ context: { activityType: 'reading' } }).activityType).toBe('read_aloud_and_narration');
  });
});
