import { describe, it, expect } from 'vitest';
import {
  assembleAnnotatedSamples,
  countAnnotatedSamples,
  BAND_SENTENCE,
  OTHER_AREA,
  type AnnotatedSampleEntryInput,
  type AnnotatedSampleLinkInput,
} from './annotated-samples';

const LEARNER = 'learner-1';
const NAME = 'Sam';

function entry(overrides: Partial<AnnotatedSampleEntryInput> & { id: string }): AnnotatedSampleEntryInput {
  return {
    title: 'We made a nature journal',
    description: 'Sam drew the leaves and wrote three words under each one.',
    dateOccurred: '2026-03-10',
    status: 'complete',
    learnerIds: [LEARNER],
    subjects: ['science'],
    subjectsDetected: [],
    discoveriesPerLearner: {},
    photos: [{ ref: 'evidence/fam/one.jpg', caption: null }],
    ...overrides,
  };
}

/** The entry's observed tie + the parent's assertion (no entry) — a confirmed DLO. */
function confirmedOn(entryId: string, dloId: string): AnnotatedSampleLinkInput[] {
  return [
    { observationId: entryId, dloId, provenance: 'inferred', evidenceState: 'observed' },
    { observationId: null, dloId, provenance: 'asserted', evidenceState: 'observed' },
  ];
}

const DESCRIPTORS = new Map([
  ['dlo.S5.developing', 'Records what they notice, in words or pictures'],
  ['dlo.L5.emerging', 'Writes a few words to say something'],
  ['dlo.M2.demonstrating', 'Chooses a quick way to add or take away'],
  ['dlo.H6.developing', 'Compares cultures respectfully'],
]);

function assemble(
  entries: AnnotatedSampleEntryInput[],
  links: AnnotatedSampleLinkInput[],
  extra: Partial<Parameters<typeof assembleAnnotatedSamples>[0]> = {},
) {
  return assembleAnnotatedSamples({
    learnerId: LEARNER,
    learnerName: NAME,
    entries,
    links,
    descriptors: DESCRIPTORS,
    ...extra,
  });
}

describe('assembleAnnotatedSamples — assembly', () => {
  it('renders the parent words, the DLO plain-language line and the band sentence', () => {
    const groups = assemble(
      [entry({ id: 'e1', discoveriesPerLearner: { [LEARNER]: '  He counted the veins.  ' } })],
      confirmedOn('e1', 'dlo.S5.developing'),
    );
    expect(groups).toHaveLength(1);
    const [sample] = groups[0].samples;
    expect(sample.entryId).toBe('e1');
    expect(sample.parentWords).toBe('Sam drew the leaves and wrote three words under each one.');
    expect(sample.noticed).toBe('He counted the veins.');
    expect(sample.photos).toEqual([{ ref: 'evidence/fam/one.jpg', caption: null }]);
    expect(sample.dlos).toEqual([
      {
        dloId: 'dlo.S5.developing',
        threadId: 'S5',
        threadName: 'Scientific Observation',
        tier: 'developing',
        line: 'Records what they notice, in words or pictures',
        bandSentence: BAND_SENTENCE.developing(NAME),
      },
    ]);
  });

  it('band sentences are authored, name the child and differ per band', () => {
    const sentences = (['emerging', 'developing', 'demonstrating'] as const).map((t) => BAND_SENTENCE[t]('Ava'));
    expect(new Set(sentences).size).toBe(3);
    for (const s of sentences) {
      expect(s.startsWith('Ava ')).toBe(true);
      expect(s).not.toMatch(/missing|behind|gap/i);
    }
  });

  it('falls back to the authored thread name when the catalog has no descriptor', () => {
    const groups = assemble([entry({ id: 'e1' })], confirmedOn('e1', 'dlo.S1.emerging'));
    expect(groups[0].samples[0].dlos[0].line).toBe('Scientific Inquiry');
  });

  it('accepts a plain record of descriptors', () => {
    const groups = assemble([entry({ id: 'e1' })], confirmedOn('e1', 'dlo.S5.developing'), {
      descriptors: { 'dlo.S5.developing': 'Authored line' },
    });
    expect(groups[0].samples[0].dlos[0].line).toBe('Authored line');
  });

  it('keeps a photo-only entry with null parent words (never invents any)', () => {
    const groups = assemble(
      [entry({ id: 'e1', description: '   ', title: 'Photo on 10 Mar' })],
      confirmedOn('e1', 'dlo.S5.developing'),
    );
    expect(groups[0].samples[0].parentWords).toBeNull();
    expect(groups[0].samples[0].title).toBe('Photo on 10 Mar');
  });

  it('never reads model rationale', () => {
    const links: AnnotatedSampleLinkInput[] = confirmedOn('e1', 'dlo.S5.developing');
    const groups = assemble([entry({ id: 'e1' })], links);
    expect(JSON.stringify(groups)).not.toContain('rationale');
  });

  it('tags a sample the parent also chose for a required slot, without touching slots', () => {
    const slots = [
      { slot: 'early_choice', entryId: 'e1' },
      { slot: 'later_choice', entryId: null },
    ];
    const groups = assemble([entry({ id: 'e1' })], confirmedOn('e1', 'dlo.S5.developing'), { slots });
    expect(groups[0].samples[0].requiredSlot).toBe('early_choice');
    expect(slots).toEqual([
      { slot: 'early_choice', entryId: 'e1' },
      { slot: 'later_choice', entryId: null },
    ]);
  });
});

