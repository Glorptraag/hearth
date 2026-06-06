import { describe, it, expect } from 'vitest';
import {
  ACTIVITY_SUBJECT_MAP,
  deriveSubjects,
  deriveEntryTitle,
  derivePhotoEvidenceUrls,
  derivePhotoEvidenceRows,
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

describe('derivePhotoEvidenceRows', () => {
  it('mirrors the photo URLs but carries captions', () => {
    const rows = derivePhotoEvidenceRows([
      { type: 'photo', content: 'a.jpg', caption: 'Block tower' },
      { type: 'quote', content: 'a wise thing' },
      { type: 'photo', content: 'b.jpg' },
    ]);
    expect(rows).toEqual([
      { kind: 'photo', content: 'a.jpg', caption: 'Block tower' },
      { kind: 'photo', content: 'b.jpg' },
    ]);
  });

  it('omits blank/whitespace-only captions and trims kept ones', () => {
    expect(
      derivePhotoEvidenceRows([
        { type: 'photo', content: 'a.jpg', caption: '   ' },
        { type: 'photo', content: 'b.jpg', caption: '  spaced  ' },
      ]),
    ).toEqual([
      { kind: 'photo', content: 'a.jpg' },
      { kind: 'photo', content: 'b.jpg', caption: 'spaced' },
    ]);
  });

  it('returns an empty array when there is no photo evidence', () => {
    expect(derivePhotoEvidenceRows([{ type: 'note', content: 'n' }])).toEqual([]);
    expect(derivePhotoEvidenceRows([])).toEqual([]);
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
      { type: 'photo', content: 'https://img/1', caption: 'Marble run' },
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
    // Dual-write rows mirror the photo URLs but keep the caption.
    expect(p.evidence).toEqual([
      { kind: 'photo', content: 'https://img/1', caption: 'Marble run' },
    ]);
    expect(p.status).toBe('complete');
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
