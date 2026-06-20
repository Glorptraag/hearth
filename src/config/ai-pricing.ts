/**
 * Per-model Anthropic pricing for the admin AI Cost dashboard.
 *
 * Rates are in USD per million tokens (input / output). Verify against
 * Anthropic's pricing page before launch and after any model bump — the
 * numbers below are correct as of pilot preparation 2026-04 but the source
 * of truth is Anthropic's site.
 *
 * `priceFor(model)` resolves any `model_used` value (with or without a
 * `-draft` suffix, with or without a `-YYYYMMDD` date stamp) by falling
 * back through (1) exact match, (2) `claude-{family}-{tier}` prefix match
 * (e.g. `claude-haiku-4-5`), (3) family-only match (`claude-haiku`),
 * (4) Haiku-equivalent default so unknown models do not silently
 * underestimate.
 */

export const PRICING_PER_MTOK: Record<string, { input: number; output: number }> = {
  // Haiku family — cheap; default tier for enrichment
  'claude-haiku-4-5': { input: 0.8, output: 4.0 },
  'claude-haiku-4-6': { input: 1.0, output: 5.0 },

  // Sonnet family — mid-tier
  'claude-sonnet-4': { input: 3.0, output: 15.0 },
  'claude-sonnet-4-5': { input: 3.0, output: 15.0 },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-sonnet-4-7': { input: 3.0, output: 15.0 },

  // Opus family — premium; should not appear in enrichment
  'claude-opus-4-5': { input: 15.0, output: 75.0 },
  'claude-opus-4-6': { input: 15.0, output: 75.0 },
  'claude-opus-4-7': { input: 15.0, output: 75.0 },

  // Family-only fallbacks for any future minor versions
  'claude-haiku': { input: 0.8, output: 4.0 },
  'claude-sonnet': { input: 3.0, output: 15.0 },
  'claude-opus': { input: 15.0, output: 75.0 },

  // Final fallback — Haiku-equivalent so unknown models don't underestimate
  default: { input: 0.8, output: 4.0 },
};

export function priceFor(model: string): { input: number; output: number } {
  // Strip suffixes that don't change the price.
  const base = model.replace(/-draft$/, '').replace(/-(\d{8}|\d{6})$/, '');
  // 1) exact match on what's left
  if (PRICING_PER_MTOK[base]) return PRICING_PER_MTOK[base];
  // 2) walk back the dashed segments — `claude-haiku-4-5-20251001` ->
  //    `claude-haiku-4-5` -> `claude-haiku-4` -> `claude-haiku` -> default
  const parts = base.split('-');
  while (parts.length > 1) {
    parts.pop();
    const key = parts.join('-');
    if (PRICING_PER_MTOK[key]) return PRICING_PER_MTOK[key];
  }
  return PRICING_PER_MTOK.default;
}
