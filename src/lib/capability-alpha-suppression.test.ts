/**
 * The H6 alpha-suppression contract, pinned in one place: the module itself
 * plus every pure parent-facing seam that consumes it (keyword matcher,
 * post-save nudge, constellation topology, deterministic coverage, portfolio
 * thread grouping). The snapshot-write and capabilities-API seams are covered
 * at the integration layer (capabilities route.integration.test.ts).
 */
import { describe, it, expect } from 'vitest';
import {
  ALPHA_SUPPRESSED_THREAD_IDS,
  isSuppressedThread,
  filterSuppressedThreadIds,
  omitSuppressedKeys,
} from './capability-alpha-suppression';
import { matchKeywords, generateReflectionPrompts } from '@/lib/ai/keyword-matcher';
import { TemplateNudgeProvider } from '@/lib/logger/coaching/nudge-provider';
import {
  ALL_THREADS,
  THREADS_BY_ID,
  ORDERED_DOMAINS,
  indexDLOsByThread,
  type SanityDLO,
} from '@/app/(auth)/our-story/capabilities/_constellation/topology';
import { rollupCoverage, deriveCoverageSignals } from '@/lib/report/deterministic-coverage';
import { topThreadId, threadGroupName, UNCATEGORIZED_GROUP } from '@/lib/portfolio/thread-grouping';

describe('capability-alpha-suppression module', () => {
  it('suppresses H6 in every id form the pipeline uses', () => {
    expect(isSuppressedThread('H6')).toBe(true);
    expect(isSuppressedThread('capabilityThread.H6')).toBe(true);
    expect(isSuppressedThread('dlo.H6.emerging')).toBe(true);
    expect(isSuppressedThread('dlo.H6.demonstrating')).toBe(true);
  });

  it('never collides with lookalike ids (exact segment match only)', () => {
    expect(isSuppressedThread('H1')).toBe(false);
    expect(isSuppressedThread('PS6')).toBe(false);
    expect(isSuppressedThread('H61')).toBe(false);
    expect(isSuppressedThread('capabilityThread.H61')).toBe(false);
    expect(isSuppressedThread('dlo.H61.emerging')).toBe(false);
    expect(isSuppressedThread(null)).toBe(false);
    expect(isSuppressedThread(undefined)).toBe(false);
    expect(isSuppressedThread('')).toBe(false);
  });

  it('filterSuppressedThreadIds drops only suppressed ids', () => {
    expect(filterSuppressedThreadIds(['H6', 'L3', 'PS6'])).toEqual(['L3', 'PS6']);
  });

  it('omitSuppressedKeys drops thread and DLO keys, and returns the same object when clean', () => {
    const dirty = { 'dlo.H6.emerging': 1, 'dlo.L3.emerging': 2, H6: 3, L3: 4 };
    expect(omitSuppressedKeys(dirty)).toEqual({ 'dlo.L3.emerging': 2, L3: 4 });

    const clean = { 'dlo.L3.emerging': 2, L3: 4 };
    expect(omitSuppressedKeys(clean)).toBe(clean);
  });

  it('documents the current suppression set', () => {
    expect(ALPHA_SUPPRESSED_THREAD_IDS).toEqual(['H6']);
  });
});

describe('keyword matcher seam', () => {
  it('never emits a suppressed thread even when its keywords match', () => {
    // 'cultural' and 'tradition' are H6 keywords; 'reading' hits L3.
    const result = matchKeywords('We explored a cultural tradition and did some reading', []);
    expect(result.threads).not.toContain('H6');
    expect(result.threads).toContain('L3');
    // Subject detection is untouched — HASS still matches on 'tradition'.
    expect(result.subjects).toContain('HASS');
  });

  it('gap-linked reflection prompts skip suppressed quiet threads', () => {
    // activityType 'outing' maps to H1/H3/H6/S6; only H6 is quiet → no
    // H6-based gap prompt may render, so no prompt mentions culture & identity.
    const prompts = generateReflectionPrompts({
      match: null,
      descriptionLength: 100,
      observations: [],
      activityType: 'outing',
      engagementByName: {},
      discoveryByName: {},
      snapshotSignals: { perChild: { 'learner-1': { quiet: ['H6'], active: [] } } },
      learnerNamesById: { 'learner-1': 'Sage' },
    });
    expect(prompts.every((p) => !p.id.includes('H6'))).toBe(true);
  });
});

