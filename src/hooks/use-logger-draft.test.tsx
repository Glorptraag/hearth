import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { format, subDays } from 'date-fns';
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
  learnerIds: [],
  text: '',
  dateOccurred: null,
  felt: {},
  noticed: {},
  evidence: [],
  ...overrides,
});

/** A six-section (v1) Logger draft as the old page serialised it. */
const legacyDraft = (overrides: Record<string, unknown> = {}) => ({
  description: 'Nature walk',
  selectedLearners: ['l1'],
  discoveries: { l1: 'found a beetle' },
  activityType: 'nature',
  lessonSubjects: ['science'],
  engagement: { l1: 4 },
  whenDate: 'today',
  duration: '45',
  location: 'outdoor',
  observations: [],
  evidence: [],
  observationDetails: {},
  savedAt: Date.now(),
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
      expect(result.current.dateReset).toBe(false);
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

    it('hands the parsed v2 draft to onRestore and raises the banner for real content', () => {
      const stored = serializeDraft(
        baseFields({ text: 'Nature walk', learnerIds: ['l1'], felt: { l1: 3 } }),
        Date.now(),
      );
      localStorage.setItem(DRAFT_KEY, stored);

      const onRestore = vi.fn();
      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );

      expect(onRestore).toHaveBeenCalledTimes(1);
      expect(onRestore.mock.calls[0][0]).toMatchObject({
        v: 2,
        text: 'Nature walk',
        learnerIds: ['l1'],
        felt: { l1: 3 },
      });
      expect(onRestore.mock.calls[0][1]).toEqual({ dateReset: false });
      expect(result.current.draftRestored).toBe(true);
      expect(result.current.dateReset).toBe(false);
      expect(result.current.draftSavedAt).toBe(Date.now());
    });

    it('skips restore entirely when the stored draft has no real content', () => {
      const stored = serializeDraft(baseFields(), Date.now());
      localStorage.setItem(DRAFT_KEY, stored);

      const onRestore = vi.fn();
      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );

      // An empty draft migrates to null, so there is nothing to hand back.
      expect(onRestore).not.toHaveBeenCalled();
      expect(result.current.draftRestored).toBe(false);
    });

    it('restores a legacy v1 draft with migrated fields', () => {
      const now = 1_700_000_000_000;
      vi.setSystemTime(now);
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(legacyDraft({ whenDate: 'yesterday', savedAt: now - 1000 })),
      );

      const onRestore = vi.fn();
      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );

      expect(onRestore).toHaveBeenCalledTimes(1);
      expect(onRestore.mock.calls[0][0]).toEqual({
        v: 2,
        learnerIds: ['l1'],
        text: 'Nature walk',
        dateOccurred: format(subDays(new Date(now - 1000), 1), 'yyyy-MM-dd'),
        felt: { l1: 4 },
        noticed: { l1: 'found a beetle' },
        evidence: [],
        savedAt: now - 1000,
      });
      expect(onRestore.mock.calls[0][1]).toEqual({ dateReset: false });
      expect(result.current.draftRestored).toBe(true);
      expect(result.current.dateReset).toBe(false);
      expect(result.current.draftSavedAt).toBe(now - 1000);
    });

    it("flags dateReset when a legacy draft's whenDate was 'earlier'", () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(legacyDraft({ whenDate: 'earlier' })));

      const onRestore = vi.fn();
      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );

      expect(onRestore).toHaveBeenCalledTimes(1);
      expect(onRestore.mock.calls[0][0]).toMatchObject({ v: 2, dateOccurred: null });
      expect(onRestore.mock.calls[0][1]).toEqual({ dateReset: true });
      expect(result.current.draftRestored).toBe(true);
      expect(result.current.dateReset).toBe(true);
    });

    it('fires a draft_resume notification when the draft is stale (>4 h)', () => {
      const now = 1_700_000_000_000;
      vi.setSystemTime(now);
      const stored = serializeDraft(
        baseFields({ text: 'A long ago session that drifted off into the afternoon' }),
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
      // draftTitle is the first 40 characters of the text.
      expect(body.draftTitle).toBe('A long ago session that drifted off into');
    });

    it('omits draftTitle from the stale notification when the draft has no text', () => {
      const now = 1_700_000_000_000;
      vi.setSystemTime(now);
      localStorage.setItem(
        DRAFT_KEY,
        serializeDraft(baseFields({ learnerIds: ['l1'] }), now - DRAFT_STALE_MS - 1),
      );

      renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore: vi.fn() }),
      );

      const resumeCalls = callsTo(fetchMock, RESUME_ENDPOINT);
      expect(resumeCalls).toHaveLength(1);
      expect(JSON.parse(resumeCalls[0][1].body)).toEqual({ type: 'draft_resume' });
    });

    it('does not fire a notification for a fresh draft', () => {
      const now = 1_700_000_000_000;
      vi.setSystemTime(now);
      const stored = serializeDraft(baseFields({ text: 'Fresh entry' }), now - 1000);
      localStorage.setItem(DRAFT_KEY, stored);

      renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore: vi.fn() }),
      );

      expect(callsTo(fetchMock, RESUME_ENDPOINT)).toHaveLength(0);
    });

    it('swallows fetch failure on the stale-resume notification', () => {
      const now = 1_700_000_000_000;
      vi.setSystemTime(now);
      const stored = serializeDraft(baseFields({ text: 'stale' }), now - DRAFT_STALE_MS - 1);
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

    it('writes a v2 draft and stamps lastSavedAt after one tick', () => {
      const start = 1_700_000_000_000;
      vi.setSystemTime(start);

      const state = baseFields({ text: 'We baked bread', learnerIds: ['l1'], felt: { l1: 4 } });
      const { result } = renderHook(() =>
        useLoggerDraft({ state, onRestore: vi.fn() }),
      );

      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      const stored = localStorage.getItem(DRAFT_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored as string);
      expect(parsed.v).toBe(2);
      expect(parsed.text).toBe('We baked bread');
      expect(parsed.felt).toEqual({ l1: 4 });
      // Fake timers advance Date.now() too — savedAt is the moment the interval fires.
      expect(parsed.savedAt).toBe(start + 10_000);
      expect(result.current.lastSavedAt).toBe(start + 10_000);
    });

    it('writes again on each subsequent tick while state stays persistable', () => {
      vi.setSystemTime(0);
      const state = baseFields({ learnerIds: ['l1'] });
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
      localStorage.setItem(DRAFT_KEY, JSON.stringify(legacyDraft({ whenDate: 'earlier' })));

      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore: vi.fn() }),
      );
      expect(result.current.draftRestored).toBe(true);
      expect(result.current.dateReset).toBe(true);

      act(() => {
        result.current.clearDraft();
      });

      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
      expect(result.current.draftRestored).toBe(false);
      expect(result.current.dateReset).toBe(false);
      expect(result.current.lastSavedAt).toBeNull();
    });
  });

  describe('dismissDraftRestored', () => {
    it('hides the banner without touching storage', () => {
      const stored = serializeDraft(baseFields({ text: 'something' }), Date.now());
      localStorage.setItem(DRAFT_KEY, stored);

      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore: vi.fn() }),
      );
      expect(result.current.draftRestored).toBe(true);

      act(() => {
        result.current.dismissDraftRestored();
      });

      expect(result.current.draftRestored).toBe(false);
      expect(result.current.dateReset).toBe(false);
      expect(localStorage.getItem(DRAFT_KEY)).toBe(stored);
    });
  });

  describe('cross-device sync (Postgres mirror)', () => {
    it('restores from the server mirror when it is newer than the local draft', async () => {
      vi.useRealTimers();
      const now = 1_700_000_000_000;
      localStorage.setItem(
        DRAFT_KEY,
        serializeDraft(baseFields({ text: 'local older' }), now - 10_000),
      );
      const serverDraft = { ...baseFields({ text: 'server newer' }), v: 2, savedAt: now };
      fetchMock.mockImplementation(async (url: string) =>
        url === DRAFT_ENDPOINT ? jsonResponse({ draft: serverDraft }) : jsonResponse({ ok: true }),
      );

      const onRestore = vi.fn();
      const { result, unmount } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );

      await waitFor(() =>
        expect(onRestore).toHaveBeenCalledWith(
          expect.objectContaining({ text: 'server newer' }),
          { dateReset: false },
        ),
      );
      // Server draft is mirrored back into localStorage so it survives reload.
      const mirrored = JSON.parse(localStorage.getItem(DRAFT_KEY) as string);
      expect(mirrored.text).toBe('server newer');
      expect(mirrored.v).toBe(2);
      expect(result.current.draftSavedAt).toBe(now);
      unmount();
    });

    it('migrates a legacy server blob before comparing it with the local draft', async () => {
      vi.useRealTimers();
      const now = 1_700_000_000_000;
      localStorage.setItem(
        DRAFT_KEY,
        serializeDraft(baseFields({ text: 'local older' }), now - 10_000),
      );
      // The route hands back whatever is stored — a pre-rebuild row is still v1.
      const serverBlob = legacyDraft({ description: 'server legacy newer', whenDate: 'earlier', savedAt: now });
      fetchMock.mockImplementation(async (url: string) =>
        url === DRAFT_ENDPOINT ? jsonResponse({ draft: serverBlob }) : jsonResponse({ ok: true }),
      );

      const onRestore = vi.fn();
      const { result, unmount } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );

      await waitFor(() =>
        expect(onRestore).toHaveBeenCalledWith(
          expect.objectContaining({
            v: 2,
            text: 'server legacy newer',
            learnerIds: ['l1'],
            felt: { l1: 4 },
            dateOccurred: null,
          }),
          { dateReset: true },
        ),
      );
      expect(result.current.dateReset).toBe(true);
      // The migrated (v2) draft is what gets written back, never the raw v1 blob.
      const mirrored = JSON.parse(localStorage.getItem(DRAFT_KEY) as string);
      expect(mirrored.v).toBe(2);
      expect(mirrored.text).toBe('server legacy newer');
      expect(mirrored.description).toBeUndefined();
      unmount();
    });

    it('keeps the local draft when it is newer than the server mirror', async () => {
      vi.useRealTimers();
      const now = 1_700_000_000_000;
      localStorage.setItem(
        DRAFT_KEY,
        serializeDraft(baseFields({ text: 'local newer' }), now),
      );
      const serverDraft = { ...baseFields({ text: 'server older' }), v: 2, savedAt: now - 10_000 };
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
        expect.objectContaining({ text: 'server older' }),
        expect.anything(),
      );
      expect(JSON.parse(localStorage.getItem(DRAFT_KEY) as string).text).toBe('local newer');
      unmount();
    });

    it('ignores a server blob from an unknown future version', async () => {
      vi.useRealTimers();
      const now = 1_700_000_000_000;
      localStorage.setItem(DRAFT_KEY, serializeDraft(baseFields({ text: 'local' }), now - 10_000));
      fetchMock.mockImplementation(async (url: string) =>
        url === DRAFT_ENDPOINT
          ? jsonResponse({ draft: { v: 3, text: 'future', learnerIds: ['l1'], savedAt: now } })
          : jsonResponse({ ok: true }),
      );

      const onRestore = vi.fn();
      const { unmount } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );

      await waitFor(() => expect(callsTo(fetchMock, DRAFT_ENDPOINT).length).toBeGreaterThan(0));
      expect(onRestore).toHaveBeenCalledTimes(1);
      expect(onRestore.mock.calls[0][0]).toMatchObject({ text: 'local' });
      expect(JSON.parse(localStorage.getItem(DRAFT_KEY) as string).text).toBe('local');
      unmount();
    });

    it('mirrors each autosave to the server as a v2 PUT when online', () => {
      vi.setSystemTime(1_700_000_000_000);
      const state = baseFields({ text: 'We baked bread' });
      renderHook(() => useLoggerDraft({ state, onRestore: vi.fn() }));

      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      const puts = callsTo(fetchMock, DRAFT_ENDPOINT).filter(([, init]) => init?.method === 'PUT');
      expect(puts).toHaveLength(1);
      const body = JSON.parse(puts[0][1].body);
      expect(body.draft).toEqual({
        ...state,
        v: 2,
        savedAt: 1_700_000_000_000 + 10_000,
      });
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
      const state = baseFields({ text: 'offline note' });
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
