import { describe, it, expect } from 'vitest';
import {
  hasNeededPlaceholder,
  analyzePackMaterials,
  analyzePackMedia,
} from './index';

describe('hasNeededPlaceholder', () => {
  it('matches the canonical [NEEDED] marker', () => {
    expect(hasNeededPlaceholder('Glue stick [NEEDED]')).toBe(true);
  });

  it('is case-insensitive and tolerates whitespace inside the brackets', () => {
    expect(hasNeededPlaceholder('[needed]')).toBe(true);
    expect(hasNeededPlaceholder('[ Needed ]')).toBe(true);
  });

  it('does NOT flag the bare word "needed" without brackets', () => {
    expect(hasNeededPlaceholder('no special equipment needed')).toBe(false);
  });

  it('handles null/undefined/non-strings without throwing', () => {
    expect(hasNeededPlaceholder(null)).toBe(false);
    expect(hasNeededPlaceholder(undefined)).toBe(false);
  });
});

describe('analyzePackMaterials', () => {
  it('finds placeholders across pack, module, and activity materials fields', () => {
    const hits = analyzePackMaterials({
      packMaterialsDesc: 'Watercolours [NEEDED]',
      moduleMaterialsDesc: ['Clay', 'Kiln access [needed]'],
      // chained dereferences come back as nested arrays
      activityMaterialNames: [['Paper', 'Beeswax crayons [NEEDED]'], ['Scissors']],
      activityMaterialAlternatives: [[null, 'Any soft pastel']],
    });
    expect(hits.map((h) => h.field).sort()).toEqual([
      'activity.materials[].name',
      'module.materials.description',
      'pack.materials.description',
    ]);
  });

  it('returns no hits for a fully-sourced pack', () => {
    expect(
      analyzePackMaterials({
        packMaterialsDesc: 'Everything is in the kit',
        moduleMaterialsDesc: ['Clay'],
        activityMaterialNames: [['Paper', 'Scissors']],
      }),
    ).toEqual([]);
  });

  it('tolerates missing fields', () => {
    expect(analyzePackMaterials({})).toEqual([]);
  });
});

describe('analyzePackMedia', () => {
  it('separates audio assets from assets missing a file, de-duping by _id', () => {
    const result = analyzePackMedia([
      { _id: 'a1', title: 'Narration', kind: 'audio', hasFile: true },
      { _id: 'a1', title: 'Narration', kind: 'audio', hasFile: true }, // dup
      { _id: 'a2', title: 'Worksheet', kind: 'worksheet', hasFile: false },
      { _id: 'a3', title: 'Card set', kind: 'card_set', hasFile: true },
    ]);
    expect(result.audio.map((a) => a._id)).toEqual(['a1']);
    expect(result.missingFile.map((a) => a._id)).toEqual(['a2']);
  });

  it('flags an audio asset that is also missing its file in both buckets', () => {
    const result = analyzePackMedia([
      { _id: 'a1', title: 'Song', kind: 'audio', hasFile: false },
    ]);
    expect(result.audio).toHaveLength(1);
    expect(result.missingFile).toHaveLength(1);
  });

  it('returns empty buckets for a fully-produced pack', () => {
    expect(
      analyzePackMedia([{ _id: 'a1', kind: 'worksheet', hasFile: true }]),
    ).toEqual({ audio: [], missingFile: [] });
  });
});