describe('assembleAnnotatedSamples — grouping and ordering', () => {
  it('groups per learning area in canonical subject order, unassigned last', () => {
    const groups = assemble(
      [
        entry({ id: 'sci', subjects: ['science'] }),
        entry({ id: 'none', subjects: [], subjectsDetected: [] }),
        entry({ id: 'eng', subjects: ['English'] }),
        entry({ id: 'maths', subjects: null, subjectsDetected: ['Mathematics'] }),
      ],
      [
        ...confirmedOn('sci', 'dlo.S5.developing'),
        { observationId: 'none', dloId: 'dlo.S5.developing', provenance: 'inferred', evidenceState: 'observed' },
        { observationId: 'eng', dloId: 'dlo.S5.developing', provenance: 'inferred', evidenceState: 'observed' },
        { observationId: 'maths', dloId: 'dlo.S5.developing', provenance: 'inferred', evidenceState: 'observed' },
      ],
    );
    expect(groups.map((g) => g.area)).toEqual(['english', 'mathematics', 'science', OTHER_AREA]);
    expect(groups.map((g) => g.label)).toEqual(['English', 'Mathematics', 'Science', 'Across learning areas']);
  });

  it('prefers the parent-chosen subject over a detected one, and skips unknown subjects', () => {
    const groups = assemble(
      [entry({ id: 'e1', subjects: ['cooking', 'hass'], subjectsDetected: ['science'] })],
      confirmedOn('e1', 'dlo.S5.developing'),
    );
    expect(groups[0].area).toBe('hass');
  });

  it('orders samples oldest first within an area, ties by entry id', () => {
    const groups = assemble(
      [
        entry({ id: 'b', dateOccurred: '2026-05-01' }),
        entry({ id: 'c', dateOccurred: '2026-02-01' }),
        entry({ id: 'a', dateOccurred: '2026-05-01' }),
      ],
      ['a', 'b', 'c'].flatMap((id) => confirmedOn(id, 'dlo.S5.developing')),
    );
    expect(groups[0].samples.map((s) => s.entryId)).toEqual(['c', 'a', 'b']);
  });

  it('orders DLO lines by thread then band, and lists every confirmed DLO on the entry', () => {
    const groups = assemble(
      [entry({ id: 'e1' })],
      [
        ...confirmedOn('e1', 'dlo.S5.developing'),
        ...confirmedOn('e1', 'dlo.L5.emerging'),
        ...confirmedOn('e1', 'dlo.M2.demonstrating'),
      ],
    );
    expect(groups[0].samples[0].dlos.map((d) => d.dloId)).toEqual([
      'dlo.L5.emerging',
      'dlo.M2.demonstrating',
      'dlo.S5.developing',
    ]);
  });

  it('is deterministic for the same input', () => {
    const entries = [entry({ id: 'e1' }), entry({ id: 'e2', subjects: ['english'] })];
    const links = [...confirmedOn('e1', 'dlo.S5.developing'), ...confirmedOn('e2', 'dlo.L5.emerging')];
    expect(assemble(entries, links)).toEqual(assemble([...entries].reverse(), [...links].reverse()));
  });

  it('counts samples across groups', () => {
    const groups = assemble(
      [entry({ id: 'e1' }), entry({ id: 'e2', subjects: ['english'] })],
      [...confirmedOn('e1', 'dlo.S5.developing'), ...confirmedOn('e2', 'dlo.L5.emerging')],
    );
    expect(countAnnotatedSamples(groups)).toBe(2);
    expect(countAnnotatedSamples([])).toBe(0);
  });
});

