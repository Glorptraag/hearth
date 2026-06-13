import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCompletenessUi, type UseCompletenessUiArgs } from './use-completeness-ui';

const baseArgs = (overrides: Partial<UseCompletenessUiArgs> = {}): UseCompletenessUiArgs => ({
  completeness: 0,
  loggerMode: 'quick',
  selectedLearners: [],
  description: '',
  activityType: null,
  engagement: {},
  ...overrides,
});

describe('useCompletenessUi', () => {
  describe('label tiers', () => {
    it.each([
      [95, 'Excellent'],
      [90, 'Excellent'],
      [75, 'Great'],
      [70, 'Great'],
      [60, 'Strong'],
      [55, 'Strong'],
      [45, 'Good'],
      [40, 'Good'],
      [25, 'Basic'],
      [20, 'Basic'],
      [10, 'Getting Started'],
      [0, 'Getting Started'],
    ])('completeness=%i → %s', (completeness, expected) => {
      const { result } = renderHook(() => useCompletenessUi(baseArgs({ completeness })));
      expect(result.current.label).toBe(expected);
    });
  });

  describe('hint tiers', () => {
    it.each([
      [90, 'Ready to save'],
      [70, 'Add evidence for richer record'],
      [55, 'Add observations'],
      [40, 'Rate engagement for each child'],
      [20, 'Describe what happened'],
      [0, 'Select who was learning'],
    ])('completeness=%i → %s', (completeness, expected) => {
      const { result } = renderHook(() => useCompletenessUi(baseArgs({ completeness })));
      expect(result.current.hint).toBe(expected);
    });
  });

  describe('missingItems', () => {
    it('lists the missing basics for an empty form (never "Add an observation")', () => {
      const { result } = renderHook(() =>
        useCompletenessUi(baseArgs({ loggerMode: 'guided' })),
      );
      expect(result.current.missingItems).toEqual([
        'Pick who was learning',
        'Describe what happened',
        'Choose an activity',
      ]);
      // Observations contribute points but never gate a save — they must not be
      // listed as a save blocker.
      expect(result.current.missingItems).not.toContain('Add an observation');
    });

    it('omits "Choose an activity" in quick mode', () => {
      const { result } = renderHook(() =>
        useCompletenessUi(baseArgs({ loggerMode: 'quick' })),
      );
      expect(result.current.missingItems).not.toContain('Choose an activity');
    });

    it('clears the checklist once the entry is saveable (no false required items)', () => {
      // A saveable quick entry (gate = 50) must show nothing missing — previously
      // it still nagged "Add an observation".
      const { result } = renderHook(() =>
        useCompletenessUi(
          baseArgs({
            completeness: 55,
            loggerMode: 'quick',
            selectedLearners: ['l1'],
            description: 'A description well over the twenty char threshold',
            engagement: { l1: 3 },
          }),
        ),
      );
      expect(result.current.missingItems).toEqual([]);
    });

    it('nudges for enrichment when basics are done but under the Guided gate', () => {
      // Guided gate is 65; with only the basics the score sits below it. Rather
      // than implying one item is required, surface a single soft nudge.
      const { result } = renderHook(() =>
        useCompletenessUi(
          baseArgs({
            completeness: 58,
            loggerMode: 'guided',
            selectedLearners: ['l1'],
            description: 'A description well over the twenty char threshold',
            activityType: 'nature',
            engagement: { l1: 3 },
          }),
        ),
      );
      expect(result.current.missingItems).toEqual(['Add a little more detail to save']);
    });

    it('requires at least one engagement rating when learners are selected', () => {
      const { result } = renderHook(() =>
        useCompletenessUi(
          baseArgs({
            selectedLearners: ['l1', 'l2'],
            description: 'long enough description to clear the threshold',
            engagement: {},
          }),
        ),
      );
      expect(result.current.missingItems).toContain('Rate engagement');
    });

    it('treats whitespace-only description as missing', () => {
      const { result } = renderHook(() =>
        useCompletenessUi(
          baseArgs({
            selectedLearners: ['l1'],
            description: '                              ',
          }),
        ),
      );
      expect(result.current.missingItems).toContain('Describe what happened');
    });
  });
});
