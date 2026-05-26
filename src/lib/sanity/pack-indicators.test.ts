import { describe, it, expect } from 'vitest';
import { resolveIndicators, hasAnyIndicator } from './pack-indicators';

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
