import { describe, it, expect } from 'vitest';
import {
  rollupCoverage,
  descriptorToSubject,
  frameworkKeyForState,
  SUBJECT_KEYS,
  type RegulatoryMapping,
} from './deterministic-coverage';

const QLD = 'ac-v9-qld';

function mapping(over: Partial<RegulatoryMapping> = {}): RegulatoryMapping {
  return {
    frameworkKey: QLD,
    frameworkVersion: '9.0',
    codes: ['AC9E2LY05'],
    reportTier: 'cd_level',
    contribution: 'primary',
    evidenceWeight: 1,
    ...over,
  };
}

describe('descriptorToSubject', () => {
  it('routes each subject prefix', () => {
    expect(descriptorToSubject('AC9E2LY05')).toBe('english');
    expect(descriptorToSubject('AC9M3N01')).toBe('mathematics');
    expect(descriptorToSubject('AC9S1U01')).toBe('science');
    expect(descriptorToSubject('AC9HAS2K01')).toBe('hass');
    expect(descriptorToSubject('AC9HP4P01')).toBe('hpe');
    expect(descriptorToSubject('AC9LA2C01')).toBe('languages');
  });

  it('returns null for an unknown prefix', () => {
    expect(descriptorToSubject('XYZ123')).toBeNull();
    expect(descriptorToSubject('AC9ZZ01')).toBeNull();
  });
});

describe('frameworkKeyForState', () => {
  it('lowercases the state into ac-v9-{state}', () => {
    expect(frameworkKeyForState('NSW')).toBe('ac-v9-nsw');
    expect(frameworkKeyForState('VIC')).toBe('ac-v9-vic');
  });

  it('defaults to QLD when state is missing or blank', () => {
    expect(frameworkKeyForState(null)).toBe('ac-v9-qld');
    expect(frameworkKeyForState(undefined)).toBe('ac-v9-qld');
    expect(frameworkKeyForState('  ')).toBe('ac-v9-qld');
  });

  it('is idempotent for an already-lowercase state', () => {
    expect(frameworkKeyForState('qld')).toBe('ac-v9-qld');
  });
});

describe('rollupCoverage', () => {
  it('counts only developing / demonstrating DLOs', () => {
    const cov = rollupCoverage({
      dloStatuses: {
        'dlo.L1.emerging': { status: 'emerging' },
        'dlo.L2.unobserved': { status: 'unobserved' },
        'dlo.L3.developing': { status: 'developing' },
        'dlo.L4.demonstrating': { status: 'demonstrating' },
      },
      mappings: {
        'dlo.L1.emerging': [mapping({ codes: ['AC9E1LY01'] })],
        'dlo.L2.unobserved': [mapping({ codes: ['AC9E1LY02'] })],
        'dlo.L3.developing': [mapping({ codes: ['AC9E2LY05'] })],
        'dlo.L4.demonstrating': [mapping({ codes: ['AC9E3LY06'] })],
      },
      frameworkKey: QLD,
    });
    // Only the developing + demonstrating English codes survive.
    expect(cov.english.codes).toEqual(['AC9E2LY05', 'AC9E3LY06']);
  });

  it('weights demonstrating fully and developing at half', () => {
    const demonstrating = rollupCoverage({
      dloStatuses: { d: { status: 'demonstrating' } },
      mappings: { d: [mapping({ contribution: 'primary', evidenceWeight: 1 })] },
      frameworkKey: QLD,
    });
    const developing = rollupCoverage({
      dloStatuses: { d: { status: 'developing' } },
      mappings: { d: [mapping({ contribution: 'primary', evidenceWeight: 1 })] },
      frameworkKey: QLD,
    });
    expect(demonstrating.english.weightedScore).toBe(1);
    expect(developing.english.weightedScore).toBe(0.5);
  });

  it('applies evidenceWeight and buckets by contribution', () => {
    const cov = rollupCoverage({
      dloStatuses: {
        a: { status: 'demonstrating' },
        b: { status: 'developing' },
      },
      mappings: {
        a: [mapping({ codes: ['AC9M3N01'], contribution: 'primary', evidenceWeight: 1 })],
        b: [mapping({ codes: ['AC9M4A02'], contribution: 'partial', evidenceWeight: 0.6 })],
      },
      frameworkKey: QLD,
    });
    // demonstrating × 1.0 (primary) + developing(0.5) × 0.6 (partial)
    expect(cov.mathematics.byContribution.primary).toBe(1);
    expect(cov.mathematics.byContribution.partial).toBe(0.3);
    expect(cov.mathematics.weightedScore).toBe(1.3);
  });

  it('ignores mappings for other frameworks', () => {
    const cov = rollupCoverage({
      dloStatuses: { a: { status: 'demonstrating' } },
      mappings: {
        a: [
          mapping({ frameworkKey: 'ac-v9-nsw', codes: ['AC9E2LY05'] }),
          mapping({ frameworkKey: QLD, codes: ['AC9M3N01'] }),
        ],
      },
      frameworkKey: QLD,
    });
    expect(cov.english.codes).toEqual([]);
    expect(cov.mathematics.codes).toEqual(['AC9M3N01']);
  });

  it('dedupes and sorts codes', () => {
    const cov = rollupCoverage({
      dloStatuses: {
        a: { status: 'demonstrating' },
        b: { status: 'developing' },
      },
      mappings: {
        a: [mapping({ codes: ['AC9E3LY06', 'AC9E2LY05'] })],
        b: [mapping({ codes: ['AC9E2LY05'] })],
      },
      frameworkKey: QLD,
    });
    expect(cov.english.codes).toEqual(['AC9E2LY05', 'AC9E3LY06']);
  });

  it('returns a zero-filled entry for every subject', () => {
    const cov = rollupCoverage({ dloStatuses: {}, mappings: {}, frameworkKey: QLD });
    expect(Object.keys(cov).sort()).toEqual([...SUBJECT_KEYS].sort());
    for (const subject of SUBJECT_KEYS) {
      expect(cov[subject]).toEqual({
        codes: [],
        weightedScore: 0,
        byContribution: { primary: 0, partial: 0, incidental: 0 },
      });
    }
  });

  it('is deterministic regardless of input key order', () => {
    const statusesA = {
      'dlo.L3.developing': { status: 'developing' },
      'dlo.M1.demonstrating': { status: 'demonstrating' },
    };
    const statusesB = {
      'dlo.M1.demonstrating': { status: 'demonstrating' },
      'dlo.L3.developing': { status: 'developing' },
    };
    const mappings = {
      'dlo.L3.developing': [mapping({ codes: ['AC9E2LY05'] })],
      'dlo.M1.demonstrating': [mapping({ codes: ['AC9M3N01'] })],
    };
    const a = rollupCoverage({ dloStatuses: statusesA, mappings, frameworkKey: QLD });
    const b = rollupCoverage({ dloStatuses: statusesB, mappings, frameworkKey: QLD });
    expect(a).toEqual(b);
    // And byte-identical when serialised — the Stage-4 determinism contract.
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
