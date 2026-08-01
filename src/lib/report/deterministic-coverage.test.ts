import { describe, it, expect } from 'vitest';
import {
  rollupCoverage,
  deriveCoverageSignals,
  descriptorToSubject,
  frameworkKeyForState,
  SUBJECT_KEYS,
  type RegulatoryMapping,
} from './deterministic-coverage';
import { DLO_REGULATORY_MAPPINGS } from '../../../scripts/data/dlo-regulatory-mappings';
import { DLO_REGULATORY_MAPPINGS_TRANCHE2 } from '../../../scripts/seed-dlo-mappings-qld-tranche2.mjs';

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
  it('routes each real ACARA v9 learning-area prefix', () => {
    expect(descriptorToSubject('AC9E2LY05')).toBe('english');
    expect(descriptorToSubject('AC9M3N01')).toBe('mathematics');
    expect(descriptorToSubject('AC9S1U01')).toBe('science');
    // HASS: F–6 combined + the four 7–10 subjects.
    expect(descriptorToSubject('AC9HS2K02')).toBe('hass'); // F–6 HASS — the fix
    expect(descriptorToSubject('AC9HH7K01')).toBe('hass'); // History 7–10
    expect(descriptorToSubject('AC9HG7K01')).toBe('hass'); // Geography 7–10
    expect(descriptorToSubject('AC9HC7K01')).toBe('hass'); // Civics 7–10
    expect(descriptorToSubject('AC9HE7K01')).toBe('hass'); // Economics 7–10
    expect(descriptorToSubject('AC9AMU2D01')).toBe('arts'); // Music — AC9A umbrella
    expect(descriptorToSubject('AC9AVA8C01')).toBe('arts'); // Visual Arts
    expect(descriptorToSubject('AC9TDE4K01')).toBe('technologies'); // Design
    expect(descriptorToSubject('AC9TDI4P01')).toBe('technologies'); // Digital
    expect(descriptorToSubject('AC9HP6P06')).toBe('hpe');
    expect(descriptorToSubject('AC9LF8C01')).toBe('languages'); // French — AC9L umbrella
  });

  it('drops the invented HASS prefixes the bug rested on', () => {
    // The reconciled map removed these fabricated HASS keys; codes shaped like
    // them no longer route anywhere. The real F–6 HASS code (AC9HS…) does.
    expect(descriptorToSubject('AC9HAS2K01')).toBeNull();
    expect(descriptorToSubject('AC9HI2K01')).toBeNull();
    expect(descriptorToSubject('AC9GE2K01')).toBeNull();
    expect(descriptorToSubject('AC9CI2K01')).toBeNull();
    expect(descriptorToSubject('AC9HS2K01')).toBe('hass');
  });

  it('does not misroute economics (AC9HE) to english (AC9E)', () => {
    expect(descriptorToSubject('AC9HE7K01')).not.toBe('english');
  });

  it('returns null for an unknown prefix', () => {
    expect(descriptorToSubject('XYZ123')).toBeNull();
    expect(descriptorToSubject('AC9ZZ01')).toBeNull();
  });
});

describe('tranche-1 regulatory mappings (C2: every code resolves)', () => {
  it('every authored AC9 code resolves to a subject via the reconciled map', () => {
    const unresolved: string[] = [];
    for (const entry of DLO_REGULATORY_MAPPINGS) {
      for (const m of entry.mappings) {
        for (const code of m.codes) {
          if (descriptorToSubject(code) === null) {
            unresolved.push(`${entry.dloId} → ${code}`);
          }
        }
      }
    }
    // A non-empty list means a mapping code contributes ZERO coverage — the exact
    // class of bug (HASS via AC9HS) this PR reconciles. Fail loudly with the list.
    expect(unresolved).toEqual([]);
  });
});