describe('post-save nudge seam', () => {
  it('skips a suppressed quiet thread and nudges the next eligible one', async () => {
    const provider = new TemplateNudgeProvider();
    const nudge = await provider.getNudge({
      familyId: 'fam-1',
      primaryLearnerId: 'learner-1',
      primaryLearnerName: 'Sage',
      snapshotSignals: { perChild: { 'learner-1': { quiet: ['H6', 'L5'], active: [] } } },
    });
    expect(nudge?.thread_id).toBe('L5');
  });

  it('returns null when the only quiet thread is suppressed', async () => {
    const provider = new TemplateNudgeProvider();
    const nudge = await provider.getNudge({
      familyId: 'fam-1',
      primaryLearnerId: 'learner-1',
      primaryLearnerName: 'Sage',
      snapshotSignals: { perChild: { 'learner-1': { quiet: ['H6'], active: [] } } },
    });
    expect(nudge).toBeNull();
  });
});

describe('constellation topology seam', () => {
  it('excludes suppressed threads from the catalog', () => {
    expect(THREADS_BY_ID['H6']).toBeUndefined();
    expect(ALL_THREADS.some((t) => t.id === 'H6')).toBe(false);
    // Neighbouring humanities threads survive.
    expect(THREADS_BY_ID['H5']).toBeDefined();
  });

  it('domain thread counts reflect the visible set', () => {
    const total = ORDERED_DOMAINS.reduce((sum, d) => sum + d.threadCount, 0);
    expect(total).toBe(57 - ALPHA_SUPPRESSED_THREAD_IDS.length);
  });

  it('indexDLOsByThread drops DLOs belonging to suppressed threads', () => {
    const dlos: SanityDLO[] = [
      { _id: 'dlo.H6.emerging', threadRef: 'capabilityThread.H6', tier: 'emerging', descriptor: 'x' },
      { _id: 'dlo.L3.emerging', threadRef: 'capabilityThread.L3', tier: 'emerging', descriptor: 'y' },
    ];
    const indexed = indexDLOsByThread(dlos);
    expect(indexed['H6']).toBeUndefined();
    expect(indexed['L3']).toHaveLength(1);
  });
});

describe('deterministic coverage seam', () => {
  const mappings = {
    'dlo.H6.demonstrating': [
      { frameworkKey: 'ac-v9-qld', codes: ['AC9HS1K01'], contribution: 'primary' as const, evidenceWeight: 1 },
    ],
    'dlo.H1.demonstrating': [
      { frameworkKey: 'ac-v9-qld', codes: ['AC9HS1K02'], contribution: 'primary' as const, evidenceWeight: 1 },
    ],
  };
  const dloStatuses = {
    'dlo.H6.demonstrating': { status: 'demonstrating' },
    'dlo.H1.demonstrating': { status: 'demonstrating' },
  };

  it('a suppressed DLO contributes nothing to regulator-facing coverage', () => {
    const coverage = rollupCoverage({ dloStatuses, mappings, frameworkKey: 'ac-v9-qld' });
    expect(coverage.hass.codes).toEqual(['AC9HS1K02']);
    expect(coverage.hass.weightedScore).toBe(1);
  });

  it('coverage signals ignore suppressed DLOs', () => {
    const coverage = rollupCoverage({ dloStatuses, mappings, frameworkKey: 'ac-v9-qld' });
    const signals = deriveCoverageSignals({ dloStatuses, mappings, frameworkKey: 'ac-v9-qld', coverage });
    expect(signals.countingDloCount).toBe(1);
    expect(signals.mappedCountingDloCount).toBe(1);
  });
});

describe('portfolio thread-grouping seam', () => {
  it('a suppressed thread never wins top-thread even at higher confidence', () => {
    expect(
      topThreadId([
        { thread_id: 'H6', confidence: 0.95 },
        { thread_id: 'L3', confidence: 0.6 },
      ]),
    ).toBe('L3');
  });

  it('an entry whose only qualifying thread is suppressed groups as Uncategorized', () => {
    expect(threadGroupName([{ thread_id: 'H6', confidence: 0.95 }])).toBe(UNCATEGORIZED_GROUP);
  });
});
