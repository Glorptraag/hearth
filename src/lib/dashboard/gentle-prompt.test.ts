/**
 * Regression tests for research log R10: the Dashboard "Gentle Prompt" card
 * read snapshot.recommendations as an array while the rebuild writes
 * { suggested_next, subject_balance } — so the card never rendered. The
 * helper is typed against SnapshotData['recommendations'], making future
 * shape drift a compile error; these tests pin the runtime contract.
 */
import { describe, it, expect } from 'vitest';
import { getGentlePrompt } from './gentle-prompt';
import type { SnapshotData, SnapshotRecommendation } from '@/types/snapshot';

const rec = (over: Partial<SnapshotRecommendation> = {}): SnapshotRecommendation => ({
  module_id: 'mod_1',
  module_title: 'Backyard Bird Survey',
  priority_score: 0.81,
  primary_reason: 'gap_fill',
  reason_text: "Science hasn't appeared recently",
  target_learner_ids: ['learner_1'],
  ...over,
});

const recommendations = (
  suggested: SnapshotRecommendation[],
): SnapshotData['recommendations'] => ({
  suggested_next: suggested,
  subject_balance: {},
});

describe('getGentlePrompt (R10 — rebuild-shaped recommendations object)', () => {
  it('derives the card from the first suggested_next entry', () => {
    const prompt = getGentlePrompt(recommendations([rec(), rec({ module_id: 'mod_2' })]));
    expect(prompt).toEqual({
      text: "Science hasn't appeared recently",
      moduleTitle: 'Backyard Bird Survey',
    });
  });

  it('returns null when suggested_next is empty', () => {
    expect(getGentlePrompt(recommendations([]))).toBeNull();
  });

  it('returns null when the recommendations block is absent (old snapshots)', () => {
    expect(getGentlePrompt(undefined)).toBeNull();
    expect(getGentlePrompt(null)).toBeNull();
  });

  it('returns null rather than rendering an empty sentence', () => {
    expect(getGentlePrompt(recommendations([rec({ reason_text: '' })]))).toBeNull();
  });
});
