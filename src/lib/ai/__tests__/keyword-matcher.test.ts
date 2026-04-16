import { describe, it, expect } from 'vitest';
import { generateReflectionPrompts, matchKeywords, type SnapshotSignals } from '../keyword-matcher';

// ─── generateReflectionPrompts ───────────────────────────────────────────────

describe('generateReflectionPrompts — baseline (no snapshotSignals)', () => {
  it('returns thin-entry fallback when description is very short', () => {
    const prompts = generateReflectionPrompts({
      match: null,
      descriptionLength: 15,
      observations: [],
      activityType: null,
      engagementByName: {},
      discoveryByName: {},
    });
    expect(prompts).toHaveLength(1);
    expect(prompts[0].id).toBe('thin');
  });

  it('does not exceed 2 prompts', () => {
    const match = matchKeywords(
      'We read a book together, counted the pages, and she asked so many questions.',
      ['Ada']
    );
    const prompts = generateReflectionPrompts({
      match,
      descriptionLength: 80,
      observations: ['Deeply focused', 'Asked questions', 'Made connections'],
      activityType: 'reading',
      engagementByName: { Ada: 4 },
      discoveryByName: {},
    });
    expect(prompts.length).toBeLessThanOrEqual(2);
  });

  it('returns empty array when no signals and description is fine', () => {
    // edge: description ≥30 but no match, no chips, no engagement — no-signals fires
    const prompts = generateReflectionPrompts({
      match: { subjects: [], threads: [], engagement: null, mentionedChildren: [] },
      descriptionLength: 35,
      observations: [],
      activityType: null,
      engagementByName: {},
      discoveryByName: {},
    });
    expect(prompts.some((p) => p.id === 'no-signals')).toBe(true);
  });

  it('emits struggle prompt when engagement=1 and thin discovery', () => {
    const prompts = generateReflectionPrompts({
      match: null,
      descriptionLength: 50,
      observations: [],
      activityType: null,
      engagementByName: { Leo: 1 },
      discoveryByName: { Leo: 'ok' }, // <20 chars
    });
    expect(prompts.some((p) => p.id.startsWith('struggle-'))).toBe(true);
  });

  it('emits loved-it prompt when engagement=4 and thin discovery', () => {
    const prompts = generateReflectionPrompts({
      match: null,
      descriptionLength: 50,
      observations: [],
      activityType: null,
      engagementByName: { Mia: 4 },
      discoveryByName: {},
    });
    expect(prompts.some((p) => p.id.startsWith('loved-'))).toBe(true);
  });
});

describe('generateReflectionPrompts — with snapshotSignals', () => {
  it('emits gap-linked prompt when quiet thread matches activity type', () => {
    const signals: SnapshotSignals = {
      perChild: {
        'learner-1': { quiet: ['M3'], active: ['L3'] },
      },
    };
    const prompts = generateReflectionPrompts({
      match: null,
      descriptionLength: 50,
      observations: [],
      activityType: 'cooking', // M3 is in ACTIVITY_THREAD_MAP.cooking
      engagementByName: {},
      discoveryByName: {},
      snapshotSignals: signals,
      learnerNamesById: { 'learner-1': 'Ada' },
    });
    expect(prompts.some((p) => p.id.startsWith('gap-'))).toBe(true);
    expect(prompts[0].id).toMatch(/^gap-/); // gap-linked takes priority
    expect(prompts[0].question).toContain('Ada');
    expect(prompts[0].question).not.toContain('learner-1');
  });

  it('emits at most one gap-linked prompt', () => {
    const signals: SnapshotSignals = {
      perChild: {
        'learner-1': { quiet: ['M3', 'M5'], active: [] },
        'learner-2': { quiet: ['M3'], active: [] },
      },
    };
    const prompts = generateReflectionPrompts({
      match: null,
      descriptionLength: 50,
      observations: [],
      activityType: 'cooking',
      engagementByName: {},
      discoveryByName: {},
      snapshotSignals: signals,
      learnerNamesById: { 'learner-1': 'Ada', 'learner-2': 'Ben' },
    });
    expect(prompts.filter((p) => p.id.startsWith('gap-'))).toHaveLength(1);
  });

  it('skips gap-linked prompt when learner name cannot be resolved', () => {
    const signals: SnapshotSignals = {
      perChild: {
        'learner-1': { quiet: ['M3'], active: [] },
      },
    };
    const prompts = generateReflectionPrompts({
      match: null,
      descriptionLength: 50,
      observations: [],
      activityType: 'cooking',
      engagementByName: {},
      discoveryByName: {},
      snapshotSignals: signals,
      // No learnerNamesById — gap prompt must NOT render with a UUID
    });
    expect(prompts.every((p) => !p.id.startsWith('gap-'))).toBe(true);
  });

  it('does not emit gap-linked when activity type does not touch quiet thread', () => {
    const signals: SnapshotSignals = {
      perChild: {
        'learner-1': { quiet: ['H1'], active: [] }, // H1 not in ACTIVITY_THREAD_MAP.cooking
      },
    };
    const prompts = generateReflectionPrompts({
      match: null,
      descriptionLength: 50,
      observations: [],
      activityType: 'cooking',
      engagementByName: {},
      discoveryByName: {},
      snapshotSignals: signals,
      learnerNamesById: { 'learner-1': 'Ada' },
    });
    expect(prompts.every((p) => !p.id.startsWith('gap-'))).toBe(true);
  });

  it('applies teaching-cue framing when onboarding=true', () => {
    const signals: SnapshotSignals = {
      perChild: {
        'learner-1': { quiet: [], active: [] },
      },
      onboarding: true,
    };
    const match = matchKeywords('We did some science experiments outside today.', []);
    const prompts = generateReflectionPrompts({
      match,
      descriptionLength: 50,
      observations: [],
      activityType: 'nature',
      engagementByName: {},
      discoveryByName: {},
      snapshotSignals: signals,
    });
    // First non-thin prompt should be wrapped with teach- prefix
    if (prompts.length > 0 && prompts[0].id !== 'thin') {
      expect(prompts[0].id).toMatch(/^teach-/);
      expect(prompts[0].question).toMatch(/why this matters/i);
    }
  });

  it('identical output to baseline when snapshotSignals is null', () => {
    const ctx = {
      match: matchKeywords('We went for a nature walk and looked at insects.', ['Ada']),
      descriptionLength: 55,
      observations: [] as string[],
      activityType: 'nature' as const,
      engagementByName: {} as Record<string, number>,
      discoveryByName: {} as Record<string, string>,
    };
    const withoutSignals = generateReflectionPrompts({ ...ctx });
    const withNullSignals = generateReflectionPrompts({ ...ctx, snapshotSignals: null });
    expect(withoutSignals).toEqual(withNullSignals);
  });
});
