import { describe, it, expect } from 'vitest';
import { format, subDays } from 'date-fns';
import {
  DRAFT_KEY,
  DRAFT_STALE_MS,
  LOGGER_DRAFT_VERSION,
  migrateDraft,
  serializeDraft,
  parseDraft,
  pickNewerDraft,
  shouldPersistDraft,
  isRestorableDraft,
  isStaleDraft,
  type LoggerDraft,
  type LoggerDraftFields,
} from './draft';

const NOW = 1_700_000_000_000;

const baseFields = (overrides: Partial<LoggerDraftFields> = {}): LoggerDraftFields => ({
  learnerIds: [],
  text: '',
  dateOccurred: null,
  felt: {},
  noticed: {},
  evidence: [],
  ...overrides,
});

const v2 = (overrides: Partial<LoggerDraft> = {}): LoggerDraft => ({
  ...baseFields(),
  v: LOGGER_DRAFT_VERSION,
  savedAt: NOW,
  ...overrides,
});

/** A six-section (v1) Logger draft as the old page serialised it. */
const legacy = (overrides: Record<string, unknown> = {}) => ({
  description: 'Nature walk',
  selectedLearners: ['l1'],
  discoveries: {},
  activityType: 'nature',
  lessonSubjects: ['science'],
  engagement: {},
  whenDate: 'today',
  duration: '45',
  location: 'outdoor',
  observations: ['curiosity'],
  evidence: [],
  observationDetails: {},
  savedAt: NOW,
  ...overrides,
});

