import { describe, it, expect } from 'vitest';
import {
  deriveEntryTitle,
  deriveFallbackTitle,
  pickSelectedLearners,
  deriveNoticed,
  derivePhotoEvidenceUrls,
  deriveEvidenceRows,
  buildEntrySavePayload,
  buildLoggerContext,
} from './entry-payload';
import type { NoticeFields } from './notice';
import type { NoticeSource } from './source';

describe('deriveEntryTitle', () => {
  it('returns a short text untouched (no ellipsis)', () => {
    expect(deriveEntryTitle('We baked sourdough')).toBe('We baked sourdough');
  });

  it('truncates to 60 chars and appends an ellipsis when longer', () => {
    const long = 'x'.repeat(80);
    expect(deriveEntryTitle(long)).toBe('x'.repeat(60) + '...');
  });

  it('trims trailing whitespace before any ellipsis', () => {
    // 58 visible chars + 2 trailing spaces = 60-char slice; text is longer.
    const text = 'a'.repeat(58) + '  trailing tail beyond sixty chars';
    expect(deriveEntryTitle(text)).toBe('a'.repeat(58) + '...');
  });

  it('does not add an ellipsis at exactly 60 chars', () => {
    const exact = 'y'.repeat(60);
    expect(deriveEntryTitle(exact)).toBe(exact);
  });
});

describe('deriveFallbackTitle', () => {
  it('labels by the first evidence kind on the resolved day', () => {
    expect(deriveFallbackTitle('2026-10-06', 'photo')).toBe('Photo on 6 Oct');
    expect(deriveFallbackTitle('2026-10-06', 'quote')).toBe('Their words on 6 Oct');
    expect(deriveFallbackTitle('2026-10-06', 'link')).toBe('Link on 6 Oct');
    expect(deriveFallbackTitle('2026-10-06', 'note')).toBe('Note on 6 Oct');
  });

  it('falls back to a generic label when there is no evidence', () => {
    expect(deriveFallbackTitle('2026-10-06', null)).toBe('Learning on 6 Oct');
  });

  it('falls back to the raw string when the date is unparsable', () => {
    expect(deriveFallbackTitle('not-a-date', null)).toBe('Learning on not-a-date');
    expect(deriveFallbackTitle('not-a-date', 'photo')).toBe('Photo on not-a-date');
  });

  it('is never empty', () => {
    expect(deriveFallbackTitle('', null).length).toBeGreaterThan(0);
  });
});

describe('pickSelectedLearners', () => {
  it('keeps only the selected learners, preserving their values', () => {
    expect(pickSelectedLearners({ L1: 4, L2: 3, L3: 2 }, ['L1', 'L3'])).toEqual({ L1: 4, L3: 2 });
  });

  it('returns an empty record when nobody is selected', () => {
    expect(pickSelectedLearners({ L1: 4 }, [])).toEqual({});
  });

  it('ignores selected learners with no value', () => {
    expect(pickSelectedLearners({ L1: 4 }, ['L1', 'L2'])).toEqual({ L1: 4 });
  });
});

