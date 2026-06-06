import { describe, it, expect } from 'vitest';
import { evidenceSrc, authorizeEvidenceRef, entryPhotoEvidence, entryEvidence } from './evidence';

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

describe('entryPhotoEvidence', () => {
  it('prefers the caption-carrying evidence rows when present', () => {
    expect(
      entryPhotoEvidence({
        evidence: [
          { kind: 'photo', content: 'evidence/fam_1/1.jpg', caption: 'Block tower' },
          { kind: 'photo', content: 'evidence/fam_1/2.jpg', caption: null },
        ],
        evidenceUrls: ['legacy.jpg'],
      }),
    ).toEqual([
      { ref: 'evidence/fam_1/1.jpg', caption: 'Block tower' },
      { ref: 'evidence/fam_1/2.jpg', caption: null },
    ]);
  });

  it('keeps only photo rows, dropping other kinds', () => {
    expect(
      entryPhotoEvidence({
        evidence: [
          { kind: 'note', content: 'a note', caption: null },
          { kind: 'photo', content: '1.jpg', caption: 'Caption' },
        ],
        evidenceUrls: [],
      }),
    ).toEqual([{ ref: '1.jpg', caption: 'Caption' }]);
  });

  it('falls back to evidenceUrls (no captions) for pre-migration entries', () => {
    expect(
      entryPhotoEvidence({ evidence: [], evidenceUrls: ['a.jpg', 'b.jpg'] }),
    ).toEqual([
      { ref: 'a.jpg', caption: null },
      { ref: 'b.jpg', caption: null },
    ]);
    // evidence undefined behaves the same as empty.
    expect(entryPhotoEvidence({ evidenceUrls: ['a.jpg'] })).toEqual([
      { ref: 'a.jpg', caption: null },
    ]);
  });

  it('returns an empty array when there is no evidence at all', () => {
    expect(entryPhotoEvidence({})).toEqual([]);
    expect(entryPhotoEvidence({ evidence: null, evidenceUrls: null })).toEqual([]);
  });
});

describe('entryEvidence', () => {
  it('returns every kind from the evidence rows, in row order', () => {
    expect(
      entryEvidence({
        evidence: [
          { kind: 'photo', content: 'a.jpg', caption: 'Tower' },
          { kind: 'quote', content: 'I did it!', caption: null },
          { kind: 'note', content: 'Long focus', caption: null },
          { kind: 'link', content: 'https://abc.net.au', caption: 'ABC Splash' },
        ],
        // Legacy column is ignored once rows are present.
        evidenceUrls: ['legacy.jpg'],
      }),
    ).toEqual([
      { kind: 'photo', content: 'a.jpg', caption: 'Tower' },
      { kind: 'quote', content: 'I did it!', caption: null },
      { kind: 'note', content: 'Long focus', caption: null },
      { kind: 'link', content: 'https://abc.net.au', caption: 'ABC Splash' },
    ]);
  });

  it('falls back to evidenceUrls as photos for pre-migration entries', () => {
    expect(entryEvidence({ evidence: [], evidenceUrls: ['a.jpg', 'b.jpg'] })).toEqual([
      { kind: 'photo', content: 'a.jpg', caption: null },
      { kind: 'photo', content: 'b.jpg', caption: null },
    ]);
    // evidence undefined behaves the same as empty.
    expect(entryEvidence({ evidenceUrls: ['a.jpg'] })).toEqual([
      { kind: 'photo', content: 'a.jpg', caption: null },
    ]);
  });

  it('returns an empty array when there is no evidence at all', () => {
    expect(entryEvidence({})).toEqual([]);
    expect(entryEvidence({ evidence: null, evidenceUrls: null })).toEqual([]);
  });
});
