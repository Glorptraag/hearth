import { describe, expect, it } from 'vitest';
import {
  getActiveOverlays,
  getActivePedagogyBundle,
  getCompositeWeight,
  getThreadKeysForComposite,
  hasAnySubstantiveField,
} from './get-active-bundle-and-overlays';
import type {
  FamilyPedagogicalProfile,
  MethodologyOverlay,
  ModuleWithBundles,
  PedagogyLensBundle,
} from './lens-bundle-types';

const cmBundle: PedagogyLensBundle = {
  pedagogyKey: 'charlotte_mason',
  whyThisMatters: 'CM framing.',
  facilitationNote: 'Read aloud, then ask for narration.',
  observationCues: ['Notice the order of details recalled.'],
  evidencePriorities: [
    { threadKey: 'observation', weight: 0.6, interpretation: 'CM emphasises noticing.' },
    { threadKey: 'narrative_recall', weight: 0.4 },
  ],
};

const classicalBundle: PedagogyLensBundle = {
  pedagogyKey: 'classical',
  whyThisMatters: 'Trivium framing.',
  observationCues: ['Watch for clear logical structure.'],
  evidencePriorities: [{ threadKey: 'logic', weight: 0.5 }],
};

const narrationOverlay: MethodologyOverlay = {
  practiceKey: 'narration',
  loggerPromptHint: 'What did your child tell you back?',
  prepHint: 'Plan a quiet moment after reading.',
  observationCue: 'Listen for sequence words.',
  evidenceTagBias: ['narrative_recall', 'observation'],
};

const natureJournalingOverlay: MethodologyOverlay = {
  practiceKey: 'nature-journaling',
  loggerPromptHint: 'What did they sketch or write?',
  prepHint: 'Bring journals outside.',
  observationCue: 'Notice repeated subjects.',
  evidenceTagBias: ['observation'],
};

const emptyOverlay: MethodologyOverlay = {
  practiceKey: 'rhythm',
  loggerPromptHint: '',
  prepHint: null,
  observationCue: undefined,
  evidenceTagBias: [],
};

const moduleDoc: ModuleWithBundles = {
  lensStatus: 'ready',
  methodologyStatus: 'ready',
  pedagogyLensBundles: [cmBundle, classicalBundle],
  methodologyOverlays: [narrationOverlay, natureJournalingOverlay, emptyOverlay],
};

describe('hasAnySubstantiveField', () => {
  it('rejects fully empty overlay', () => {
    expect(hasAnySubstantiveField(emptyOverlay)).toBe(false);
  });
  it('accepts overlay with any non-empty field', () => {
    expect(hasAnySubstantiveField(narrationOverlay)).toBe(true);
    expect(
      hasAnySubstantiveField({ practiceKey: 'x', evidenceTagBias: ['t'] }),
    ).toBe(true);
  });
  it('treats whitespace-only strings as empty', () => {
    expect(
      hasAnySubstantiveField({ practiceKey: 'x', loggerPromptHint: '   ' }),
    ).toBe(false);
  });
});

describe('getActivePedagogyBundle', () => {
  it('returns the bundle matching the family pedagogy', () => {
    const profile: FamilyPedagogicalProfile = { pedagogyKey: 'charlotte_mason', practices: [] };
    expect(getActivePedagogyBundle(moduleDoc, profile)).toBe(cmBundle);
  });
  it('returns null for missing module bundles', () => {
    expect(getActivePedagogyBundle({}, { pedagogyKey: 'charlotte_mason', practices: [] })).toBeNull();
  });
  it('returns null when family pedagogy has no matching bundle', () => {
    expect(
      getActivePedagogyBundle(moduleDoc, { pedagogyKey: 'montessori', practices: [] }),
    ).toBeNull();
  });
  it('returns null for missing profile', () => {
    expect(getActivePedagogyBundle(moduleDoc, null)).toBeNull();
  });
});

describe('getActiveOverlays', () => {
  it('intersects practices with overlays and preserves family priority order', () => {
    const profile: FamilyPedagogicalProfile = {
      pedagogyKey: 'charlotte_mason',
      practices: ['nature-journaling', 'narration'],
    };
    const result = getActiveOverlays(moduleDoc, profile);
    expect(result.map((o) => o.practiceKey)).toEqual(['nature-journaling', 'narration']);
  });
  it('drops empty overlays via hasAnySubstantiveField', () => {
    const profile: FamilyPedagogicalProfile = {
      pedagogyKey: 'charlotte_mason',
      practices: ['rhythm', 'narration'],
    };
    const result = getActiveOverlays(moduleDoc, profile);
    expect(result.map((o) => o.practiceKey)).toEqual(['narration']);
  });
  it('returns empty when family has no practices', () => {
    expect(
      getActiveOverlays(moduleDoc, { pedagogyKey: 'charlotte_mason', practices: [] }),
    ).toEqual([]);
  });
  it('returns empty when module has no overlays', () => {
    expect(
      getActiveOverlays(
        { ...moduleDoc, methodologyOverlays: [] },
        { pedagogyKey: 'charlotte_mason', practices: ['narration'] },
      ),
    ).toEqual([]);
  });
});

describe('getCompositeWeight', () => {
  const profile: FamilyPedagogicalProfile = {
    pedagogyKey: 'charlotte_mason',
    practices: ['narration', 'nature-journaling'],
  };
  const overlays = getActiveOverlays(moduleDoc, profile);

  it('returns pedagogy weight + methodology contributions', () => {
    // observation: pedagogy 0.6
    // + narration (priorityIndex 0, factor 1.0) → 0.3
    // + nature-journaling (priorityIndex 1, factor 0.8) → 0.24
    const w = getCompositeWeight('observation', cmBundle, overlays, profile.practices);
    expect(w).toBeCloseTo(0.6 + 0.3 + 0.24, 5);
  });
  it('handles pedagogy-only threads', () => {
    const w = getCompositeWeight('narrative_recall', cmBundle, [], profile.practices);
    expect(w).toBeCloseTo(0.4, 5);
  });
  it('handles overlay-only threads', () => {
    const w = getCompositeWeight('observation', null, overlays, profile.practices);
    expect(w).toBeCloseTo(0.3 + 0.24, 5);
  });
  it('returns 0 when neither layer references the thread', () => {
    expect(getCompositeWeight('unrelated', cmBundle, overlays, profile.practices)).toBe(0);
  });
});

describe('getThreadKeysForComposite', () => {
  it('unions pedagogy + overlay thread keys, deduped', () => {
    const profile: FamilyPedagogicalProfile = {
      pedagogyKey: 'charlotte_mason',
      practices: ['narration'],
    };
    const overlays = getActiveOverlays(moduleDoc, profile);
    const keys = getThreadKeysForComposite(cmBundle, overlays).sort();
    expect(keys).toEqual(['narrative_recall', 'observation']);
  });
});
