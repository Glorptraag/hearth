import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { noticeReducer, useNoticeForm, type NoticeAction } from './use-notice-form';
import { EMPTY_NOTICE, type NoticeFields } from '@/lib/logger/notice';
import type { DraftEvidenceItem } from '@/lib/logger/draft';

const photo: DraftEvidenceItem = { type: 'photo', content: 'blob/a.jpg' };
const quote: DraftEvidenceItem = { type: 'quote', content: 'Look, a spiral!' };

const fields = (overrides: Partial<NoticeFields> = {}): NoticeFields => ({
  ...EMPTY_NOTICE,
  ...overrides,
});

const reduce = (state: NoticeFields, ...actions: NoticeAction[]) =>
  actions.reduce(noticeReducer, state);

describe('noticeReducer', () => {
  it('set-text replaces the text', () => {
    expect(reduce(EMPTY_NOTICE, { type: 'set-text', text: 'We baked bread' }).text).toBe('We baked bread');
  });

  it('append-text appends with a single space when non-empty, none when empty', () => {
    expect(reduce(EMPTY_NOTICE, { type: 'append-text', text: 'first' }).text).toBe('first');
    expect(
      reduce(fields({ text: 'first' }), { type: 'append-text', text: 'second' }).text,
    ).toBe('first second');
    expect(
      reduce(fields({ text: 'first ' }), { type: 'append-text', text: 'second' }).text,
    ).toBe('first second');
    const unchanged = fields({ text: 'first' });
    expect(reduce(unchanged, { type: 'append-text', text: '' })).toBe(unchanged);
  });

  it('toggle-learner selects, then deselects and purges that child’s felt + noticed', () => {
    const selected = reduce(
      EMPTY_NOTICE,
      { type: 'toggle-learner', id: 'a' },
      { type: 'toggle-learner', id: 'b' },
      { type: 'set-felt', id: 'a', level: 4 },
      { type: 'set-noticed', id: 'a', text: 'asked why' },
      { type: 'set-felt', id: 'b', level: 2 },
    );
    expect(selected.learnerIds).toEqual(['a', 'b']);
    expect(selected.felt).toEqual({ a: 4, b: 2 });

    const deselected = reduce(selected, { type: 'toggle-learner', id: 'a' });
    expect(deselected.learnerIds).toEqual(['b']);
    expect(deselected.felt).toEqual({ b: 2 });
    expect(deselected.noticed).toEqual({});
  });

  it('set-felt sets a level and tapping the same level again clears it', () => {
    const base = fields({ learnerIds: ['a'] });
    const set = reduce(base, { type: 'set-felt', id: 'a', level: 3 });
    expect(set.felt).toEqual({ a: 3 });
    const changed = reduce(set, { type: 'set-felt', id: 'a', level: 1 });
    expect(changed.felt).toEqual({ a: 1 });
    const cleared = reduce(changed, { type: 'set-felt', id: 'a', level: 1 });
    expect(cleared.felt).toEqual({});
  });

  it('set-felt / set-noticed ignore a child who is not selected', () => {
    const base = fields({ learnerIds: ['a'] });
    expect(reduce(base, { type: 'set-felt', id: 'zz', level: 4 })).toBe(base);
    expect(reduce(base, { type: 'set-noticed', id: 'zz', text: 'x' })).toBe(base);
  });

  it('set-noticed stores per-child text', () => {
    const out = reduce(fields({ learnerIds: ['a'] }), { type: 'set-noticed', id: 'a', text: 'why is it blue?' });
    expect(out.noticed).toEqual({ a: 'why is it blue?' });
  });

  it('set-date stores a day or null (today)', () => {
    const dated = reduce(EMPTY_NOTICE, { type: 'set-date', dateOccurred: '2026-10-01' });
    expect(dated.dateOccurred).toBe('2026-10-01');
    expect(reduce(dated, { type: 'set-date', dateOccurred: null }).dateOccurred).toBeNull();
  });

  it('add-evidence appends and remove-evidence drops by index', () => {
    const added = reduce(
      EMPTY_NOTICE,
      { type: 'add-evidence', item: photo },
      { type: 'add-evidence', item: quote },
    );
    expect(added.evidence).toEqual([photo, quote]);
    expect(reduce(added, { type: 'remove-evidence', index: 0 }).evidence).toEqual([quote]);
    expect(reduce(added, { type: 'remove-evidence', index: 5 }).evidence).toEqual([photo, quote]);
  });

  it('photo-date fills the date from the photo only while none is chosen (W3.1)', () => {
    const now = new Date('2026-10-26T09:00:00');
    expect(reduce(EMPTY_NOTICE, { type: 'photo-date', takenAt: '2026-10-20T14:05:33', now }).dateOccurred).toBe(
      '2026-10-20',
    );
    const chosen = fields({ dateOccurred: '2026-10-25' });
    expect(reduce(chosen, { type: 'photo-date', takenAt: '2026-10-20T14:05:33', now })).toBe(chosen);
    expect(reduce(EMPTY_NOTICE, { type: 'photo-date', takenAt: null, now })).toBe(EMPTY_NOTICE);
  });

  it('restore replaces the whole form with the given fields', () => {
    const restored = fields({
      learnerIds: ['a'],
      text: 'Nature walk',
      dateOccurred: '2026-10-05',
      felt: { a: 4 },
      noticed: { a: 'found a beetle' },
      evidence: [photo],
    });
    expect(reduce(fields({ text: 'typing' }), { type: 'restore', fields: restored })).toEqual(restored);
  });

  it('init-from-source fills an untouched form', () => {
    const out = reduce(EMPTY_NOTICE, {
      type: 'init-from-source',
      learnerIds: ['a', 'b', 'a'],
      text: 'From the shared record',
    });
    expect(out.learnerIds).toEqual(['a', 'b']);
    expect(out.text).toBe('From the shared record');

    const preselect = reduce(EMPTY_NOTICE, { type: 'init-from-source', learnerIds: ['a'] });
    expect(preselect.learnerIds).toEqual(['a']);
    expect(preselect.text).toBe('');
  });

  it('init-from-source is a no-op once the form holds anything', () => {
    const withLearner = fields({ learnerIds: ['b'] });
    expect(reduce(withLearner, { type: 'init-from-source', learnerIds: ['a'], text: 'x' })).toBe(withLearner);
    const withText = fields({ text: 'hello' });
    expect(reduce(withText, { type: 'init-from-source', learnerIds: ['a'] })).toBe(withText);
    const withEvidence = fields({ evidence: [photo] });
    expect(reduce(withEvidence, { type: 'init-from-source', learnerIds: ['a'] })).toBe(withEvidence);
  });

  it('init-from-source with nothing to apply leaves the form untouched', () => {
    expect(reduce(EMPTY_NOTICE, { type: 'init-from-source', learnerIds: [] })).toBe(EMPTY_NOTICE);
  });

  it('reset returns the empty notice', () => {
    const busy = reduce(EMPTY_NOTICE, { type: 'toggle-learner', id: 'a' }, { type: 'set-text', text: 'x' });
    expect(reduce(busy, { type: 'reset' })).toEqual(EMPTY_NOTICE);
  });
});