describe('assembleAnnotatedSamples — exclusions', () => {
  it('excludes an entry with no photo', () => {
    const groups = assemble([entry({ id: 'e1', photos: [] })], confirmedOn('e1', 'dlo.S5.developing'));
    expect(groups).toEqual([]);
  });

  it('excludes an entry whose only photo ref is blank', () => {
    const groups = assemble(
      [entry({ id: 'e1', photos: [{ ref: '  ', caption: null }] })],
      confirmedOn('e1', 'dlo.S5.developing'),
    );
    expect(groups).toEqual([]);
  });

  it('excludes an unconfirmed DLO (an inferred link alone is not confirmed)', () => {
    const groups = assemble(
      [entry({ id: 'e1' })],
      [{ observationId: 'e1', dloId: 'dlo.S5.developing', provenance: 'inferred', evidenceState: 'observed' }],
    );
    expect(groups).toEqual([]);
  });

  it('keeps only the confirmed DLOs on an entry with several proposals', () => {
    const groups = assemble(
      [entry({ id: 'e1' })],
      [
        ...confirmedOn('e1', 'dlo.S5.developing'),
        { observationId: 'e1', dloId: 'dlo.L5.emerging', provenance: 'inferred', evidenceState: 'observed' },
      ],
    );
    expect(groups[0].samples[0].dlos.map((d) => d.dloId)).toEqual(['dlo.S5.developing']);
  });

  it('excludes a confirmed DLO the entry does not carry', () => {
    const groups = assemble(
      [entry({ id: 'e1' })],
      [
        { observationId: 'e1', dloId: 'dlo.L5.emerging', provenance: 'inferred', evidenceState: 'observed' },
        { observationId: null, dloId: 'dlo.S5.developing', provenance: 'asserted', evidenceState: 'observed' },
      ],
    );
    expect(groups).toEqual([]);
  });

  it('excludes an opportunity tie that was never corroborated', () => {
    const groups = assemble(
      [entry({ id: 'e1' })],
      [
        { observationId: 'e1', dloId: 'dlo.S5.developing', provenance: 'declared', evidenceState: 'opportunity' },
        { observationId: null, dloId: 'dlo.S5.developing', provenance: 'asserted', evidenceState: 'observed' },
      ],
    );
    expect(groups).toEqual([]);
  });

  it('excludes an H6-suppressed thread even when confirmed', () => {
    const groups = assemble(
      [entry({ id: 'e1', subjects: ['hass'] })],
      confirmedOn('e1', 'dlo.H6.developing'),
    );
    expect(groups).toEqual([]);
  });

  it('keeps the unsuppressed DLO when a suppressed one sits beside it', () => {
    const groups = assemble(
      [entry({ id: 'e1' })],
      [...confirmedOn('e1', 'dlo.H6.developing'), ...confirmedOn('e1', 'dlo.S5.developing')],
    );
    expect(groups[0].samples[0].dlos.map((d) => d.threadId)).toEqual(['S5']);
  });

  it('excludes a malformed DLO id', () => {
    const groups = assemble([entry({ id: 'e1' })], confirmedOn('e1', 'not-a-dlo'));
    expect(groups).toEqual([]);
  });

  it("excludes another learner's entry and an incomplete entry", () => {
    const groups = assemble(
      [
        entry({ id: 'other', learnerIds: ['learner-2'] }),
        entry({ id: 'draft', status: 'draft' }),
      ],
      [...confirmedOn('other', 'dlo.S5.developing'), ...confirmedOn('draft', 'dlo.S5.developing')],
    );
    expect(groups).toEqual([]);
  });

  it('counts an asserted link that carries the entry as both tie and confirmation', () => {
    const groups = assemble(
      [entry({ id: 'e1' })],
      [{ observationId: 'e1', dloId: 'dlo.S5.developing', provenance: 'asserted', evidenceState: 'observed' }],
    );
    expect(groups[0].samples[0].dlos).toHaveLength(1);
  });
});
