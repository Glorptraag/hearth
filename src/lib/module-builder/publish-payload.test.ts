/**
 * Unit tests for the builder → publish payload mapping. The headline
 * regression here is subject normalization: the builder's display tags
 * ('English', 'Nature Study') used to be sent verbatim to the publish route,
 * whose Zod enum only accepts lowercase AC keys — so any module with a
 * subject selected 400'd, and the UI swallowed the failure. These tests pin
 * the mapping so that can't quietly come back.
 */
import { describe, it, expect } from 'vitest';
import {
  buildModulePublishPayload,
  durationToMinutes,
  parseAgeRange,
  publishBlockers,
  toPublishSubjects,
} from './publish-payload';
import type { SharedEditData } from './types';

function editData(overrides: Partial<SharedEditData> = {}): SharedEditData {
  return {
    pathway: 'material',
    title: 'The Secret Garden',
    targetUnderstanding: 'Stories can change how we see real places',
    watchFor: '',
    pivot: '',
    steps: [
      { id: 's1', title: 'Read aloud', instructions: 'Read a chapter together.', observationHint: 'Watch for questions' },
      { id: 's2', title: 'Respond', instructions: '', observationHint: '' },
    ],
    materials: ['The book'],
    subjects: [],
    duration: '',
    setting: 'either',
    ageRange: '',
    capabilities: [],
    provenance: {},
    ...overrides,
  };
}

describe('toPublishSubjects', () => {
  it('maps display tags to the lowercase AC keys the publish route accepts', () => {
    expect(toPublishSubjects(['English', 'HASS', 'Mathematics'])).toEqual(['english', 'hass', 'mathematics']);
  });

  it('drops tags with no AC key instead of failing the whole publish', () => {
    expect(toPublishSubjects(['Nature Study', 'Science', 'Life Skills'])).toEqual(['science']);
  });

  it('returns undefined when nothing maps (publish omits the field)', () => {
    expect(toPublishSubjects([])).toBeUndefined();
    expect(toPublishSubjects(['Nature Study'])).toBeUndefined();
  });

  it('dedupes', () => {
    expect(toPublishSubjects(['Arts', 'Arts'])).toEqual(['arts']);
  });
});

describe('durationToMinutes', () => {
  it('maps every builder duration option to real minutes', () => {
    expect(durationToMinutes('15 min')).toBe(15);
    expect(durationToMinutes('30 min')).toBe(30);
    expect(durationToMinutes('45 min')).toBe(45);
    expect(durationToMinutes('1 hour')).toBe(60);
    expect(durationToMinutes('1.5 hours')).toBe(90);
    expect(durationToMinutes('2 hours')).toBe(120);
    expect(durationToMinutes('Half day')).toBe(180);
  });

  it("does not publish '1 hour' as 1 minute (old parseRange regression)", () => {
    expect(durationToMinutes('1 hour')).not.toBe(1);
  });

  it('returns null for blank or unparseable values', () => {
    expect(durationToMinutes('')).toBeNull();
    expect(durationToMinutes('a while')).toBeNull();
  });
});

describe('parseAgeRange', () => {
  it('parses en-dash ranges', () => {
    expect(parseAgeRange('5–7')).toEqual([5, 7]);
  });

  it('collapses single-number labels', () => {
    expect(parseAgeRange('15+')).toEqual([15, 15]);
  });

  it('returns nulls for non-numeric labels', () => {
    expect(parseAgeRange('All ages')).toEqual([null, null]);
  });
});

describe('publishBlockers', () => {
  it('is empty for publishable data', () => {
    expect(publishBlockers(editData())).toEqual([]);
  });

  it('names each missing requirement', () => {
    const blockers = publishBlockers(editData({ title: '  ', targetUnderstanding: '', steps: [] }));
    expect(blockers).toHaveLength(3);
    expect(blockers.join(' ')).toContain('title');
    expect(blockers.join(' ')).toContain('understand');
    expect(blockers.join(' ')).toContain('step');
  });
});

describe('buildModulePublishPayload', () => {
  it('refuses to build when blockers exist', () => {
    const result = buildModulePublishPayload(editData({ steps: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missing).toHaveLength(1);
  });

  it('builds a payload the publish route will accept', () => {
    const result = buildModulePublishPayload(editData({
      subjects: ['English', 'Nature Study'],
      duration: '1 hour',
      ageRange: '5–7',
      setting: 'indoor',
      capabilities: [
        { threadId: 'L2', confidence: 'explicit' },
        { threadId: 'L2', confidence: 'inferred' },
        { threadId: 'M1', confidence: 'inferred' },
      ],
    }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const p = result.payload;
    expect(p.status).toBe('published');
    expect(p.createdVia).toBe('material');
    expect(p.subjects).toEqual(['english']);
    expect(p.duration).toEqual({ min: 60, max: 60 });
    expect(p.ageRange).toEqual({ min: 5, max: 7 });
    expect(p.capabilityThreadIds).toEqual(['L2', 'M1']);
    expect(p.approaches).toHaveLength(1);
    expect(p.approaches[0].activities).toHaveLength(2);
    expect(p.approaches[0].activities[0]).toMatchObject({
      title: 'Read aloud',
      instructions: 'Read a chapter together.',
      observationPrompts: ['Watch for questions'],
      setting: 'indoor',
      materials: [{ name: 'The book', required: true }],
    });
    // A step with no instructions falls back to its title so the route's
    // instructions.min(1) requirement holds.
    expect(p.approaches[0].activities[1].instructions).toBe('Respond');
  });

  it('omits optional fields rather than sending invalid values', () => {
    const result = buildModulePublishPayload(editData({
      subjects: ['Nature Study'],
      duration: 'a while',
      ageRange: 'All ages',
      capabilities: [],
    }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.subjects).toBeUndefined();
    expect(result.payload.duration).toBeUndefined();
    expect(result.payload.ageRange).toBeUndefined();
    expect(result.payload.capabilityThreadIds).toBeUndefined();
  });
});
