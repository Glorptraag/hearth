import { describe, it, expect } from 'vitest';
import { evidenceSrc, authorizeEvidenceRef } from './evidence';

describe('evidenceSrc', () => {
  it('returns empty string for nullish/empty refs', () => {
    expect(evidenceSrc(null)).toBe('');
    expect(evidenceSrc(undefined)).toBe('');
    expect(evidenceSrc('')).toBe('');
  });

  it('passes through legacy absolute blob URLs unchanged', () => {
    const u = 'https://abc.public.blob.vercel-storage.com/evidence/fam/1.jpg';
    expect(evidenceSrc(u)).toBe(u);
  });

  it('proxies a private blob pathname through the authenticated route', () => {
    expect(evidenceSrc('evidence/fam_1/123.jpg')).toBe(
      '/api/evidence?ref=evidence%2Ffam_1%2F123.jpg',
    );
  });
});

describe('authorizeEvidenceRef', () => {
  it("accepts a pathname under the caller's own family prefix", () => {
    expect(authorizeEvidenceRef('evidence/fam_1/123.jpg', 'fam_1')).toBe('evidence/fam_1/123.jpg');
  });

  it("rejects another family's pathname", () => {
    expect(authorizeEvidenceRef('evidence/fam_2/123.jpg', 'fam_1')).toBeNull();
  });

  it('rejects path traversal', () => {
    expect(authorizeEvidenceRef('evidence/fam_1/../fam_2/1.jpg', 'fam_1')).toBeNull();
  });

  it('rejects non-evidence prefixes', () => {
    expect(authorizeEvidenceRef('hearth-evidence/fam_1/1.jpg', 'fam_1')).toBeNull();
    expect(authorizeEvidenceRef('secrets/fam_1/1.jpg', 'fam_1')).toBeNull();
  });

  it('rejects absolute URLs and leading slashes', () => {
    expect(authorizeEvidenceRef('https://x/evidence/fam_1/1.jpg', 'fam_1')).toBeNull();
    expect(authorizeEvidenceRef('/evidence/fam_1/1.jpg', 'fam_1')).toBeNull();
  });

  it('rejects too-short paths and nullish refs', () => {
    expect(authorizeEvidenceRef('evidence/fam_1', 'fam_1')).toBeNull();
    expect(authorizeEvidenceRef(null, 'fam_1')).toBeNull();
    expect(authorizeEvidenceRef('', 'fam_1')).toBeNull();
  });
});
