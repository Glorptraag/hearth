import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useLoggerDraft } from './use-logger-draft';
import {
  DRAFT_KEY,
  DRAFT_STALE_MS,
  serializeDraft,
  type LoggerDraftFields,
} from '@/lib/logger/draft';

const DRAFT_ENDPOINT = '/api/logger/draft';
const RESUME_ENDPOINT = '/api/notifications/trigger';

const baseFields = (overrides: Partial<LoggerDraftFields> = {}): LoggerDraftFields => ({
  description: '',
  selectedLearners: [],
  discoveries: {},
  activityType: null,
  lessonSubjects: [],
  engagement: {},
  whenDate: 'today',
  duration: null,
  location: null,
  observations: [],
  evidence: [],
  observationDetails: {},
  ...overrides,
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** The fetch-mock calls made to a given URL (first positional arg). */
const callsTo = (mock: ReturnType<typeof vi.fn>, url: string) =>
  mock.mock.calls.filter((c) => c[0] === url);

const setOnline = (online: boolean) =>
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: online });

describe('useLoggerDraft', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    setOnline(true);
    // Default: the server mirror is empty. Individual tests override per-URL.
    fetchMock = vi.fn(async () => jsonResponse({ draft: null }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    setOnline(true);
  });

  describe('restore on mount', () => {
    it('restores nothing when local + server are both empty', () => {
      const onRestore = vi.fn();
      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );
      expect(onRestore).not.toHaveBeenCalled();
      expect(result.current.draftRestored).toBe(false);
      // We still best-effort GET the server mirror, but never the resume notification.
      expect(callsTo(fetchMock, RESUME_ENDPOINT)).toHaveLength(0);
    });

    it('does nothing when storage holds corrupt JSON', () => {
      localStorage.setItem(DRAFT_KEY, '{not json');
      const onRestore = vi.fn();
      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );
      expect(onRestore).not.toHaveBeenCalled();
      expect(result.current.draftRestored).toBe(false);
    });

    it('hands the parsed draft to onRestore and raises the banner for real content', () => {
      const stored = serializeDraft(
        baseFields({ description: 'Nature walk', selectedLearners: ['l1'] }),
        Date.now(),
      );
      localStorage.setItem(DRAFT_KEY, stored);

      const onRestore = vi.fn();
      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );

      expect(onRestore).toHaveBeenCalledTimes(1);
      expect(onRestore.mock.calls[0][0]).toMatchObject({
        description: 'Nature walk',
        selectedLearners: ['l1'],
      });
      expect(result.current.draftRestored).toBe(true);
    });

    it('does not raise the banner when the parsed draft has no real content', () => {
      const stored = serializeDraft(baseFields(), Date.now());
      localStorage.setItem(DRAFT_KEY, stored);

      const onRestore = vi.fn();
      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );

      expect(onRestore).toHaveBeenCalledTimes(1);
      expect(result.current.draftRestored).toBe(false);
    });

    it('fires a draft_resume notification when the draft is stale (>4 h)', () => {
      const now = 1_700_000_000_000;
      vi.setSystemTime(now);
      const stored = serializeDraft(
        baseFields({ description: 'A long ago session that drifted off' }),
        now - DRAFT_STALE_MS - 1,
      );
      localStorage.setItem(DRAFT_KEY, stored);

      renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore: vi.fn() }),
      );

      const resumeCalls = callsTo(fetchMock, RESUME_ENDPOINT);
      expect(resumeCalls).toHaveLength(1);
      const init = resumeCalls[0][1];
      expect(init.method).toBe('POST');
      const body = JSON.parse(init.body);
      expect(body.type).toBe('draft_resume');
      expect(body.draftTitle).toBe('A long ago session that drifted off');
    });

    it('does not fire a notification for a fresh draft', () => {
      const now = 1_700_000_000_000;
      vi.setSystemTime(now);
      const stored = serializeDraft(
        baseFields({ description: 'Fresh entry' }),
        now - 1000,
      );
      localStorage.setItem(DRAFT_KEY, stored);

      renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore: vi.fn() }),
      );

      expect(callsTo(fetchMock, RESUME_ENDPOINT)).toHaveLength(0);
    });

    it('swallows fetch failure on the stale-resume notification', () => {
      const now = 1_700_000_000_000;
      vi.setSystemTime(now);
      const stored = serializeDraft(
        baseFields({ description: 'stale' }),
        now - DRAFT_STALE_MS - 1,
      );
      localStorage.setItem(DRAFT_KEY, stored);
      fetchMock.mockRejectedValueOnce(new Error('offline'));

      expect(() =>
        renderHook(() =>
          useLoggerDraft({ state: baseFields(), onRestore: vi.fn() }),
        ),
      ).not.toThrow();
    });
  });

  describe('10 s autosave', () => {
    it('does nothing when the state is not worth persisting', () => {
      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore: vi.fn() }),
      );

      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
      expect(result.current.lastSavedAt).toBeNull();
    });

    it('writes the draft and stamps lastSavedAt after one tick', () => {
      const start = 1_700_000_000_000;
      vi.setSystemTime(start);

      const state = baseFields({ description: 'We baked bread' });
      const { result } = renderHook(() =>
        useLoggerDraft({ state, onRestore: vi.fn() }),
      );

      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      const stored = localStorage.getItem(DRAFT_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored as string);
      expect(parsed.description).toBe('We baked bread');
      // Fake timers advance Date.now() too — savedAt is the moment the interval fires.
      expect(parsed.savedAt).toBe(start + 10_000);
      expect(result.current.lastSavedAt).toBe(start + 10_000);
    });

    it('writes again on each subsequent tick while state stays persistable', () => {
      vi.setSystemTime(0);
      const state = baseFields({ selectedLearners: ['l1'] });
      const { result } = renderHook(() =>
        useLoggerDraft({ state, onRestore: vi.fn() }),
      );

      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(result.current.lastSavedAt).toBe(10_000);

      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(result.current.lastSavedAt).toBe(20_000);
    });
  });

  describe('clearDraft', () => {
    it('removes the persisted draft and resets banner + timestamp', () => {
      const stored = serializeDraft(
        baseFields({ description: 'something' }),
        Date.now(),
      );
      localStorage.setItem(DRAFT_KEY, stored);

      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore: vi.fn() }),
      );
      expect(result.current.draftRestored).toBe(true);

      act(() => {
        result.current.clearDraft();
      });

      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
      expect(result.current.draftRestored).toBe(false);
      expect(result.current.lastSavedAt).toBeNull();
    });
  });

  describe('dismissDraftRestored', () => {
    it('hides the banner without touching storage', () => {
      const stored = serializeDraft(
        baseFields({ description: 'something' }),
        Date.now(),
      );
      localStorage.setItem(DRAFT_KEY, stored);

      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore: vi.fn() }),
      );
      expect(result.current.draftRestored).toBe(true);

      act(() => {
        result.current.dismissDraftRestored();
      });

      expect(result.current.draftRestored).toBe(false);
      expect(localStorage.getItem(DRAFT_KEY)).toBe(stored);
    });
  });

  describe('cross-device sync (Postgres mirror)', () => {
    it('restores from the server mirror when it is newer than the local draft', async () => {
      vi.useRealTimers();
      const now = 1_700_000_000_000;
      localStorage.setItem(
        DRAFT_KEY,
        serializeDraft(baseFields({ description: 'local older' }), now - 10_000),
      );
      const serverDraft = { ...baseFields({ description: 'server newer' }), savedAt: now };
      fetchMock.mockImplementation(async (url: string) =>
        url === DRAFT_ENDPOINT ? jsonResponse({ draft: serverDraft }) : jsonResponse({ ok: true }),
      );

      const onRestore = vi.fn();
      const { unmount } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );

      await waitFor(() =>
        expect(onRestore).toHaveBeenCalledWith(
          expect.objectContaining({ description: 'server newer' }),
        ),
      );
      // Server draft is mirrored back into localStorage so it survives reload.
      expect(JSON.parse(localStorage.getItem(DRAFT_KEY) as string).description).toBe(
        'server newer',
      );
      unmount();
    });

    it('keeps the local draft when it is newer than the server mirror', async () => {
      vi.useRealTimers();
      const now = 1_700_000_000_000;
      localStorage.setItem(
        DRAFT_KEY,
        serializeDraft(baseFields({ description: 'local newer' }), now),
      );
      const serverDraft = { ...baseFields({ description: 'server older' }), savedAt: now - 10_000 };
      fetchMock.mockImplementation(async (url: string) =>
        url === DRAFT_ENDPOINT ? jsonResponse({ draft: serverDraft }) : jsonResponse({ ok: true }),
      );

      const onRestore = vi.fn();
      const { unmount } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );

      await waitFor(() => expect(callsTo(fetchMock, DRAFT_ENDPOINT).length).toBeGreaterThan(0));
      // Local restore happened; the older server draft was never applied.
      expect(onRestore).not.toHaveBeenCalledWith(
        expect.objectContaining({ description: 'server older' }),
      );
      expect(JSON.parse(localStorage.getItem(DRAFT_KEY) as string).description).toBe('local newer');
      unmount();
    });

    it('mirrors each autosave to the server with a PUT when online', () => {
      vi.setSystemTime(1_700_000_000_000);
      const state = baseFields({ description: 'We baked bread' });
      renderHook(() => useLoggerDraft({ state, onRestore: vi.fn() }));

      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      const puts = callsTo(fetchMock, DRAFT_ENDPOINT).filter(([, init]) => init?.method === 'PUT');
      expect(puts).toHaveLength(1);
      const body = JSON.parse(puts[0][1].body);
      expect(body.draft.description).toBe('We baked bread');
      expect(body.draft.savedAt).toBe(1_700_000_000_000 + 10_000);
    });

    it('clears the server mirror with a DELETE on clearDraft', () => {
      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore: vi.fn() }),
      );

      act(() => {
        result.current.clearDraft();
      });

      const dels = callsTo(fetchMock, DRAFT_ENDPOINT).filter(([, init]) => init?.method === 'DELETE');
      expect(dels).toHaveLength(1);
    });

    it('makes no network calls (mount GET or autosave PUT) while offline', () => {
      setOnline(false);
      const state = baseFields({ description: 'offline note' });
      renderHook(() => useLoggerDraft({ state, onRestore: vi.fn() }));

      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      expect(callsTo(fetchMock, DRAFT_ENDPOINT)).toHaveLength(0);
      // The offline-first localStorage write still happened.
      expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();
    });
  });
});
