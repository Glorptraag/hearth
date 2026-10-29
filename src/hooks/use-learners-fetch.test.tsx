import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useLearnersFetch } from './use-learners-fetch';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const payload = [
  {
    id: 'l1',
    name: 'Mira',
    dateOfBirth: '2018-04-01',
    shapeIcon: '★',
    colourToken: 'rose',
  },
];

describe('useLearnersFetch', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts in a loading state with an empty list', () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useLearnersFetch());
    expect(result.current.learners).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.failed).toBe(false);
    expect(typeof result.current.reload).toBe('function');
  });

  it('populates learners from a successful response', async () => {
    fetchMock.mockResolvedValueOnce(okJson(payload));

    const { result } = renderHook(() => useLearnersFetch());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.learners).toEqual(payload);
    expect(result.current.failed).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith('/api/learners');
  });

  it('degrades to an empty list and flags failed on a 5xx', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const { result } = renderHook(() => useLearnersFetch());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.learners).toEqual([]);
    expect(result.current.failed).toBe(true);
  });

  it('degrades to an empty list and flags failed when fetch itself rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useLearnersFetch());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.learners).toEqual([]);
    expect(result.current.failed).toBe(true);
  });

  it('flags failed on a non-array body without throwing', async () => {
    fetchMock.mockResolvedValueOnce(okJson({ unexpected: 'shape' }));
    const { result } = renderHook(() => useLearnersFetch());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.learners).toEqual([]);
    expect(result.current.failed).toBe(true);
  });

  it('reload re-fetches: loading again, failed reset, then populated', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useLearnersFetch());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.failed).toBe(true);

    let resolveSecond: (r: Response) => void = () => {};
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveSecond = resolve;
      }),
    );

    act(() => result.current.reload());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.failed).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveSecond(okJson(payload));
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.learners).toEqual(payload);
    expect(result.current.failed).toBe(false);
  });
});
