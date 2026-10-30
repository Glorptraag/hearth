import { describe, expect, it } from 'vitest';
import { composeSiblingLines, type DloWatchNote, type FrameworkWatchHow } from './compose';
import { buildEverydayWatchFors, checkInHref, type EverydayLearner } from './everyday';

const CONFIRMED = '2026-10-23T10:00:00Z';
const NOW = new Date('2026-10-26T09:00:00Z');

const note = (dloId: string, over: Partial<DloWatchNote> = {}): DloWatchNote => ({
  dloId,
  watchForNext: { neutral: `Look-for for ${dloId}.` },
  evidenceKind: 'does',
  watchForConfirmedAt: CONFIRMED,
  ...over,
});

const CM: FrameworkWatchHow = {
  slug: 'charlotte_mason',
  watchHow: { does: 'Watch quietly, then ask {child} to tell you how they did it.' },
  watchHowConfirmedAt: CONFIRMED,
};

const ECLECTIC: FrameworkWatchHow = {
  slug: 'eclectic',
  watchHow: { does: 'A tradition line that must not be used.' },
  watchHowFallback: { does: 'Watch what {child} does, then ask about it.' },
  watchHowConfirmedAt: CONFIRMED,
};

const sam: EverydayLearner = { id: 'sam', name: 'Sam', colourToken: 'sage', dateOfBirth: '2021-03-01' };
const ivy: EverydayLearner = { id: 'ivy', name: 'Ivy Rose', colourToken: 'rose', dateOfBirth: '2019-03-01' };

describe('composeSiblingLines', () => {
  it('says only what the record holds', () => {
    expect(
      composeSiblingLines('developing', [
        { name: 'Ivy Rose', status: 'developing' },
        { name: 'Noah', status: 'not-started' },
        { name: 'Pip', status: null },
      ]),
    ).toEqual(['Ivy already shows this.', 'Noah: seen once so far.']);
  });
});

describe('buildEverydayWatchFors', () => {
  it('composes one card per child with a confirmed frontier DLO, plus a check-in link', () => {
    const cards = buildEverydayWatchFors({
      learners: [sam, ivy],
      statusRowsByLearner: {
        sam: [{ dloId: 'dlo.M1.emerging', status: 'emerging' }],
        ivy: [{ dloId: 'dlo.M1.developing', status: 'developing' }],
      },
      notes: [note('dlo.M1.developing')],
      framework: CM,
      now: NOW,
    });
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      learnerId: 'sam',
      dloId: 'dlo.M1.developing',
      threadId: 'M1',
      lookFor: 'Look-for for dlo.M1.developing.',
      how: 'Watch quietly, then ask Sam to tell you how they did it.',
      siblingLines: ['Ivy already shows this.'],
      logHref: '/log?source=check-in&learner=sam&thread=M1',
    });
  });

  it('omits an unconfirmed note — renders nothing rather than inventing a line', () => {
    const cards = buildEverydayWatchFors({
      learners: [sam],
      statusRowsByLearner: { sam: [] },
      notes: [note('dlo.L2.emerging', { watchForConfirmedAt: null }), note('dlo.L4.emerging', { watchForNext: { neutral: '  ' } })],
      framework: CM,
      now: NOW,
    });
    expect(cards).toEqual([]);
  });

  it('drops the how line when the tradition lines are not confirmed', () => {
    const [card] = buildEverydayWatchFors({
      learners: [sam],
      statusRowsByLearner: {},
      notes: [note('dlo.L2.emerging')],
      framework: { ...CM, watchHowConfirmedAt: null },
      now: NOW,
    });
    expect(card.lookFor).toBe('Look-for for dlo.L2.emerging.');
    expect(card.how).toBeNull();
  });

  it('Eclectic uses its neutral fallback line', () => {
    const [card] = buildEverydayWatchFors({
      learners: [sam],
      statusRowsByLearner: {},
      notes: [note('dlo.L2.emerging')],
      framework: ECLECTIC,
      now: NOW,
    });
    expect(card.how).toBe('Watch what Sam does, then ask about it.');
  });

  it('never surfaces H6', () => {
    expect(
      buildEverydayWatchFors({
        learners: [sam],
        statusRowsByLearner: { sam: [{ dloId: 'dlo.H6.emerging', status: 'not-started' }] },
        notes: [note('dlo.H6.emerging')],
        framework: CM,
        now: NOW,
      }),
    ).toEqual([]);
  });

  it('breaks ties with the family 14-day log counts', () => {
    const [card] = buildEverydayWatchFors({
      learners: [sam],
      statusRowsByLearner: {},
      notes: [note('dlo.L2.emerging'), note('dlo.M1.emerging')],
      framework: CM,
      threadLogCounts14d: { L2: 4, M1: 1 },
      now: NOW,
    });
    expect(card.threadId).toBe('M1');
  });

  it('checkInHref encodes the ids and honours a base path', () => {
    expect(checkInHref('a b', 'L1', '/demo')).toBe('/demo/log?source=check-in&learner=a+b&thread=L1');
  });
});