describe('deriveNoticed', () => {
  it('trims each entry', () => {
    expect(deriveNoticed({ L1: '  asked why the sky is blue  ' }, ['L1'])).toEqual({
      L1: 'asked why the sky is blue',
    });
  });

  it('drops blank and whitespace-only entries', () => {
    expect(deriveNoticed({ L1: '', L2: '   ', L3: 'counted to 20' }, ['L1', 'L2', 'L3'])).toEqual({
      L3: 'counted to 20',
    });
  });

  it('prunes entries for learners no longer selected', () => {
    expect(deriveNoticed({ L1: 'gravity', L3: 'friction' }, ['L1', 'L2'])).toEqual({
      L1: 'gravity',
    });
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

describe('deriveEvidenceRows', () => {
  it('maps every kind into rows (photo/quote/note/link), in order', () => {
    expect(
      deriveEvidenceRows([
        { type: 'photo', content: 'a.jpg', caption: 'Block tower' },
        { type: 'quote', content: 'I made it taller!' },
        { type: 'note', content: 'Worked for 40 minutes' },
        { type: 'link', content: 'ABC Splash', name: 'ABC Splash', url: 'https://abc.net.au' },
      ]),
    ).toEqual([
      { kind: 'photo', content: 'a.jpg', caption: 'Block tower' },
      { kind: 'quote', content: 'I made it taller!' },
      { kind: 'note', content: 'Worked for 40 minutes' },
      { kind: 'link', content: 'https://abc.net.au', caption: 'ABC Splash' },
    ]);
  });

  it('stores a link URL as content; a URL-only link carries no caption', () => {
    expect(
      deriveEvidenceRows([{ type: 'link', content: '', name: '', url: 'https://x.test' }]),
    ).toEqual([{ kind: 'link', content: 'https://x.test' }]);
  });

  it('keeps a name-only link (no URL) with empty content and the name as caption', () => {
    expect(
      deriveEvidenceRows([{ type: 'link', content: 'Library book', name: 'Library book', url: '' }]),
    ).toEqual([{ kind: 'link', content: '', caption: 'Library book' }]);
  });

  it('omits blank/whitespace-only photo captions and trims kept ones', () => {
    expect(
      deriveEvidenceRows([
        { type: 'photo', content: 'a.jpg', caption: '   ' },
        { type: 'photo', content: 'b.jpg', caption: '  spaced  ' },
      ]),
    ).toEqual([
      { kind: 'photo', content: 'a.jpg' },
      { kind: 'photo', content: 'b.jpg', caption: 'spaced' },
    ]);
  });

  it('drops empty quotes/notes and fully-empty links', () => {
    expect(
      deriveEvidenceRows([
        { type: 'quote', content: '   ' },
        { type: 'note', content: '' },
        { type: 'link', content: '', name: '', url: '' },
      ]),
    ).toEqual([]);
  });

  it('returns an empty array when there is no evidence', () => {
    expect(deriveEvidenceRows([])).toEqual([]);
  });
});

describe('buildEntrySavePayload', () => {
  // Local-time constructor: `todayIso` formats in local time, so the test is
  // stable regardless of the runner's TZ.
  const NOW = new Date(2026, 9, 6, 10, 30); // Tue 6 Oct 2026

  const baseFields: NoticeFields = {
    learnerIds: ['L1', 'L2'],
    text: 'Built a marble run and tested ramps',
    dateOccurred: null,
    felt: { L1: 4, L2: 3 },
    noticed: { L1: '  gravity  ', L2: '' },
    evidence: [
      { type: 'photo', content: 'https://img/1', caption: 'Marble run' },
      { type: 'note', content: 'Stuck with it past frustration' },
    ],
  };
  const logger: NoticeSource = { kind: 'logger' };

  it('maps felt to engagementPerLearner and noticed to discoveriesPerLearner', () => {
    const p = buildEntrySavePayload({ fields: baseFields, source: logger, now: NOW });
    expect(p.learnerIds).toEqual(['L1', 'L2']);
    expect(p.engagementPerLearner).toEqual({ L1: 4, L2: 3 });
    expect(p.discoveriesPerLearner).toEqual({ L1: 'gravity' }); // trimmed, blank dropped
    expect(p.description).toBe('Built a marble run and tested ramps');
    expect(p.status).toBe('complete');
  });

  it('prunes felt/noticed for a learner no longer selected (orphan purge)', () => {
    // Rate 3, deselect L3: the payload must carry only the two still-selected
    // learners' per-child data, never the orphaned L3 rating.
    const p = buildEntrySavePayload({
      fields: {
        ...baseFields,
        learnerIds: ['L1', 'L2'],
        felt: { L1: 4, L2: 3, L3: 2 },
        noticed: { L1: 'gravity', L3: 'friction' },
      },
      source: logger,
      now: NOW,
    });
    expect(p.engagementPerLearner).toEqual({ L1: 4, L2: 3 });
    expect(p.discoveriesPerLearner).toEqual({ L1: 'gravity' });
    expect(p.engagementPerLearner).not.toHaveProperty('L3');
    expect(p.discoveriesPerLearner).not.toHaveProperty('L3');
  });

  it('derives the title from the text when there is any', () => {
    const p = buildEntrySavePayload({ fields: baseFields, source: logger, now: NOW });
    expect(p.title).toBe('Built a marble run and tested ramps');

    const long = buildEntrySavePayload({
      fields: { ...baseFields, text: 'z'.repeat(80) },
      source: logger,
      now: NOW,
    });
    expect(long.title).toBe('z'.repeat(60) + '...');
  });

  it('never produces an empty title for a photo-only moment', () => {
    const p = buildEntrySavePayload({
      fields: { ...baseFields, text: '   ' },
      source: logger,
      now: NOW,
    });
    expect(p.title).toBe('Photo on 6 Oct');
    expect(p.description).toBe('');
  });

  it('falls back to a generic dated title when there is no text and no evidence', () => {
    const p = buildEntrySavePayload({
      fields: { ...baseFields, text: '', evidence: [] },
      source: logger,
      now: NOW,
    });
    expect(p.title).toBe('Learning on 6 Oct');
  });

  it('resolves a null date to today and keeps a past date', () => {
    const today = buildEntrySavePayload({ fields: baseFields, source: logger, now: NOW });
    expect(today.dateOccurred).toBe('2026-10-06');

    const past = buildEntrySavePayload({
      fields: { ...baseFields, dateOccurred: '2026-09-28' },
      source: logger,
      now: NOW,
    });
    expect(past.dateOccurred).toBe('2026-09-28');
  });

  it('carries photos-only evidenceUrls alongside the full evidence rows', () => {
    const p = buildEntrySavePayload({ fields: baseFields, source: logger, now: NOW });
    expect(p.evidenceUrls).toEqual(['https://img/1']);
    expect(p.evidence).toEqual([
      { kind: 'photo', content: 'https://img/1', caption: 'Marble run' },
      { kind: 'note', content: 'Stuck with it past frustration' },
    ]);
  });

  it("reports source 'logger' with no provenance keys for a plain visit", () => {
    const p = buildEntrySavePayload({ fields: baseFields, source: logger, now: NOW });
    expect(p.source).toBe('logger');
    expect(p).not.toHaveProperty('sourceSessionId');
    expect(p).not.toHaveProperty('sourceProjectId');
    expect(p).not.toHaveProperty('sourceStageNumber');
  });

  it("reports source 'logger' for a constellation check-in (check-in is not an entry source)", () => {
    const p = buildEntrySavePayload({
      fields: baseFields,
      source: { kind: 'check_in', learnerId: 'L1', threadId: 'M1' },
      now: NOW,
    });
    expect(p.source).toBe('logger');
    expect(p).not.toHaveProperty('sourceSessionId');
    expect(p).not.toHaveProperty('sourceProjectId');
    expect(p).not.toHaveProperty('sourceStageNumber');
  });

  it("reports source 'hearth_session' and carries the session id when scaffolded", () => {
    const p = buildEntrySavePayload({
      fields: baseFields,
      source: { kind: 'hearth_session', sessionId: 'sess-9', hearthId: 'hearth-1' },
      now: NOW,
    });
    expect(p.source).toBe('hearth_session');
    expect(p.sourceSessionId).toBe('sess-9');
    expect(p).not.toHaveProperty('sourceProjectId');
    expect(p).not.toHaveProperty('sourceStageNumber');
  });

  it("reports source 'project_stage' with sourceProjectId and a numeric sourceStageNumber", () => {
    // The old payload sent `projectId` / `stageNumber` (a string), which the
    // route silently stripped — provenance never persisted.
    const p = buildEntrySavePayload({
      fields: baseFields,
      source: { kind: 'project_stage', projectId: 'proj-1', stageNumber: 2 },
      now: NOW,
    });
    expect(p.source).toBe('project_stage');
    expect(p.sourceProjectId).toBe('proj-1');
    expect(p.sourceStageNumber).toBe(2);
    expect(typeof p.sourceStageNumber).toBe('number');
    expect(p).not.toHaveProperty('sourceSessionId');
  });

  it('omits sourceStageNumber entirely when the stage is unknown', () => {
    const p = buildEntrySavePayload({
      fields: baseFields,
      source: { kind: 'project_stage', projectId: 'proj-1', stageNumber: null },
      now: NOW,
    });
    expect(p.source).toBe('project_stage');
    expect(p.sourceProjectId).toBe('proj-1');
    expect(p).not.toHaveProperty('sourceStageNumber');
  });

  it('never sends the retired keys', () => {
    const sources: NoticeSource[] = [
      logger,
      { kind: 'check_in', learnerId: null, threadId: null },
      { kind: 'hearth_session', sessionId: 'sess-9', hearthId: null },
      { kind: 'project_stage', projectId: 'proj-1', stageNumber: 2 },
    ];
    for (const source of sources) {
      const p = buildEntrySavePayload({ fields: baseFields, source, now: NOW });
      expect(p).not.toHaveProperty('subjects');
      expect(p).not.toHaveProperty('mode');
      expect(p).not.toHaveProperty('observationDetails');
      expect(p).not.toHaveProperty('projectId');
      expect(p).not.toHaveProperty('stageNumber');
    }
  });

  it('omits optional keys rather than sending undefined', () => {
    const p = buildEntrySavePayload({ fields: baseFields, source: logger, now: NOW });
    for (const value of Object.values(p)) expect(value).not.toBeUndefined();
  });
});

describe('buildLoggerContext', () => {
  it('is undefined when the parent set no structured context', () => {
    expect(buildLoggerContext({ activityType: null })).toBeUndefined();
    expect(buildLoggerContext({ activityType: null, observations: [], duration: null, location: null })).toBeUndefined();
  });

  it('carries chips, activity type, where and duration — and nothing blank', () => {
    expect(
      buildLoggerContext({
        activityType: 'nature',
        observations: ['Deeply focused', '  ', 'Taught someone'],
        duration: '~30 min',
        location: 'outdoors',
      }),
    ).toEqual({
      activityType: 'nature',
      observations: ['Deeply focused', 'Taught someone'],
      location: 'outdoors',
      duration: '~30 min',
    });
  });

  it('is omitted from the Notice save payload — the form captures none of its chips (D-LPS-14)', () => {
    const p = buildEntrySavePayload({
      fields: {
        learnerIds: ['L1'],
        text: 'Built a marble run',
        dateOccurred: null,
        felt: { L1: 4 },
        noticed: { L1: 'gravity' },
        evidence: [],
      },
      source: { kind: 'logger' },
      now: new Date(2026, 9, 6, 10, 30),
    });
    expect(p).not.toHaveProperty('loggerContext');
  });
});