describe('tranche-2 regulatory mappings (P1 + PS2 HPE gap)', () => {
  it('every authored AC9 code resolves to a subject via the reconciled map', () => {
    const unresolved: string[] = [];
    for (const entry of DLO_REGULATORY_MAPPINGS_TRANCHE2) {
      for (const m of entry.mappings) {
        for (const code of m.codes) {
          if (descriptorToSubject(code) === null) {
            unresolved.push(`${entry.dloId} → ${code}`);
          }
        }
      }
    }
    expect(unresolved).toEqual([]);
  });

  it('credits HPE for a learner with demonstrating-tier P1/PS2 DLOs (closes the #204 mapping gap)', () => {
    // Mirrors the class-A mapping-gap fixture above, but now WITH the tranche-2
    // mappings applied — the exact gap this seed closes: real developing/
    // demonstrating evidence on P1 (Gross Motor) and PS2 (Social Skills) that
    // previously had nowhere to land because HPE had zero ac-v9-qld coverage.
    const dloStatuses = {
      'dlo.P1.demonstrating': { status: 'demonstrating' },
      'dlo.PS2.demonstrating': { status: 'demonstrating' },
    };
    const mappingsByDloId = Object.fromEntries(
      DLO_REGULATORY_MAPPINGS_TRANCHE2.map((entry) => [entry.dloId, entry.mappings]),
    );
    const mappings = {
      'dlo.P1.demonstrating': mappingsByDloId['dlo.P1.demonstrating'],
      'dlo.PS2.demonstrating': mappingsByDloId['dlo.PS2.demonstrating'],
    };

    const coverage = rollupCoverage({ dloStatuses, mappings, frameworkKey: QLD });
    const signals = deriveCoverageSignals({ dloStatuses, mappings, frameworkKey: QLD, coverage });

    expect(coverage.hpe.weightedScore).toBeGreaterThan(0);
    expect(coverage.hpe.codes).toEqual(['AC9HP6M01', 'AC9HP6P07']);
    expect(signals).toEqual({
      countingDloCount: 2,
      mappedCountingDloCount: 2, // both now target ac-v9-qld — the gap is closed
      mappedSubjectCount: 1, // hpe
    });
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

describe('deriveCoverageSignals', () => {
  it('class A — mapping gap: counting evidence on UNMAPPED threads → 0 subjects mapped', () => {
    // Mirrors Fox-Lewer (#204): DLOs reached demonstrating, but on threads with
    // no `ac-v9-qld` mapping → rollup scores zero yet evidence plainly exists.
    const dloStatuses = {
      'dlo.P1.demonstrating': { status: 'demonstrating' },
      'dlo.PS2.developing': { status: 'developing' },
    };
    const mappings = {
      // Mapped, but to a DIFFERENT framework — so neither targets ac-v9-qld.
      'dlo.P1.demonstrating': [mapping({ frameworkKey: 'ac-v9-nsw', codes: ['AC9HP6M01'] })],
      'dlo.PS2.developing': [mapping({ frameworkKey: 'ac-v9-nsw', codes: ['AC9HP6P01'] })],
    };
    const coverage = rollupCoverage({ dloStatuses, mappings, frameworkKey: QLD });
    const signals = deriveCoverageSignals({ dloStatuses, mappings, frameworkKey: QLD, coverage });
    expect(signals).toEqual({
      countingDloCount: 2, // both are developing/demonstrating
      mappedCountingDloCount: 0, // …but neither maps into ac-v9-qld
      mappedSubjectCount: 0, // …so nothing scored
    });
  });

  it('class B — status-bar gap: evidence below the bar → no counting rows at all', () => {
    // Mirrors Barkley (#204): logged on mapped threads, but nothing promoted to
    // developing, so the conservative rollup counts zero.
    const dloStatuses = {
      'dlo.L3.emerging': { status: 'emerging' },
      'dlo.M1.unobserved': { status: 'unobserved' },
    };
    const mappings = {
      'dlo.L3.emerging': [mapping({ codes: ['AC9E2LY05'] })],
      'dlo.M1.unobserved': [mapping({ codes: ['AC9M3N01'] })],
    };
    const coverage = rollupCoverage({ dloStatuses, mappings, frameworkKey: QLD });
    const signals = deriveCoverageSignals({ dloStatuses, mappings, frameworkKey: QLD, coverage });
    expect(signals).toEqual({
      countingDloCount: 0, // emerging/unobserved never count
      mappedCountingDloCount: 0,
      mappedSubjectCount: 0,
    });
  });

  it('mapped — counting evidence on mapped threads scores real subjects', () => {
    const dloStatuses = {
      'dlo.L3.developing': { status: 'developing' },
      'dlo.M1.demonstrating': { status: 'demonstrating' },
    };
    const mappings = {
      'dlo.L3.developing': [mapping({ codes: ['AC9E2LY05'] })],
      'dlo.M1.demonstrating': [mapping({ codes: ['AC9M3N01'] })],
    };
    const coverage = rollupCoverage({ dloStatuses, mappings, frameworkKey: QLD });
    const signals = deriveCoverageSignals({ dloStatuses, mappings, frameworkKey: QLD, coverage });
    expect(signals).toEqual({
      countingDloCount: 2,
      mappedCountingDloCount: 2,
      mappedSubjectCount: 2, // english + mathematics
    });
  });

  it('is a pure function of its arguments — order-independent', () => {
    const mappings = {
      'dlo.L3.developing': [mapping({ codes: ['AC9E2LY05'] })],
      'dlo.M1.demonstrating': [mapping({ codes: ['AC9M3N01'] })],
    };
    const coverage = rollupCoverage({
      dloStatuses: { 'dlo.L3.developing': { status: 'developing' } },
      mappings,
      frameworkKey: QLD,
    });
    const a = deriveCoverageSignals({
      dloStatuses: { 'dlo.L3.developing': { status: 'developing' }, 'dlo.M1.demonstrating': { status: 'demonstrating' } },
      mappings,
      frameworkKey: QLD,
      coverage,
    });
    const b = deriveCoverageSignals({
      dloStatuses: { 'dlo.M1.demonstrating': { status: 'demonstrating' }, 'dlo.L3.developing': { status: 'developing' } },
      mappings,
      frameworkKey: QLD,
      coverage,
    });
    expect(a).toEqual(b);
  });
});
