import { describe, it, expect } from 'vitest';
import {
  DRAFT_KEY,
  DRAFT_STALE_MS,
  serializeDraft,
  parseDraft,
  shouldPersistDraft,
  isRestorableDraft,
  isStaleDraft,
  type LoggerDraftFields,
} from './draft';

const baseFields = (overrides: Partial<LoggerDraftFields> = {}): LoggerDraftFields => ({
  description: '',
  selectedLearners: [],
  discoveries: {},
  activityType: null,
  lessonSubjects: [],
  engagement: {},
  whenDate: 'today',
  duration: null,
  location: null,
  observations: [],
  evidence: [],
  observationDetails: {},
  ...overrides,
});

describe('logger draft persistence', () => {
  it('uses the canonical storage key', () => {
    expect(DRAFT_KEY).toBe('hearth:logger:draft');
  });

  describe('shouldPersistDraft', () => {
    it('is false for an empty draft (no description, no learners)', () => {
      expect(shouldPersistDraft(baseFields())).toBe(false);
    });

    it('is true once a description exists', () => {
      expect(shouldPersistDraft(baseFields({ description: 'We baked bread' }))).toBe(true);
    });

    it('is true once a learner is selected, even with no description', () => {
      expect(shouldPersistDraft(baseFields({ selectedLearners: ['l1'] }))).toBe(true);
    });
  });

  describe('serializeDraft / parseDraft', () => {
    it('round-trips fields and stamps savedAt', () => {
      const fields = baseFields({
        description: 'Nature walk',
        selectedLearners: ['l1', 'l2'],
        discoveries: { l1: 'found a beetle' },
        activityType: 'nature',
        lessonSubjects: ['science'],
        engagement: { l1: 4 },
        whenDate: 'yesterday',
        duration: '45',
        location: 'outdoor',
        observations: ['curiosity'],
        evidence: [{ type: 'note', content: 'beetle sketch' }],
      });

      const restored = parseDraft(serializeDraft(fields, 1_700_000_000_000));

      expect(restored).toEqual({ ...fields, savedAt: 1_700_000_000_000 });
    });

    it('round-trips Guided-mode observation-chip details (the observe pop-up notes)', () => {
      const fields = baseFields({
        description: 'Built an arch with blocks',
        observations: ['Deeply focused'],
        observationDetails: {
          'Deeply focused': { detail: 'Kept rebuilding until the arch stood', durationMin: 30 },
        },
      });

      const restored = parseDraft(serializeDraft(fields, 1_700_000_000_000));

      expect(restored?.observationDetails).toEqual({
        'Deeply focused': { detail: 'Kept rebuilding until the arch stood', durationMin: 30 },
      });
    });

    it('returns null for absent storage', () => {
      expect(parseDraft(null)).toBeNull();
    });

    it('returns null for corrupt JSON instead of throwing', () => {
      expect(parseDraft('{not json')).toBeNull();
    });

    it('returns null for a non-object payload', () => {
      expect(parseDraft('42')).toBeNull();
      expect(parseDraft('null')).toBeNull();
    });
  });

  describe('isRestorableDraft', () => {
    it('is false for null or an empty draft', () => {
      expect(isRestorableDraft(null)).toBe(false);
      expect(isRestorableDraft({ ...baseFields(), savedAt: 1 })).toBe(false);
    });

    it('is true with a description or a selected learner', () => {
      expect(isRestorableDraft({ ...baseFields({ description: 'x' }), savedAt: 1 })).toBe(true);
      expect(isRestorableDraft({ ...baseFields({ selectedLearners: ['l1'] }), savedAt: 1 })).toBe(true);
    });
  });

  describe('isStaleDraft', () => {
    const now = 1_700_000_000_000;

    it('is false when there is no draft or no savedAt', () => {
      expect(isStaleDraft(null, now)).toBe(false);
      expect(isStaleDraft({ ...baseFields(), savedAt: 0 }, now)).toBe(false);
    });

    it('is false for a fresh draft (within 4h)', () => {
      expect(isStaleDraft({ ...baseFields(), savedAt: now - 1000 }, now)).toBe(false);
    });

    it('is true once older than the 4h threshold', () => {
      expect(isStaleDraft({ ...baseFields(), savedAt: now - DRAFT_STALE_MS - 1 }, now)).toBe(true);
    });
  });
});
