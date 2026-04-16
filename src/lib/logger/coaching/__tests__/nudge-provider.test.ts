import { describe, it, expect } from 'vitest';
import { TemplateNudgeProvider } from '../nudge-provider';
import type { NudgeInput } from '../types';

describe('TemplateNudgeProvider', () => {
  const provider = new TemplateNudgeProvider();

  function makeInput(overrides: Partial<NudgeInput> = {}): NudgeInput {
    return {
      familyId: 'family-1',
      primaryLearnerId: 'learner-1',
      primaryLearnerName: 'Ada',
      snapshotSignals: {
        perChild: {
          'learner-1': { quiet: ['M3'], active: ['L3'] },
        },
      },
      ...overrides,
    };
  }

  it('returns a nudge with substituted name for a quiet thread with a template', async () => {
    const result = await provider.getNudge(makeInput());
    expect(result).not.toBeNull();
    expect(result!.thread_id).toBe('M3');
    expect(result!.text).toContain('Ada');
    expect(result!.text).not.toContain('{name}');
  });

  it('picks the first quiet thread that has a template', async () => {
    // ZZZZ is a made-up ID with no template; M5 has one
    const result = await provider.getNudge(makeInput({
      snapshotSignals: {
        perChild: {
          'learner-1': { quiet: ['ZZZZ', 'M5'], active: [] },
        },
      },
    }));
    expect(result).not.toBeNull();
    expect(result!.thread_id).toBe('M5');
  });

  it('returns null when snapshot has no quiet threads', async () => {
    const result = await provider.getNudge(makeInput({
      snapshotSignals: {
        perChild: {
          'learner-1': { quiet: [], active: ['L3'] },
        },
      },
    }));
    expect(result).toBeNull();
  });

  it('returns null when primary learner has no snapshot entry', async () => {
    const result = await provider.getNudge(makeInput({
      snapshotSignals: { perChild: {} },
    }));
    expect(result).toBeNull();
  });

  it('returns null when all quiet threads lack templates', async () => {
    const result = await provider.getNudge(makeInput({
      snapshotSignals: {
        perChild: {
          'learner-1': { quiet: ['ZZZZ', 'YYYY'], active: [] },
        },
      },
    }));
    expect(result).toBeNull();
  });

  it('handles multi-word child names without leaving placeholders', async () => {
    const result = await provider.getNudge(makeInput({
      primaryLearnerName: 'Ada Rose',
      snapshotSignals: {
        perChild: {
          'learner-1': { quiet: ['EF7'], active: [] },
        },
      },
    }));
    expect(result).not.toBeNull();
    expect(result!.text).toContain('Ada Rose');
    expect(result!.text).not.toContain('{name}');
  });
});
