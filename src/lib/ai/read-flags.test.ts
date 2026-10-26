/**
 * Photo Read gates (launch pivot W1.4; A3, D-LP-3, D-LP-4). Read stays OFF
 * unless every gate holds — the order matters because the first failing gate
 * is the reason logged, and the flag + allowlist pair is the I/O-free check
 * enrichEntry runs before it touches the database.
 */
import { describe, expect, it } from 'vitest';
import {
  PHOTO_READ_LIMITS,
  estimateImageTokens,
  imageWithinReadBudget,
  parsePhotoReadAllowlist,
  photoReadAvailableFor,
  photoReadEnabled,
  photoReadGate,
} from './read-flags';

const FAMILY = 'fam-demo';
const ON = { PHOTO_READ_ENABLED: 'true' };

describe('photoReadEnabled', () => {
  it('is off when the flag is unset, blank or anything but "true"', () => {
    expect(photoReadEnabled({})).toBe(false);
    expect(photoReadEnabled({ PHOTO_READ_ENABLED: '' })).toBe(false);
    expect(photoReadEnabled({ PHOTO_READ_ENABLED: '1' })).toBe(false);
    expect(photoReadEnabled({ PHOTO_READ_ENABLED: 'yes' })).toBe(false);
    expect(photoReadEnabled({ PHOTO_READ_ENABLED: 'false' })).toBe(false);
  });

  it('is on only for "true" (trimmed, any case)', () => {
    expect(photoReadEnabled({ PHOTO_READ_ENABLED: 'true' })).toBe(true);
    expect(photoReadEnabled({ PHOTO_READ_ENABLED: ' TRUE ' })).toBe(true);
  });
});

describe('parsePhotoReadAllowlist', () => {
  it('returns null when unset or blank (no allowlist)', () => {
    expect(parsePhotoReadAllowlist(undefined)).toBeNull();
    expect(parsePhotoReadAllowlist('')).toBeNull();
    expect(parsePhotoReadAllowlist(' , ,')).toBeNull();
  });

  it('splits on commas and trims', () => {
    expect([...(parsePhotoReadAllowlist(' a , b,c ') ?? [])]).toEqual(['a', 'b', 'c']);
  });
});

describe('photoReadAvailableFor', () => {
  it('is false with the flag off, even for an allowlisted family', () => {
    expect(photoReadAvailableFor(FAMILY, { PHOTO_READ_FAMILY_ALLOWLIST: FAMILY })).toBe(false);
  });

  it('allows any family when the flag is on and no allowlist is set', () => {
    expect(photoReadAvailableFor(FAMILY, ON)).toBe(true);
  });

  it('restricts to the allowlist when one is set', () => {
    const env = { ...ON, PHOTO_READ_FAMILY_ALLOWLIST: 'other, fam-demo' };
    expect(photoReadAvailableFor(FAMILY, env)).toBe(true);
    expect(photoReadAvailableFor('fam-visitor', env)).toBe(false);
  });
});

describe('photoReadGate', () => {
  const ok = { familyId: FAMILY, optIn: true, photoCount: 1 };

  it('reads only when all four gates hold', () => {
    expect(photoReadGate(ok, { ...ON, PHOTO_READ_FAMILY_ALLOWLIST: FAMILY })).toEqual({ read: true });
  });

  it('names the first failing gate, in order', () => {
    expect(photoReadGate(ok, {})).toEqual({ read: false, reason: 'flag-off' });
    expect(photoReadGate(ok, { ...ON, PHOTO_READ_FAMILY_ALLOWLIST: 'someone-else' })).toEqual({
      read: false,
      reason: 'not-allowlisted',
    });
    expect(photoReadGate({ ...ok, optIn: false }, ON)).toEqual({ read: false, reason: 'not-opted-in' });
    expect(photoReadGate({ ...ok, photoCount: 0 }, ON)).toEqual({ read: false, reason: 'no-photo' });
  });

  it('treats a never-answered disclosure (null) as not opted in', () => {
    expect(photoReadGate({ ...ok, optIn: null }, ON)).toEqual({ read: false, reason: 'not-opted-in' });
    expect(photoReadGate({ ...ok, optIn: undefined }, ON)).toEqual({ read: false, reason: 'not-opted-in' });
  });
});

describe('image token budget', () => {
  it('estimates tokens as width × height / 750, rounded up', () => {
    expect(estimateImageTokens(750, 1)).toBe(1);
    expect(estimateImageTokens(768, 576)).toBe(590);
    expect(estimateImageTokens(0, 10)).toBe(Infinity);
  });

  it('fits a client-prepped 768 px photo, and rejects anything over the cap', () => {
    expect(imageWithinReadBudget(768, 768)).toBe(true);
    expect(imageWithinReadBudget(1024, 1024)).toBe(false);
    // Just under / just over the cap.
    const cap = PHOTO_READ_LIMITS.imageInputTokenCap;
    expect(imageWithinReadBudget(cap * 750, 1)).toBe(true);
    expect(imageWithinReadBudget(cap * 750 + 1, 1)).toBe(false);
  });

  it('keeps the documented budgets (pivot plan W1.4)', () => {
    expect(PHOTO_READ_LIMITS.imageInputTokenCap).toBe(1300);
    expect(PHOTO_READ_LIMITS.readOutputTokenCap).toBe(250);
    expect(PHOTO_READ_LIMITS.maxImages).toBe(1);
  });
});
