import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useScaffoldFetch, type ScaffoldData } from './use-scaffold-fetch';

const sampleScaffold = (): ScaffoldData => ({
  session: {
    id: 'sess_1',
    title: 'Nature walk',
    description: 'Walk along the creek',
    date: '2026-05-30',
    location: 'outdoors',
    sharedRecord: null,
    hearthId: 'hearth_1',
    hearthName: 'Wonder Hearth',
  },
  evidence: [],
  observations: [],
  attendingLearnerIds: ['l1', 'l2'],
});

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

describe('useScaffoldFetch', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not fetch when scaffoldSessionId is null', () => {
    const onLoad = vi.fn();
    const { result } = renderHook(() =>
      useScaffoldFetch({ scaffoldSessionId: null, onLoad }),
    );
    expect(result.current).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onLoad).not.toHaveBeenCalled();
  });

  it('loads scaffold data and fires onLoad once', async () => {
    const data = sampleScaffold();
    fetchMock.mockResolvedValueOnce(okJson(data));
    const onLoad = vi.fn();

    const { result } = renderHook(() =>
      useScaffoldFetch({ scaffoldSessionId: 'sess_1', onLoad }),
    );

    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current).toEqual(data);
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoad).toHaveBeenCalledWith(data);
    expect(fetchMock).toHaveBeenCalledWith('/api/scaffolds/sess_1');
  });

  it('swallows a non-OK response without firing onLoad', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));
    const onLoad = vi.fn();

    const { result } = renderHook(() =>
      useScaffoldFetch({ scaffoldSessionId: 'sess_missing', onLoad }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    // Give the promise chain a tick to settle.
    await new Promise((r) => setTimeout(r, 0));

    expect(result.current).toBeNull();
    expect(onLoad).not.toHaveBeenCalled();
  });

  it('swallows fetch rejection without throwing', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const onLoad = vi.fn();

    const { result } = renderHook(() =>
      useScaffoldFetch({ scaffoldSessionId: 'sess_1', onLoad }),
    );

    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBeNull();
    expect(onLoad).not.toHaveBeenCalled();
  });

  it('re-fetches when the session id changes', async () => {
    const dataA = sampleScaffold();
    const dataB = { ...sampleScaffold(), session: { ...sampleScaffold().session, id: 'sess_2' } };
    fetchMock.mockResolvedValueOnce(okJson(dataA)).mockResolvedValueOnce(okJson(dataB));

    const { rerender, result } = renderHook(
      ({ id }: { id: string }) => useScaffoldFetch({ scaffoldSessionId: id, onLoad: vi.fn() }),
      { initialProps: { id: 'sess_1' } },
    );

    await waitFor(() => expect(result.current?.session.id).toBe('sess_1'));

    rerender({ id: 'sess_2' });

    await waitFor(() => expect(result.current?.session.id).toBe('sess_2'));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
