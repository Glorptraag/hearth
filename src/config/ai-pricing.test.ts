import { describe, expect, it } from 'vitest';
import { PRICING_PER_MTOK, priceFor } from './ai-pricing';

describe('priceFor', () => {
  it('prices a dated model id by its tier', () => {
    expect(priceFor('claude-haiku-4-5-20251001')).toEqual(PRICING_PER_MTOK['claude-haiku-4-5']);
    expect(priceFor('claude-sonnet-4-20250514')).toEqual(PRICING_PER_MTOK['claude-sonnet-4']);
  });

  it('prices the -draft and Photo Read -read suffixes as the base model', () => {
    expect(priceFor('claude-haiku-4-5-20251001-draft')).toEqual(PRICING_PER_MTOK['claude-haiku-4-5']);
    expect(priceFor('claude-haiku-4-5-20251001-read')).toEqual(PRICING_PER_MTOK['claude-haiku-4-5']);
  });

  it('falls back to the Haiku-equivalent default for unknown models', () => {
    expect(priceFor('mystery-model')).toEqual(PRICING_PER_MTOK.default);
  });
});