describe('useNoticeForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts empty with no compose start', () => {
    const { result } = renderHook(() => useNoticeForm());
    expect(result.current.fields).toEqual(EMPTY_NOTICE);
    expect(result.current.composeStartedAt()).toBeNull();
  });

  it('dispatch drives the reducer', () => {
    const { result } = renderHook(() => useNoticeForm());
    act(() => {
      result.current.dispatch({ type: 'toggle-learner', id: 'a' });
      result.current.dispatch({ type: 'set-felt', id: 'a', level: 4 });
    });
    expect(result.current.fields.learnerIds).toEqual(['a']);
    expect(result.current.fields.felt).toEqual({ a: 4 });
  });

  it('init-from-source applies on an untouched form and is ignored after a restore', () => {
    const { result } = renderHook(() => useNoticeForm());
    act(() => {
      result.current.dispatch({ type: 'init-from-source', learnerIds: ['only'] });
    });
    expect(result.current.fields.learnerIds).toEqual(['only']);

    act(() => {
      result.current.dispatch({ type: 'reset' });
      result.current.dispatch({
        type: 'restore',
        fields: fields({ learnerIds: ['a'], text: 'picked up where I left off' }),
      });
      result.current.dispatch({ type: 'init-from-source', learnerIds: ['check-in-child'], text: 'scaffold' });
    });
    expect(result.current.fields.learnerIds).toEqual(['a']);
    expect(result.current.fields.text).toBe('picked up where I left off');
  });

  it('records the compose start once, when text first becomes non-empty, and clears it on reset', () => {
    vi.setSystemTime(1_700_000_000_000);
    const { result } = renderHook(() => useNoticeForm());

    act(() => {
      result.current.dispatch({ type: 'toggle-learner', id: 'a' });
    });
    expect(result.current.composeStartedAt()).toBeNull();

    act(() => {
      result.current.dispatch({ type: 'set-text', text: 'W' });
    });
    expect(result.current.composeStartedAt()).toBe(1_700_000_000_000);

    vi.setSystemTime(1_700_000_050_000);
    act(() => {
      result.current.dispatch({ type: 'set-text', text: 'We baked' });
    });
    expect(result.current.composeStartedAt()).toBe(1_700_000_000_000);

    // Clearing the words mid-entry does not restart the clock.
    act(() => {
      result.current.dispatch({ type: 'set-text', text: '' });
    });
    expect(result.current.composeStartedAt()).toBe(1_700_000_000_000);

    act(() => {
      result.current.dispatch({ type: 'reset' });
    });
    expect(result.current.composeStartedAt()).toBeNull();

    vi.setSystemTime(1_700_000_099_000);
    act(() => {
      result.current.dispatch({ type: 'append-text', text: 'next moment' });
    });
    expect(result.current.composeStartedAt()).toBe(1_700_000_099_000);
  });
});
