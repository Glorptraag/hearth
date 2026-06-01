import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLearnersFetch } from './use-learners-fetch';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

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
    expect(result.current).toEqual({ learners: [], isLoading: true });
  });

  it('populates learners from a successful response', async () => {
    const payload = [
      {
        id: 'l1',
        name: 'Mira',
        dateOfBirth: '2018-04-01',
        shapeIcon: '★',
        colourToken: 'rose',
      },
    ];
    fetchMock.mockResolvedValueOnce(okJson(payload));

    const { result } = renderHook(() => useLearnersFetch());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.learners).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith('/api/learners');
  });

  it('degrades to an empty list on a 5xx', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const { result } = renderHook(() => useLearnersFetch());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.learners).toEqual([]);
  });

  it('degrades to an empty list when fetch itself rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useLearnersFetch());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.learners).toEqual([]);
  });

  it('ignores a non-array body without throwing', async () => {
    fetchMock.mockResolvedValueOnce(okJson({ unexpected: 'shape' }));
    const { result } = renderHook(() => useLearnersFetch());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.learners).toEqual([]);
  });
});
