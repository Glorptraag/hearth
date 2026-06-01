import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useKeywordMatch } from './use-keyword-match';

vi.mock('@/lib/ai/keyword-matcher', () => ({
  matchKeywords: vi.fn((description: string, names: string[]) => ({
    description,
    names,
  })),
}));

import { matchKeywords } from '@/lib/ai/keyword-matcher';

describe('useKeywordMatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(matchKeywords).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when the description is shorter than 10 chars', () => {
    const { result } = renderHook(() => useKeywordMatch('short', []));
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(result.current).toBeNull();
    expect(matchKeywords).not.toHaveBeenCalled();
  });

  it('debounces 1.5 s before running matchKeywords', () => {
    const { result } = renderHook(() => useKeywordMatch('a description over 10 chars', ['Mira']));

    // Before the timer fires.
    act(() => {
      vi.advanceTimersByTime(1_400);
    });
    expect(matchKeywords).not.toHaveBeenCalled();
    expect(result.current).toBeNull();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(matchKeywords).toHaveBeenCalledTimes(1);
    expect(matchKeywords).toHaveBeenCalledWith('a description over 10 chars', ['Mira']);
    expect(result.current).toEqual({
      description: 'a description over 10 chars',
      names: ['Mira'],
    });
  });

  it('cancels the pending debounce when the description shrinks below the threshold', () => {
    const { result, rerender } = renderHook(
      ({ d }: { d: string }) => useKeywordMatch(d, []),
      { initialProps: { d: 'long enough to fire' } },
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender({ d: 'short' });
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(matchKeywords).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('resets the debounce on rapid description changes', () => {
    const { rerender } = renderHook(
      ({ d }: { d: string }) => useKeywordMatch(d, []),
      { initialProps: { d: 'first version of input' } },
    );

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    rerender({ d: 'second version of input' });
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(matchKeywords).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(matchKeywords).toHaveBeenCalledTimes(1);
    expect(matchKeywords).toHaveBeenLastCalledWith('second version of input', []);
  });
});
