/**
 * Watch-for composition (W4.4, D-HC-5, D-LP-8). Composed from confirmed,
 * authored text only. The key pin: an unconfirmed note is OMITTED — never
 * generated, never guessed.
 */
import { describe, expect, it } from 'vitest';
import {
  composeHow,
  composeWatchFor,
  evidenceKindOf,
  traditionStageFor,
  type DloWatchNote,
  type FrameworkWatchHow,
} from './compose';

const CONFIRMED = '2026-10-23T10:00:00Z';

const note = (over: Partial<DloWatchNote> = {}): DloWatchNote => ({
  dloId: 'dlo.M1.developing',
  watchForNext: { neutral: 'Counting may start to land on the right number without starting over.' },
  evidenceKind: 'says',
  watchForConfirmedAt: CONFIRMED,
  ...over,
});

const CM: FrameworkWatchHow = {
  slug: 'charlotte_mason',
  watchHow: {
    does: 'Watch quietly, then ask {child} to tell you how they did it.',
    says: 'Afterwards, ask {child} to tell it back in their own words.',
    makes: 'Let them finish, then ask them to tell you about it.',
    chooses: 'Notice what they go back to on their own.',
  },
  watchHowConfirmedAt: CONFIRMED,
};

const WALDORF: FrameworkWatchHow = {
  slug: 'waldorf_steiner',
  watchHow: {
    does: 'Do it alongside {child} in a rhythm — clap, step or sing each one.',
    says: 'Tell it as a story first; listen for what they say back later.',
  },
  watchHowStageOverrides: [{ stage: 'first', kind: 'says', text: "Don't ask for explanation. Notice if it turns up in their play." }],
  watchHowConfirmedAt: CONFIRMED,
};

const ECLECTIC: FrameworkWatchHow = {
  slug: 'eclectic',
  watchHow: null,
  watchHowFallback: {
    does: 'Watch what {child} does before you say anything, then ask how they did it.',
    says: 'Afterwards, ask {child} to tell you about it in their own words.',
  },
  watchHowConfirmedAt: CONFIRMED,
};

const SAM = { name: 'Sam', age: 5 };

describe('composeWatchFor', () => {
  it('composes the confirmed look-for plus the tradition how line, with {child} filled', () => {
    expect(composeWatchFor({ dlo: note(), framework: CM, child: SAM })).toEqual({
      dloId: 'dlo.M1.developing',
      kind: 'says',
      lookFor: 'Counting may start to land on the right number without starting over.',
      how: 'Afterwards, ask Sam to tell it back in their own words.',
    });
  });

  it('OMITS an unconfirmed note — never generated, never guessed', () => {
    expect(composeWatchFor({ dlo: note({ watchForConfirmedAt: null }), framework: CM, child: SAM })).toBeNull();
    expect(composeWatchFor({ dlo: note({ watchForConfirmedAt: undefined }), framework: CM, child: SAM })).toBeNull();
    expect(composeWatchFor({ dlo: note({ watchForConfirmedAt: '  ' }), framework: CM, child: SAM })).toBeNull();
  });

  it('omits a confirmed DLO with no note text, or no DLO at all', () => {
    expect(composeWatchFor({ dlo: note({ watchForNext: null }), framework: CM, child: SAM })).toBeNull();
    expect(composeWatchFor({ dlo: note({ watchForNext: { neutral: ' ' } }), framework: CM, child: SAM })).toBeNull();
    expect(composeWatchFor({ dlo: null, framework: CM, child: SAM })).toBeNull();
  });

  it('shows the look-for alone when the tradition lines are not confirmed', () => {
    const line = composeWatchFor({ dlo: note(), framework: { ...CM, watchHowConfirmedAt: null }, child: SAM });
    expect(line?.lookFor).toBeTruthy();
    expect(line?.how).toBeNull();
    expect(composeWatchFor({ dlo: note(), framework: null, child: SAM })?.how).toBeNull();
  });

  it('falls back to "does" when the DLO has no evidence kind', () => {
    const line = composeWatchFor({ dlo: note({ evidenceKind: null }), framework: CM, child: SAM });
    expect(line?.kind).toBe('does');
    expect(line?.how).toBe('Watch quietly, then ask Sam to tell you how they did it.');
    expect(evidenceKindOf('dances')).toBe('does');
  });

  it('uses the neutral fallback for Eclectic, with no tradition label', () => {
    expect(composeWatchFor({ dlo: note(), framework: ECLECTIC, child: SAM })?.how).toBe(
      'Afterwards, ask Sam to tell you about it in their own words.',
    );
  });

  it('returns no how line when the tradition has none for that kind', () => {
    expect(composeWatchFor({ dlo: note({ evidenceKind: 'chooses' }), framework: ECLECTIC, child: SAM })?.how).toBeNull();
  });
});

describe('stage overrides', () => {
  it('applies Waldorf "first" (under 7) to says', () => {
    expect(composeHow(WALDORF, 'says', { name: 'Ivy', age: 5 })).toBe(
      "Don't ask for explanation. Notice if it turns up in their play.",
    );
  });

  it('uses the base line at 7+, for other kinds, or when the age is unknown', () => {
    expect(composeHow(WALDORF, 'says', { name: 'Ivy', age: 8 })).toBe(
      'Tell it as a story first; listen for what they say back later.',
    );
    expect(composeHow(WALDORF, 'does', { name: 'Ivy', age: 5 })).toBe(
      'Do it alongside Ivy in a rhythm — clap, step or sing each one.',
    );
    expect(composeHow(WALDORF, 'says', { name: 'Ivy', age: null })).toBe(
      'Tell it as a story first; listen for what they say back later.',
    );
  });

  it('knows only the stage keys the spec defines', () => {
    expect(traditionStageFor('waldorf_steiner', 6)).toBe('first');
    expect(traditionStageFor('waldorf_steiner', 7)).toBe('second');
    expect(traditionStageFor('waldorf_steiner', 14)).toBe('third');
    expect(traditionStageFor('charlotte_mason', 5)).toBeNull();
  });
});
