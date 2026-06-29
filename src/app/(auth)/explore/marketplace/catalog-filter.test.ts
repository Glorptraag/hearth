import { describe, it, expect } from 'vitest';
import { packMatchesFilter, moduleMatchesFilter } from './catalog-filter';
import type { Subject } from '@/components/screens/MarketplaceCard';

describe('packMatchesFilter', () => {
  const pack = {
    title: 'Backyard Botany',
    creator: 'Jane Educator',
    description: 'Observe and sketch local plants',
    subjects: ['science', 'arts'] as Subject[],
  };

  it('matches an empty query (no filter)', () => {
    expect(packMatchesFilter(pack, '', null)).toBe(true);
  });

  it('matches on title, creator, and description (case-insensitive)', () => {
    expect(packMatchesFilter(pack, 'botany', null)).toBe(true);
    expect(packMatchesFilter(pack, 'jane', null)).toBe(true);
    expect(packMatchesFilter(pack, 'SKETCH', null)).toBe(true);
  });

  it('rejects a non-matching query', () => {
    expect(packMatchesFilter(pack, 'algebra', null)).toBe(false);
  });

  it('honours the subject filter', () => {
    expect(packMatchesFilter(pack, '', 'science')).toBe(true);
    expect(packMatchesFilter(pack, '', 'mathematics')).toBe(false);
  });

  it('requires both query and subject to match', () => {
    expect(packMatchesFilter(pack, 'botany', 'science')).toBe(true);
    expect(packMatchesFilter(pack, 'botany', 'mathematics')).toBe(false);
  });

  it('tolerates missing optional fields', () => {
    expect(packMatchesFilter({ title: 'Bare' }, 'bare', null)).toBe(true);
    expect(packMatchesFilter({ title: 'Bare' }, '', 'science')).toBe(false);
  });
});

describe('moduleMatchesFilter', () => {
  const mod = {
    title: 'Fraction Walls',
    targetUnderstanding: 'Equivalent fractions are different names for the same amount',
    subjects: ['mathematics'] as Subject[],
  };

  it('matches an empty query', () => {
    expect(moduleMatchesFilter(mod, '', null)).toBe(true);
  });

  it('matches on title and targetUnderstanding (not creator — modules have none)', () => {
    expect(moduleMatchesFilter(mod, 'fraction', null)).toBe(true);
    expect(moduleMatchesFilter(mod, 'equivalent', null)).toBe(true);
  });

  it('rejects a non-matching query', () => {
    expect(moduleMatchesFilter(mod, 'photosynthesis', null)).toBe(false);
  });

  it('honours the subject filter', () => {
    expect(moduleMatchesFilter(mod, '', 'mathematics')).toBe(true);
    expect(moduleMatchesFilter(mod, '', 'science')).toBe(false);
  });

  it('tolerates a null targetUnderstanding', () => {
    expect(moduleMatchesFilter({ title: 'Solo', targetUnderstanding: null }, 'solo', null)).toBe(true);
  });
});
