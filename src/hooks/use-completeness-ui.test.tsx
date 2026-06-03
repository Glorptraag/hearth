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
  observations: [],
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
    it('lists every missing piece for an empty form', () => {
      const { result } = renderHook(() =>
        useCompletenessUi(baseArgs({ loggerMode: 'guided' })),
      );
      expect(result.current.missingItems).toEqual([
        'Pick who was learning',
        'Describe what happened',
        'Choose an activity',
        'Add an observation',
      ]);
    });

    it('omits "Choose an activity" in quick mode', () => {
      const { result } = renderHook(() =>
        useCompletenessUi(baseArgs({ loggerMode: 'quick' })),
      );
      expect(result.current.missingItems).not.toContain('Choose an activity');
    });

    it('drops items as fields become populated', () => {
      const { result } = renderHook(() =>
        useCompletenessUi(
          baseArgs({
            selectedLearners: ['l1'],
            description: 'A description well over the twenty char threshold',
            activityType: 'nature',
            engagement: { l1: 3 },
            observations: ['Curious'],
            loggerMode: 'guided',
          }),
        ),
      );
      expect(result.current.missingItems).toEqual([]);
    });

    it('requires at least one engagement rating when learners are selected', () => {
      const { result } = renderHook(() =>
        useCompletenessUi(
          baseArgs({
            selectedLearners: ['l1', 'l2'],
            description: 'long enough description to clear the threshold',
            engagement: {},
            observations: ['x'],
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
