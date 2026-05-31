import { describe, it, expect } from 'vitest';
import {
  ACTIVITY_SUBJECT_MAP,
  deriveSubjects,
  deriveEntryTitle,
  derivePhotoEvidenceUrls,
  isThinEntry,
} from './entry-payload';

describe('deriveSubjects', () => {
  it('uses the explicit lesson subjects for a structured lesson', () => {
    expect(deriveSubjects('structured', ['english', 'hass'])).toEqual(['english', 'hass']);
  });

  it('ignores lesson subjects for a non-structured activity', () => {
    expect(deriveSubjects('cooking', ['english'])).toEqual(['mathematics', 'science']);
  });

  it('maps each known activity type to its curriculum subjects', () => {
    for (const [type, subjects] of Object.entries(ACTIVITY_SUBJECT_MAP)) {
      if (type === 'structured') continue; // structured reads from the picker
      expect(deriveSubjects(type, [])).toEqual(subjects);
    }
  });

  it('returns no subjects for an unknown or absent activity type', () => {
    expect(deriveSubjects('made-up', [])).toEqual([]);
    expect(deriveSubjects(null, [])).toEqual([]);
  });
});

describe('deriveEntryTitle', () => {
  it('returns a short description untouched (no ellipsis)', () => {
    expect(deriveEntryTitle('We baked sourdough')).toBe('We baked sourdough');
  });

  it('truncates to 60 chars and appends an ellipsis when longer', () => {
    const long = 'x'.repeat(80);
    const title = deriveEntryTitle(long);
    expect(title).toBe('x'.repeat(60) + '...');
  });

  it('trims trailing whitespace before any ellipsis', () => {
    // 58 visible chars + 2 trailing spaces = 60-char slice; description is longer.
    const desc = 'a'.repeat(58) + '  trailing tail beyond sixty chars';
    expect(deriveEntryTitle(desc)).toBe('a'.repeat(58) + '...');
  });

  it('does not add an ellipsis at exactly 60 chars', () => {
    const exact = 'y'.repeat(60);
    expect(deriveEntryTitle(exact)).toBe(exact);
  });
});

describe('derivePhotoEvidenceUrls', () => {
  it('keeps only photo content, in order', () => {
    const urls = derivePhotoEvidenceUrls([
      { type: 'photo', content: 'a.jpg' },
      { type: 'quote', content: 'a wise thing' },
      { type: 'photo', content: 'b.jpg' },
      { type: 'link', content: 'https://x' },
    ]);
    expect(urls).toEqual(['a.jpg', 'b.jpg']);
  });

  it('returns an empty array when there is no photo evidence', () => {
    expect(derivePhotoEvidenceUrls([{ type: 'note', content: 'n' }])).toEqual([]);
    expect(derivePhotoEvidenceUrls([])).toEqual([]);
  });
});

describe('isThinEntry', () => {
  const thin = {
    description: 'short',
    observationDetails: {},
    evidenceUrlCount: 0,
    completeness: 40,
  };

  it('is true only when all four signals agree', () => {
    expect(isThinEntry(thin)).toBe(true);
  });

  it('is false when the description is long', () => {
    expect(isThinEntry({ ...thin, description: 'q'.repeat(60) })).toBe(false);
  });

  it('is false when there are observation details', () => {
    expect(isThinEntry({ ...thin, observationDetails: { focus: 'deep' } })).toBe(false);
  });

  it('is false when evidence is attached', () => {
    expect(isThinEntry({ ...thin, evidenceUrlCount: 1 })).toBe(false);
  });

  it('is false when completeness reaches the Strong threshold', () => {
    expect(isThinEntry({ ...thin, completeness: 55 })).toBe(false);
  });

  it('treats undefined observation details as empty', () => {
    expect(isThinEntry({ ...thin, observationDetails: undefined })).toBe(true);
  });
});
