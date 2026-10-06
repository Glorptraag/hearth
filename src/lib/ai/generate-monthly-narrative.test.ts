import { describe, it, expect } from 'vitest';
import { narrativeSignature, type MonthlyNarrativeInput } from './generate-monthly-narrative';

const base: MonthlyNarrativeInput = {
  childName: 'Emma',
  entryCount: 4,
  subjects: ['science', 'english'],
  threadNames: ['S1', 'L3'],
  topActivities: ['Creek walk', 'Read-aloud'],
  badgesEarned: [],
};

describe('narrativeSignature', () => {
  it('is deterministic for identical inputs', () => {
    expect(narrativeSignature(base, '2026-10-01')).toBe(narrativeSignature({ ...base }, '2026-10-01'));
  });

  it('ignores ordering of the set-like fields (subjects, threads, badges)', () => {
    const shuffled: MonthlyNarrativeInput = {
      ...base,
      subjects: ['english', 'science'],
      threadNames: ['L3', 'S1'],
      badgesEarned: [],
    };
    expect(narrativeSignature(shuffled, '2026-10-01')).toBe(narrativeSignature(base, '2026-10-01'));
  });

  it('changes when the month, the entry count, or an activity changes', () => {
    const sig = narrativeSignature(base, '2026-10-01');
    expect(narrativeSignature(base, '2026-11-01')).not.toBe(sig);
    expect(narrativeSignature({ ...base, entryCount: 5 }, '2026-10-01')).not.toBe(sig);
    expect(narrativeSignature({ ...base, topActivities: ['Read-aloud', 'Creek walk'] }, '2026-10-01')).not.toBe(sig);
    expect(narrativeSignature({ ...base, badgesEarned: ['badge-1'] }, '2026-10-01')).not.toBe(sig);
  });

  it('is short and hex (safe to persist in the snapshot JSON)', () => {
    expect(narrativeSignature(base, '2026-10-01')).toMatch(/^[0-9a-f]{16}$/);
  });
});
