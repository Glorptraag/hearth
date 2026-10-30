import { describe, it, expect } from 'vitest';
import { minSupportedBuild } from './native-config';

describe('minSupportedBuild', () => {
  it('defaults to 1 so no installed build is locked out by a missing env var', () => {
    expect(minSupportedBuild(undefined)).toBe(1);
    expect(minSupportedBuild('')).toBe(1);
  });

  it('reads a positive integer', () => {
    expect(minSupportedBuild('42')).toBe(42);
  });

  it.each(['0', '-3', 'abc'])('falls back to 1 for invalid %j', (raw) => {
    expect(minSupportedBuild(raw)).toBe(1);
  });
});