describe('logger draft persistence', () => {
  it('uses the canonical storage key (unchanged so old drafts are found and migrated)', () => {
    expect(DRAFT_KEY).toBe('hearth:logger:draft');
  });

  describe('shouldPersistDraft', () => {
    it('is false for an empty draft', () => {
      expect(shouldPersistDraft(baseFields())).toBe(false);
    });

    it('is false for whitespace-only text', () => {
      expect(shouldPersistDraft(baseFields({ text: '   \n ' }))).toBe(false);
    });

    it('is true once text exists', () => {
      expect(shouldPersistDraft(baseFields({ text: 'We baked bread' }))).toBe(true);
    });

    it('is true once a learner is selected, even with no text', () => {
      expect(shouldPersistDraft(baseFields({ learnerIds: ['l1'] }))).toBe(true);
    });

    it('is true once evidence exists, even with no text or learner', () => {
      expect(
        shouldPersistDraft(baseFields({ evidence: [{ type: 'photo', content: 'https://x/p.jpg' }] })),
      ).toBe(true);
    });
  });

  describe('serializeDraft / parseDraft (v2)', () => {
    it('always writes v: 2 and stamps savedAt', () => {
      const parsed = JSON.parse(serializeDraft(baseFields({ text: 'x' }), NOW));
      expect(parsed.v).toBe(2);
      expect(parsed.savedAt).toBe(NOW);
    });

    it('round-trips every Notice field with dateReset false', () => {
      const fields = baseFields({
        learnerIds: ['l1', 'l2'],
        text: 'Nature walk',
        dateOccurred: '2026-10-06',
        felt: { l1: 4, l2: 2 },
        noticed: { l1: 'found a beetle' },
        evidence: [{ type: 'quote', content: 'beetles have six legs', caption: 'said by Emma' }],
      });

      const restored = parseDraft(serializeDraft(fields, NOW), NOW);

      expect(restored).toEqual({
        draft: { ...fields, v: 2, savedAt: NOW },
        dateReset: false,
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
      expect(parseDraft('[1,2]')).toBeNull();
    });

    it('returns null for an unknown future version (forward-safe)', () => {
      expect(migrateDraft({ v: 3, text: 'from the future', learnerIds: ['l1'] }, NOW)).toBeNull();
    });

    it('returns null for a v2 draft with nothing restorable', () => {
      expect(migrateDraft(v2(), NOW)).toBeNull();
    });

    it('falls back to now for savedAt when the stamp is missing', () => {
      const out = migrateDraft({ v: 2, text: 'no stamp' }, NOW);
      expect(out?.draft.savedAt).toBe(NOW);
      expect(out?.draft.learnerIds).toEqual([]);
    });
  });

  describe('v2 sanitising', () => {
    it('drops felt values outside 1..4', () => {
      const out = migrateDraft(
        v2({ learnerIds: ['l1', 'l2', 'l3'], felt: { l1: 4, l2: 7, l3: '3' } as never }),
        NOW,
      );
      expect(out?.draft.felt).toEqual({ l1: 4 });
    });

    it('drops felt and noticed for children no longer selected', () => {
      const out = migrateDraft(
        v2({ learnerIds: ['l1'], felt: { l1: 3, l2: 2 }, noticed: { l1: 'yes', l2: 'orphan' } }),
        NOW,
      );
      expect(out?.draft.felt).toEqual({ l1: 3 });
      expect(out?.draft.noticed).toEqual({ l1: 'yes' });
    });

    it('drops empty noticed strings', () => {
      const out = migrateDraft(v2({ learnerIds: ['l1'], noticed: { l1: '   ' } }), NOW);
      expect(out?.draft.noticed).toEqual({});
    });

    it('drops malformed evidence items and keeps optional fields on good ones', () => {
      const out = migrateDraft(
        v2({
          evidence: [
            { type: 'photo', content: 'https://x/p.jpg', url: 'https://x/p.jpg', name: 'p.jpg' },
            { type: 'video', content: 'nope' },
            { type: 'quote' },
            'string',
            null,
          ] as never,
        }),
        NOW,
      );
      expect(out?.draft.evidence).toEqual([
        { type: 'photo', content: 'https://x/p.jpg', url: 'https://x/p.jpg', name: 'p.jpg' },
      ]);
    });

    it('nulls a dateOccurred that is not an ISO day', () => {
      expect(migrateDraft(v2({ text: 'x', dateOccurred: 'yesterday' }), NOW)?.draft.dateOccurred).toBeNull();
      expect(migrateDraft(v2({ text: 'x', dateOccurred: '2026-10-06T00:00:00Z' }), NOW)?.draft.dateOccurred).toBeNull();
      expect(migrateDraft(v2({ text: 'x', dateOccurred: '2026-10-06' }), NOW)?.draft.dateOccurred).toBe('2026-10-06');
    });

    it('defaults non-array / non-record fields instead of throwing', () => {
      const out = migrateDraft(
        { v: 2, learnerIds: 'l1', text: 'ok', felt: [], noticed: 'x', evidence: {}, savedAt: NOW },
        NOW,
      );
      expect(out?.draft).toEqual(v2({ text: 'ok' }));
    });
  });

  describe('legacy v1 migration', () => {
    it('maps the six-section fields onto the Notice shape and keeps savedAt', () => {
      const out = migrateDraft(
        legacy({
          description: 'Nature walk',
          selectedLearners: ['l1', 'l2'],
          engagement: { l1: 4, l2: 2 },
          discoveries: { l1: 'found a beetle', l2: '' },
          evidence: [{ type: 'note', content: 'beetle sketch' }],
        }),
        NOW + 5_000,
      );

      expect(out).toEqual({
        draft: {
          v: 2,
          learnerIds: ['l1', 'l2'],
          text: 'Nature walk',
          dateOccurred: null,
          felt: { l1: 4, l2: 2 },
          noticed: { l1: 'found a beetle' },
          evidence: [{ type: 'note', content: 'beetle sketch' }],
          savedAt: NOW,
        },
        dateReset: false,
      });
    });

    it('filters legacy engagement to 1..4 and to selected children only', () => {
      const out = migrateDraft(
        legacy({ selectedLearners: ['l1'], engagement: { l1: 5, l2: 3 } }),
        NOW,
      );
      expect(out?.draft.felt).toEqual({});
    });

    it('drops legacy discoveries for unselected children', () => {
      const out = migrateDraft(
        legacy({ selectedLearners: ['l1'], discoveries: { l2: 'not selected' } }),
        NOW,
      );
      expect(out?.draft.noticed).toEqual({});
    });

    it("anchors 'yesterday' to the draft's own savedAt, not to now", () => {
      const savedAt = NOW - 3 * 24 * 60 * 60 * 1000;
      const out = migrateDraft(legacy({ whenDate: 'yesterday', savedAt }), NOW);
      expect(out?.draft.dateOccurred).toBe(format(subDays(new Date(savedAt), 1), 'yyyy-MM-dd'));
      expect(out?.dateReset).toBe(false);
    });

    it("anchors 'yesterday' to now when the legacy draft has no savedAt", () => {
      const out = migrateDraft(legacy({ whenDate: 'yesterday', savedAt: undefined }), NOW);
      expect(out?.draft.dateOccurred).toBe(format(subDays(new Date(NOW), 1), 'yyyy-MM-dd'));
      expect(out?.draft.savedAt).toBe(NOW);
    });

    it("turns 'earlier' into today (null) and flags dateReset", () => {
      const out = migrateDraft(legacy({ whenDate: 'earlier' }), NOW);
      expect(out?.draft.dateOccurred).toBeNull();
      expect(out?.dateReset).toBe(true);
    });

    it('returns null when only dropped fields survive (activityType / duration / location)', () => {
      expect(
        migrateDraft(
          legacy({ description: '', selectedLearners: [], evidence: [], activityType: 'nature', duration: '45', location: 'outdoor' }),
          NOW,
        ),
      ).toBeNull();
    });

    it('restores a legacy draft that has only evidence', () => {
      const out = migrateDraft(
        legacy({ description: '', selectedLearners: [], evidence: [{ type: 'photo', content: 'https://x/p.jpg' }] }),
        NOW,
      );
      expect(out?.draft.evidence).toHaveLength(1);
    });
  });

  describe('isRestorableDraft', () => {
    it('is false for null or an empty draft', () => {
      expect(isRestorableDraft(null)).toBe(false);
      expect(isRestorableDraft(v2())).toBe(false);
    });

    it('is true with text, a selected learner or evidence', () => {
      expect(isRestorableDraft(v2({ text: 'x' }))).toBe(true);
      expect(isRestorableDraft(v2({ learnerIds: ['l1'] }))).toBe(true);
      expect(isRestorableDraft(v2({ evidence: [{ type: 'link', content: 'https://x' }] }))).toBe(true);
    });
  });

  describe('isStaleDraft', () => {
    it('is false when there is no draft or no savedAt', () => {
      expect(isStaleDraft(null, NOW)).toBe(false);
      expect(isStaleDraft(v2({ savedAt: 0 }), NOW)).toBe(false);
    });

    it('is false for a fresh draft (within 4h)', () => {
      expect(isStaleDraft(v2({ savedAt: NOW - 1000 }), NOW)).toBe(false);
    });

    it('is true once older than the 4h threshold', () => {
      expect(isStaleDraft(v2({ savedAt: NOW - DRAFT_STALE_MS - 1 }), NOW)).toBe(true);
    });
  });

  describe('pickNewerDraft (cross-device last-write-wins)', () => {
    const draft = (savedAt: number, text = 'x'): LoggerDraft => v2({ text, savedAt });

    it('returns the server draft when neither is local (fresh device pickup)', () => {
      const server = draft(100);
      expect(pickNewerDraft(null, server)).toBe(server);
    });

    it('returns the local draft when the server has none', () => {
      const local = draft(100);
      expect(pickNewerDraft(local, null)).toBe(local);
    });

    it('returns null when both are absent', () => {
      expect(pickNewerDraft(null, null)).toBeNull();
    });

    it('prefers the server draft when it is strictly newer', () => {
      const local = draft(100, 'local');
      const server = draft(200, 'server');
      expect(pickNewerDraft(local, server)).toBe(server);
    });

    it('keeps the local draft when it is newer (never clobbers fresher local work)', () => {
      const local = draft(300, 'local');
      const server = draft(200, 'server');
      expect(pickNewerDraft(local, server)).toBe(local);
    });

    it('keeps the local draft on a savedAt tie (no needless re-restore)', () => {
      const local = draft(200, 'local');
      const server = draft(200, 'server');
      expect(pickNewerDraft(local, server)).toBe(local);
    });
  });
});
