import { describe, it, expect } from 'vitest';
import {
  EMPTY_NOTICE,
  FELT_LEVELS,
  dateForKind,
  isFeltLevel,
  pruneToLearners,
  resolveDateOccurred,
  saveBlock,
  todayIso,
  toggleLearner,
  whenKindFor,
  whenLabel,
  type NoticeFields,
} from './notice';

// Wed 7 Oct 2026, mid-morning local time.
const NOW = new Date('2026-10-07T10:00:00');

function notice(overrides: Partial<NoticeFields> = {}): NoticeFields {
  return { ...EMPTY_NOTICE, ...overrides };
}

describe('saveBlock', () => {
  it('blocks with no-learner when nobody is selected, even with text', () => {
    expect(saveBlock(notice({ text: 'Built a bridge' }))).toBe('no-learner');
  });

  it('blocks with nothing-noticed when a child is selected but text is blank and there is no evidence', () => {
    expect(saveBlock(notice({ learnerIds: ['L1'], text: '   ' }))).toBe('nothing-noticed');
  });

  it('allows save with a child and a few words', () => {
    expect(saveBlock(notice({ learnerIds: ['L1'], text: 'Counted the chooks' }))).toBeNull();
  });

  it('allows save with a child and evidence but no text', () => {
    expect(
      saveBlock(
        notice({ learnerIds: ['L1'], evidence: [{ type: 'photo', content: 'blob:1' }] }),
      ),
    ).toBeNull();
  });

  it('checks the learner gate before the text gate', () => {
    expect(saveBlock(notice())).toBe('no-learner');
  });
});

describe('toggleLearner', () => {
  it('selects a child not yet selected, preserving order', () => {
    const next = toggleLearner(notice({ learnerIds: ['L1'] }), 'L2');
    expect(next.learnerIds).toEqual(['L1', 'L2']);
  });

  it('deselects a child and prunes that child’s felt and noticed', () => {
    const f = notice({
      learnerIds: ['L1', 'L2'],
      felt: { L1: 4, L2: 2 },
      noticed: { L1: 'asked why', L2: 'counted' },
    });
    const next = toggleLearner(f, 'L2');
    expect(next.learnerIds).toEqual(['L1']);
    expect(next.felt).toEqual({ L1: 4 });
    expect(next.noticed).toEqual({ L1: 'asked why' });
  });

  it('leaves the remaining children’s per-child data untouched', () => {
    const f = notice({ learnerIds: ['L1', 'L2'], felt: { L1: 3 }, noticed: { L1: 'noticed' } });
    const next = toggleLearner(f, 'L2');
    expect(next.felt).toEqual({ L1: 3 });
    expect(next.noticed).toEqual({ L1: 'noticed' });
  });

  it('does not mutate the input', () => {
    const f = notice({ learnerIds: ['L1'], felt: { L1: 1 } });
    toggleLearner(f, 'L1');
    expect(f.learnerIds).toEqual(['L1']);
    expect(f.felt).toEqual({ L1: 1 });
  });
});

describe('pruneToLearners', () => {
  it('drops felt and noticed entries for children no longer selected', () => {
    const f = notice({
      learnerIds: ['L2'],
      felt: { L1: 4, L2: 3, L3: 1 },
      noticed: { L1: 'a', L3: 'c' },
    });
    const next = pruneToLearners(f);
    expect(next.felt).toEqual({ L2: 3 });
    expect(next.noticed).toEqual({});
    expect(next.learnerIds).toEqual(['L2']);
  });

  it('keeps everything when every keyed child is selected', () => {
    const f = notice({ learnerIds: ['L1', 'L2'], felt: { L1: 2, L2: 4 }, noticed: { L2: 'x' } });
    expect(pruneToLearners(f)).toEqual(f);
  });
});

describe('resolveDateOccurred', () => {
  it('resolves null to today', () => {
    expect(resolveDateOccurred(null, NOW)).toBe('2026-10-07');
    expect(todayIso(NOW)).toBe('2026-10-07');
  });

  it('keeps an explicit past date', () => {
    expect(resolveDateOccurred('2026-09-14', NOW)).toBe('2026-09-14');
  });

  it('clamps a future date to today', () => {
    expect(resolveDateOccurred('2026-10-08', NOW)).toBe('2026-10-07');
    expect(resolveDateOccurred('2027-01-01', NOW)).toBe('2026-10-07');
  });

  it('falls back to today for an unparsable value', () => {
    expect(resolveDateOccurred('not-a-date', NOW)).toBe('2026-10-07');
    expect(resolveDateOccurred('2026-13-45', NOW)).toBe('2026-10-07');
    expect(resolveDateOccurred('', NOW)).toBe('2026-10-07');
  });

  it('resolves yesterday across a month boundary via dateForKind', () => {
    const firstOfMonth = new Date('2026-10-01T10:00:00');
    const yesterday = dateForKind('yesterday', firstOfMonth);
    expect(yesterday).toBe('2026-09-30');
    expect(resolveDateOccurred(yesterday, firstOfMonth)).toBe('2026-09-30');
    expect(whenKindFor(yesterday, firstOfMonth)).toBe('yesterday');
  });

  it('dateForKind stores today as null', () => {
    expect(dateForKind('today', NOW)).toBeNull();
  });
});

describe('whenKindFor', () => {
  it('is today for null', () => {
    expect(whenKindFor(null, NOW)).toBe('today');
  });

  it('is today for today’s date and for a clamped future date', () => {
    expect(whenKindFor('2026-10-07', NOW)).toBe('today');
    expect(whenKindFor('2026-12-25', NOW)).toBe('today');
  });

  it('is yesterday for yesterday’s date', () => {
    expect(whenKindFor('2026-10-06', NOW)).toBe('yesterday');
  });

  it('is other for any earlier date', () => {
    expect(whenKindFor('2026-10-05', NOW)).toBe('other');
    expect(whenKindFor('2026-01-02', NOW)).toBe('other');
  });

  it('is today for an invalid value', () => {
    expect(whenKindFor('garbage', NOW)).toBe('today');
  });
});

describe('whenLabel', () => {
  it('labels today and yesterday', () => {
    expect(whenLabel(null, NOW)).toBe('Today');
    expect(whenLabel('2026-10-07', NOW)).toBe('Today');
    expect(whenLabel('2026-10-06', NOW)).toBe('Yesterday');
  });

  it('formats another day as EEE d MMM', () => {
    expect(whenLabel('2026-10-02', NOW)).toBe('Fri 2 Oct');
    expect(whenLabel('2026-09-14', NOW)).toBe('Mon 14 Sep');
  });

  it('falls back to Today for an unparsable value', () => {
    expect(whenLabel('nope', NOW)).toBe('Today');
  });
});

describe('FELT_LEVELS', () => {
  it('runs 4 down to 1 so the ordinal maps onto engagementPerLearner', () => {
    expect(FELT_LEVELS.map((l) => l.value)).toEqual([4, 3, 2, 1]);
  });

  it('has a label for every level', () => {
    for (const level of FELT_LEVELS) expect(level.label.length).toBeGreaterThan(0);
  });
});

describe('isFeltLevel', () => {
  it('accepts 1..4', () => {
    expect([1, 2, 3, 4].every(isFeltLevel)).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isFeltLevel(0)).toBe(false);
    expect(isFeltLevel(5)).toBe(false);
    expect(isFeltLevel('3')).toBe(false);
    expect(isFeltLevel(null)).toBe(false);
    expect(isFeltLevel(undefined)).toBe(false);
    expect(isFeltLevel(2.5)).toBe(false);
  });
});
