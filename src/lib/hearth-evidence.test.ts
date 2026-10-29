// Path authorisation + consent filtering for Hearth session photos. The proxy
// (GET /api/hearths/[id]/evidence) trusts parseHearthEvidenceRef to reject
// every ref that isn't a hearth-scoped pathname, so the refusals are exhaustive.

import { describe, it, expect } from 'vitest';
import {
  canViewHearthEvidence,
  hearthEvidencePath,
  hearthEvidenceSrc,
  parseHearthEvidenceRef,
  visibleHearthEvidence,
} from './hearth-evidence';

const H = '11111111-1111-4111-8111-111111111111';
const S = '22222222-2222-4222-8222-222222222222';
const F = '33333333-3333-4333-8333-333333333333';
const OTHER = '44444444-4444-4444-8444-444444444444';
const VALID = `hearth-evidence/${H}/${S}/${F}/1729-AbC123xyz.jpg`;

describe('parseHearthEvidenceRef', () => {
  it('parses a hearth-scoped pathname into its ids', () => {
    expect(parseHearthEvidenceRef(VALID)).toEqual({ pathname: VALID, hearthId: H, sessionId: S, familyId: F });
  });

  it('round-trips a path built by hearthEvidencePath', () => {
    const p = hearthEvidencePath({ hearthId: H, sessionId: S, familyId: F }, 'webp');
    expect(parseHearthEvidenceRef(p)?.hearthId).toBe(H);
  });

  it.each([
    ['empty', ''],
    ['null', null],
    ['family evidence prefix', `evidence/${F}/1.jpg`],
    ['wrong prefix', `hearth-photos/${H}/${S}/${F}/1.jpg`],
    ['legacy layout', `hearth-evidence/${S}/1729-photo.jpg`],
    ['extra segment', `hearth-evidence/${H}/${S}/${F}/x/1.jpg`],
    ['missing file', `hearth-evidence/${H}/${S}/${F}/`],
    ['traversal', `hearth-evidence/${H}/${S}/${F}/../../${OTHER}/1.jpg`],
    ['dotdot file', `hearth-evidence/${H}/${S}/${F}/..`],
    ['leading slash', `/hearth-evidence/${H}/${S}/${F}/1.jpg`],
    ['absolute URL', `https://x.public.blob.vercel-storage.com/hearth-evidence/${H}/${S}/${F}/1.jpg`],
    ['other scheme', `blob:hearth-evidence/${H}/${S}/${F}/1.jpg`],
    ['backslash', `hearth-evidence/${H}/${S}/${F}/a\\b.jpg`],
    ['non-uuid hearth', `hearth-evidence/not-a-uuid/${S}/${F}/1.jpg`],
    ['non-uuid family', `hearth-evidence/${H}/${S}/fam_1/1.jpg`],
    ['hidden file', `hearth-evidence/${H}/${S}/${F}/.env`],
    ['space in file', `hearth-evidence/${H}/${S}/${F}/my child.jpg`],
  ])('rejects %s', (_label, ref) => {
    expect(parseHearthEvidenceRef(ref as string | null)).toBeNull();
  });
});

describe('hearthEvidenceSrc', () => {
  it('routes a pathname through the hearth proxy', () => {
    expect(hearthEvidenceSrc(H, VALID)).toBe(`/api/hearths/${H}/evidence?ref=${encodeURIComponent(VALID)}`);
  });

  it('passes a legacy public URL through until the migration rewrites it', () => {
    const url = 'https://abc.public.blob.vercel-storage.com/hearth-evidence/s/1.jpg';
    expect(hearthEvidenceSrc(H, url)).toBe(url);
  });

  it('returns an empty string for an empty ref', () => {
    expect(hearthEvidenceSrc(H, '')).toBe('');
  });
});

describe('consent filtering', () => {
  const sharing = new Set([OTHER]);

  it('lets the uploader see its own photo without consent', () => {
    expect(canViewHearthEvidence(F, F, new Set())).toBe(true);
  });

  it('shows a consenting family’s photo to others', () => {
    expect(canViewHearthEvidence(OTHER, F, sharing)).toBe(true);
  });

  it('hides a non-consenting family’s photo from others', () => {
    expect(canViewHearthEvidence(F, OTHER, sharing)).toBe(false);
  });

  it('visibleHearthEvidence filters and rewrites fileUrl to the proxy src', () => {
    const rows = [
      { id: 'a', uploadedByFamilyId: OTHER, fileUrl: VALID },
      { id: 'b', uploadedByFamilyId: 'non-consenting', fileUrl: VALID },
    ];
    const out = visibleHearthEvidence(rows, H, F, sharing);
    expect(out.map((r) => r.id)).toEqual(['a']);
    expect(out[0].fileUrl).toBe(hearthEvidenceSrc(H, VALID));
    expect(rows[0].fileUrl).toBe(VALID);
  });
});
