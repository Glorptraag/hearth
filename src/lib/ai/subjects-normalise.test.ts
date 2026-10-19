import { describe, it, expect } from 'vitest';
import { normaliseDetectedSubjects, subjectsFill } from './subjects-normalise';

describe('normaliseDetectedSubjects', () => {
  it('maps display aliases onto the enum', () => {
    expect(normaliseDetectedSubjects(['The Arts'])).toEqual(['arts']);
    expect(normaliseDetectedSubjects(['HASS'])).toEqual(['hass']);
    expect(normaliseDetectedSubjects(['Health and Physical Education'])).toEqual(['hpe']);
    expect(normaliseDetectedSubjects(['Maths'])).toEqual(['mathematics']);
  });

  it('passes enum values straight through', () => {
    expect(normaliseDetectedSubjects(['science', 'languages'])).toEqual(['science', 'languages']);
  });

  it('ignores casing and surrounding whitespace', () => {
    expect(normaliseDetectedSubjects(['  MATHEMATICS ', 'ScIeNcE', '\tHistory\n'])).toEqual([
      'mathematics',
      'science',
      'hass',
    ]);
  });

  it('drops unknown subjects', () => {
    expect(normaliseDetectedSubjects(['Astrology', 'Cooking', 'science'])).toEqual(['science']);
  });

  it('dedupes after aliasing', () => {
    expect(normaliseDetectedSubjects(['Maths', 'mathematics', 'Numeracy', 'Math'])).toEqual([
      'mathematics',
    ]);
  });

  it('preserves first-seen order', () => {
    expect(normaliseDetectedSubjects(['Drama', 'Reading', 'Geography', 'Music'])).toEqual([
      'arts',
      'english',
      'hass',
    ]);
  });

  it('returns [] for null, undefined and empty input', () => {
    expect(normaliseDetectedSubjects(null)).toEqual([]);
    expect(normaliseDetectedSubjects(undefined)).toEqual([]);
    expect(normaliseDetectedSubjects([])).toEqual([]);
  });

  it('skips non-string entries defensively', () => {
    expect(
      normaliseDetectedSubjects([42, null, 'science'] as unknown as string[]),
    ).toEqual(['science']);
  });
});

describe('subjectsFill', () => {
  it('returns {} when the entry already has subjects (never overwrites)', () => {
    expect(subjectsFill(['english'], ['Maths', 'Science'])).toEqual({});
  });

  it('returns {} when nothing normalises', () => {
    expect(subjectsFill([], ['Astrology'])).toEqual({});
    expect(subjectsFill(null, [])).toEqual({});
    expect(subjectsFill(undefined, undefined)).toEqual({});
  });

  it('returns {subjects} when existing is empty and detected normalises', () => {
    expect(subjectsFill([], ['Maths', 'The Arts'])).toEqual({ subjects: ['mathematics', 'arts'] });
  });

  it('treats null / undefined existing as empty', () => {
    expect(subjectsFill(null, ['HASS'])).toEqual({ subjects: ['hass'] });
    expect(subjectsFill(undefined, ['HASS'])).toEqual({ subjects: ['hass'] });
  });
});
