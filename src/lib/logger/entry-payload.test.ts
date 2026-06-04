import { describe, it, expect } from 'vitest';
import {
  ACTIVITY_SUBJECT_MAP,
  deriveSubjects,
  deriveEntryTitle,
  deriveFallbackTitle,
  derivePhotoEvidenceUrlsLegacy,
  deriveEvidenceRows,
  isThinEntry,
  buildEntrySavePayload,
  type EntrySaveForm,
  type EntrySaveContext,
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

describe('deriveFallbackTitle', () => {
  it('labels by the first subject when one is present', () => {
    expect(deriveFallbackTitle(['mathematics'], '2026-06-01')).toBe('Maths learning');
    expect(deriveFallbackTitle(['science', 'arts'], '2026-06-01')).toBe('Science learning');
  });

  it('falls back to the date when there are no subjects', () => {
    expect(deriveFallbackTitle([], '2026-06-01')).toBe('Learning on 2026-06-01');
  });

  it('falls back to a generic label when there is no subject or date', () => {
    expect(deriveFallbackTitle([], '')).toBe('Learning entry');
  });
});

describe('derivePhotoEvidenceUrlsLegacy', () => {
  it('keeps only photo content, in order', () => {
    const urls = derivePhotoEvidenceUrlsLegacy([
      { type: 'photo', content: 'a.jpg' },
      { type: 'quote', content: 'a wise thing' },
      { type: 'photo', content: 'b.jpg' },
      { type: 'link', content: 'https://x' },
    ]);
    expect(urls).toEqual(['a.jpg', 'b.jpg']);
  });

  it('returns an empty array when there is no photo evidence', () => {
    expect(derivePhotoEvidenceUrlsLegacy([{ type: 'note', content: 'n' }])).toEqual([]);
    expect(derivePhotoEvidenceUrlsLegacy([])).toEqual([]);
  });
});

describe('deriveEvidenceRows', () => {
  it('maps all five evidence kinds into normalised row shapes', () => {
    const input = [
      { kind: 'photo' as const, content: 'https://blob/a.jpg', caption: 'Sunset painting' },
      { kind: 'quote' as const, content: 'The world is flat', caption: undefined },
      { kind: 'note' as const, content: 'Struggled with fractions' },
      { kind: 'link' as const, content: 'https://example.com', metadata: { title: 'Reference' } },
      { kind: 'audio' as const, content: 'https://blob/rec.webm', metadata: { durationMs: 5200, mimeType: 'audio/webm' } },
    ];
    const rows = deriveEvidenceRows(input);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({ kind: 'photo', content: 'https://blob/a.jpg', caption: 'Sunset painting', metadata: {} });
    expect(rows[1]).toEqual({ kind: 'quote', content: 'The world is flat', caption: null, metadata: {} });
    expect(rows[2]).toEqual({ kind: 'note', content: 'Struggled with fractions', caption: null, metadata: {} });
    expect(rows[3]).toEqual({ kind: 'link', content: 'https://example.com', caption: null, metadata: { title: 'Reference' } });
    expect(rows[4]).toEqual({ kind: 'audio', content: 'https://blob/rec.webm', caption: null, metadata: { durationMs: 5200, mimeType: 'audio/webm' } });
  });

  it('returns empty array for empty input', () => {
    expect(deriveEvidenceRows([])).toEqual([]);
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

describe('buildEntrySavePayload', () => {
  const baseForm: EntrySaveForm = {
    description: 'Built a marble run and tested ramps',
    dateOccurred: '2026-06-01',
    activityType: 'cooking',
    lessonSubjects: [],
    selectedLearners: ['L1', 'L2'],
    engagement: { L1: 4, L2: 3 },
    discoveries: { L1: 'gravity' },
    evidence: [
      { type: 'photo', content: 'https://img/1' },
      { type: 'note', content: 'ignored' },
    ],
    loggerMode: 'quick',
    observationDetails: { L1: { chip: 'focused' } },
  };
  const baseCtx: EntrySaveContext = {
    scaffoldSessionId: undefined,
    projectSource: 'logger',
    projectId: undefined,
    stageNumber: undefined,
  };

  it('composes the derived fields (title, subjects, evidence URLs)', () => {
    const p = buildEntrySavePayload(baseForm, baseCtx);
    expect(p.title).toBe('Built a marble run and tested ramps');
    expect(p.subjects).toEqual(['mathematics', 'science']); // cooking
    expect(p.evidenceUrls).toEqual(['https://img/1']); // photos only
    expect(p.status).toBe('complete');
  });

  it('never produces an empty title for a description-less Quick log', () => {
    // Tap-only Quick log: no typed description. Title must fall back to the
    // first subject (otherwise the server's title.min(1) check 400s the save).
    const p = buildEntrySavePayload({ ...baseForm, description: '' }, baseCtx);
    expect(p.title).toBe('Maths learning'); // cooking → mathematics first
    expect(p.title.length).toBeGreaterThan(0);
  });

  it('falls back to a date title when there is no description and no subject', () => {
    const p = buildEntrySavePayload(
      { ...baseForm, description: '   ', activityType: null, lessonSubjects: [] },
      baseCtx,
    );
    expect(p.title).toBe('Learning on 2026-06-01');
  });

  it('passes form fields straight through', () => {
    const p = buildEntrySavePayload(baseForm, baseCtx);
    expect(p.learnerIds).toEqual(['L1', 'L2']);
    expect(p.engagementPerLearner).toEqual({ L1: 4, L2: 3 });
    expect(p.discoveriesPerLearner).toEqual({ L1: 'gravity' });
    expect(p.dateOccurred).toBe('2026-06-01');
    expect(p.mode).toBe('quick');
  });

  it('omits observation details in Quick mode and includes them in Guided mode', () => {
    expect(buildEntrySavePayload(baseForm, baseCtx).observationDetails).toBeUndefined();
    const guided = buildEntrySavePayload({ ...baseForm, loggerMode: 'guided' }, baseCtx);
    expect(guided.observationDetails).toEqual({ L1: { chip: 'focused' } });
  });

  it('uses the project-context source/ids when not scaffolded', () => {
    const p = buildEntrySavePayload(baseForm, {
      scaffoldSessionId: undefined,
      projectSource: 'project',
      projectId: 'proj-1',
      stageNumber: '2',
    });
    expect(p.source).toBe('project');
    expect(p.sourceSessionId).toBeUndefined();
    expect(p.projectId).toBe('proj-1');
    expect(p.stageNumber).toBe('2');
  });

  it("reports source 'hearth_session' and carries the session id when scaffolded", () => {
    const p = buildEntrySavePayload(baseForm, { ...baseCtx, scaffoldSessionId: 'sess-9' });
    expect(p.source).toBe('hearth_session');
    expect(p.sourceSessionId).toBe('sess-9');
  });
});
