import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useLoggerModeAndSnapshot } from './use-logger-mode-and-snapshot';
import type { SnapshotData } from '@/types/snapshot';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const buildSnapshot = (overrides: Partial<SnapshotData> = {}): SnapshotData =>
  ({
    family: { total_entries: 5 } as SnapshotData['family'],
    children: {
      child_1: {
        active_threads: [
          { thread_id: 'thread_a' },
          { thread_id: 'thread_b' },
        ],
        gap_analysis: { suggested_focus_threads: ['thread_c'] },
      },
    } as unknown as SnapshotData['children'],
    ...overrides,
  }) as SnapshotData;

/**
 * Stub `fetch` with per-URL handlers. Returns a Promise that resolves when the
 * given handler runs so tests can deterministically wait for completion.
 */
const stubFetch = (handlers: Record<string, () => Response | Promise<Response>>) => {
  const calls: string[] = [];
  const fetchMock = vi.fn(async (url: string) => {
    calls.push(url);
    const handler = handlers[url];
    if (!handler) throw new Error(`Unhandled fetch: ${url}`);
    return handler();
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, calls };
};

describe('useLoggerModeAndSnapshot', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to quick mode before the fetch resolves', () => {
    stubFetch({
      '/api/family': () => new Promise(() => {}),
      '/api/snapshot': () => new Promise(() => {}),
    });
    const { result } = renderHook(() => useLoggerModeAndSnapshot());
    expect(result.current.loggerMode).toBe('quick');
    expect(result.current.snapshotData).toBeNull();
    expect(result.current.snapshotSignals).toBeNull();
  });

  it('respects loggerDefaultMode when it is "guided" or "quick"', async () => {
    stubFetch({
      '/api/family': () => okJson({ loggerDefaultMode: 'guided', entryCount: 200 }),
      '/api/snapshot': () => okJson({ snapshotData: null }),
    });
    const { result } = renderHook(() => useLoggerModeAndSnapshot());
    await waitFor(() => expect(result.current.loggerMode).toBe('guided'));
  });

  it('falls back to guided when entry count is < 20 and no explicit default', async () => {
    stubFetch({
      '/api/family': () => okJson({ loggerDefaultMode: null, entryCount: 5 }),
      '/api/snapshot': () => okJson({ snapshotData: null }),
    });
    const { result } = renderHook(() => useLoggerModeAndSnapshot());
    await waitFor(() => expect(result.current.loggerMode).toBe('guided'));
  });

  it('falls back to quick when entry count is >= 20 and no explicit default', async () => {
    stubFetch({
      '/api/family': () => okJson({ loggerDefaultMode: null, entryCount: 100 }),
      '/api/snapshot': () => okJson({ snapshotData: null }),
    });
    const { result } = renderHook(() => useLoggerModeAndSnapshot());
    // Mode starts at 'quick' so we await the family fetch by waiting on snapshot null vs set.
    await waitFor(() => expect(result.current.loggerMode).toBe('quick'));
  });

  it('derives per-child signals + onboarding flag from a populated snapshot', async () => {
    const snap = buildSnapshot();
    stubFetch({
      '/api/family': () => okJson({ loggerDefaultMode: 'quick', entryCount: 5 }),
      '/api/snapshot': () => okJson({ snapshotData: snap }),
    });
    const { result } = renderHook(() => useLoggerModeAndSnapshot());

    await waitFor(() => expect(result.current.snapshotSignals).not.toBeNull());

    expect(result.current.snapshotData).toEqual(snap);
    expect(result.current.snapshotSignals).toEqual({
      perChild: {
        child_1: { active: ['thread_a', 'thread_b'], quiet: ['thread_c'] },
      },
      onboarding: true, // total_entries (5) < 20
    });
  });

  it('flags onboarding=false once total_entries crosses 20', async () => {
    const snap = buildSnapshot({
      family: { total_entries: 30 } as SnapshotData['family'],
    });
    stubFetch({
      '/api/family': () => okJson({ loggerDefaultMode: 'quick' }),
      '/api/snapshot': () => okJson({ snapshotData: snap }),
    });
    const { result } = renderHook(() => useLoggerModeAndSnapshot());
    await waitFor(() => expect(result.current.snapshotSignals?.onboarding).toBe(false));
  });

  it('leaves snapshotSignals null when the snapshot has no children', async () => {
    stubFetch({
      '/api/family': () => okJson({ loggerDefaultMode: 'quick' }),
      '/api/snapshot': () => okJson({ snapshotData: null }),
    });
    const { result } = renderHook(() => useLoggerModeAndSnapshot());
    await waitFor(() => expect(result.current.loggerMode).toBe('quick'));
    expect(result.current.snapshotData).toBeNull();
    expect(result.current.snapshotSignals).toBeNull();
  });

  it('swallows fetch failure — mode stays quick, snapshot stays null', async () => {
    stubFetch({
      '/api/family': () => {
        throw new Error('offline');
      },
      '/api/snapshot': () => okJson({ snapshotData: null }),
    });
    const { result } = renderHook(() => useLoggerModeAndSnapshot());
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.loggerMode).toBe('quick');
    expect(result.current.snapshotData).toBeNull();
  });

  it('exposes a setter for the manual mode toggle', async () => {
    stubFetch({
      '/api/family': () => okJson({ loggerDefaultMode: 'quick' }),
      '/api/snapshot': () => okJson({ snapshotData: null }),
    });
    const { result } = renderHook(() => useLoggerModeAndSnapshot());
    await waitFor(() => expect(result.current.loggerMode).toBe('quick'));
    act(() => result.current.setLoggerMode('guided'));
    expect(result.current.loggerMode).toBe('guided');
  });
});
