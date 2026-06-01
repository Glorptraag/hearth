import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCoachHints } from './use-coach-hints';

const sampleHints = [
  { id: 'h1', kind: 'pattern', title: 'Curiosity', body: 'Ask why' },
] as const;

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const longDescription = 'A description that is well over twenty characters long';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('useCoachHints', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns empty when the description is too short', async () => {
    const learners: string[] = ['l1'];
    const observations: string[] = [];
    const { result } = renderHook(() =>
      useCoachHints({
        description: 'short',
        selectedLearners: learners,
        activityType: 'nature',
        observations,
      }),
    );
    await sleep(1_400);
    expect(result.current).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns empty when no learner is selected', async () => {
    const learners: string[] = [];
    const observations: string[] = [];
    const { result } = renderHook(() =>
      useCoachHints({
        description: longDescription,
        selectedLearners: learners,
        activityType: 'nature',
        observations,
      }),
    );
    await sleep(1_400);
    expect(result.current).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('debounces then posts the payload and stores the result', async () => {
    fetchMock.mockResolvedValueOnce(okJson(sampleHints));
    const learners: string[] = ['l1'];
    const observations: string[] = ['Curious'];

    const { result } = renderHook(() =>
      useCoachHints({
        description: longDescription,
        selectedLearners: learners,
        activityType: 'nature',
        observations,
      }),
    );

    await waitFor(() => expect(result.current).toEqual(sampleHints), {
      timeout: 3_000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/logger/coach-hints');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      learnerIds: ['l1'],
      activityType: 'nature',
      description: longDescription,
      observations: ['Curious'],
    });
  });

  it('only fires the latest debounce after rapid input changes', async () => {
    fetchMock.mockResolvedValue(okJson(sampleHints));
    const learners: string[] = ['l1'];
    const observations: string[] = ['Curious'];

    const { rerender } = renderHook(
      (args: Parameters<typeof useCoachHints>[0]) => useCoachHints(args),
      {
        initialProps: {
          description: longDescription,
          selectedLearners: learners,
          activityType: 'nature' as string | null,
          observations,
        },
      },
    );

    // Halfway through the debounce — change inputs to reset the timer.
    await sleep(500);
    expect(fetchMock).not.toHaveBeenCalled();

    rerender({
      description: longDescription + ' more',
      selectedLearners: learners,
      activityType: 'nature',
      observations,
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1), {
      timeout: 3_000,
    });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body).description).toBe(longDescription + ' more');
  });

  it('swallows a non-OK response and leaves hints empty', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const learners: string[] = ['l1'];
    const observations: string[] = [];

    const { result } = renderHook(() =>
      useCoachHints({
        description: longDescription,
        selectedLearners: learners,
        activityType: 'nature',
        observations,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled(), { timeout: 3_000 });
    await sleep(50);
    expect(result.current).toEqual([]);
  });
});
