import { describe, it, expect } from 'vitest';
import {
  resolveIndicators,
  hasAnyIndicator,
  derivePrintablesFromAssetCounts,
} from './pack-indicators';

describe('resolveIndicators', () => {
  it('returns empty indicators when both pack and module are absent', () => {
    expect(resolveIndicators(null, null)).toEqual({
      printables: undefined,
      materials: undefined,
    });
  });

  it('falls back to pack values when module is undefined', () => {
    const result = resolveIndicators(
      {
        printables: { available: true, count: 8 },
        materials: { mode: 'ships-with', kitPriceAUD: 34 },
      },
      null,
    );
    expect(result.printables).toEqual({ available: true, count: 8 });
    expect(result.materials?.mode).toBe('ships-with');
  });

  it('module printables override pack printables when set', () => {
    const result = resolveIndicators(
      { printables: { available: true, count: 8 } },
      { printables: { available: false } },
    );
    expect(result.printables?.available).toBe(false);
  });

  it('module printables inherit from pack when module.printables.available is undefined', () => {
    const result = resolveIndicators(
      { printables: { available: true, count: 4 } },
      { printables: { count: 99 } }, // available is undefined → inherits
    );
    expect(result.printables?.available).toBe(true);
    expect(result.printables?.count).toBe(4);
  });

  it('module materials override pack materials when mode is non-none', () => {
    const result = resolveIndicators(
      { materials: { mode: 'ships-with', kitPriceAUD: 34 } },
      { materials: { mode: 'required', description: 'flour, water' } },
    );
    expect(result.materials?.mode).toBe('required');
    expect(result.materials?.description).toBe('flour, water');
  });

  it('module materials inherit pack when module.mode is none', () => {
    const result = resolveIndicators(
      { materials: { mode: 'ships-with', kitPriceAUD: 34 } },
      { materials: { mode: 'none' } },
    );
    expect(result.materials?.mode).toBe('ships-with');
  });
});

describe('derivePrintablesFromAssetCounts', () => {
  it('returns undefined when asset counts are missing', () => {
    expect(derivePrintablesFromAssetCounts(undefined)).toBeUndefined();
    expect(derivePrintablesFromAssetCounts(null)).toBeUndefined();
    expect(derivePrintablesFromAssetCounts({})).toBeUndefined();
  });

  it('returns available with count when pack has printable assets', () => {
    const result = derivePrintablesFromAssetCounts({ total: 12, audio: 2 });
    expect(result).toEqual({ available: true, count: 10 });
  });

  it('returns undefined when every asset is audio', () => {
    expect(derivePrintablesFromAssetCounts({ total: 3, audio: 3 })).toBeUndefined();
  });

  it('returns undefined when total is zero', () => {
    expect(derivePrintablesFromAssetCounts({ total: 0 })).toBeUndefined();
  });
});

describe('resolveIndicators with assetCounts fallback', () => {
  it('derives pack printables from assetCounts when not explicitly authored', () => {
    const result = resolveIndicators(
      { assetCounts: { total: 5, audio: 1 } },
      null,
    );
    expect(result.printables).toEqual({ available: true, count: 4 });
  });

  it('respects explicit pack printables.available=false even when assetCounts has printables', () => {
    const result = resolveIndicators(
      { printables: { available: false }, assetCounts: { total: 5, audio: 0 } },
      null,
    );
    // Author explicitly opted out; derivation should not override.
    expect(result.printables?.available).toBe(false);
  });

  it('module without printables inherits the pack-derived value', () => {
    const result = resolveIndicators(
      { assetCounts: { total: 6, audio: 0 } },
      {}, // module has no printables field at all
    );
    expect(result.printables?.available).toBe(true);
    expect(result.printables?.count).toBe(6);
  });

  it('module printables.available=true overrides pack derivation', () => {
    const result = resolveIndicators(
      { assetCounts: { total: 0 } }, // pack would derive to undefined
      { printables: { available: true, count: 2 } },
    );
    expect(result.printables?.available).toBe(true);
    expect(result.printables?.count).toBe(2);
  });
});

describe('hasAnyIndicator', () => {
  it('returns false when nothing is set', () => {
    expect(hasAnyIndicator(undefined)).toBe(false);
    expect(hasAnyIndicator({})).toBe(false);
    expect(hasAnyIndicator({ printables: { available: false } })).toBe(false);
    expect(hasAnyIndicator({ materials: { mode: 'none' } })).toBe(false);
  });

  it('returns true when printables are available', () => {
    expect(hasAnyIndicator({ printables: { available: true } })).toBe(true);
  });

  it('returns true when materials mode is set', () => {
    expect(hasAnyIndicator({ materials: { mode: 'ships-with' } })).toBe(true);
    expect(hasAnyIndicator({ materials: { mode: 'required' } })).toBe(true);
  });
});
