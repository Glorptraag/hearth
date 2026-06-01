import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLoggerDraft } from './use-logger-draft';
import {
  DRAFT_KEY,
  DRAFT_STALE_MS,
  serializeDraft,
  type LoggerDraftFields,
} from '@/lib/logger/draft';

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
  ...overrides,
});

describe('useLoggerDraft', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('restore on mount', () => {
    it('does nothing when storage is empty', () => {
      const onRestore = vi.fn();
      const { result } = renderHook(() =>
        useLoggerDraft({ state: baseFields(), onRestore }),
      );
      expect(onRestore).not.toHaveBeenCalled();
      expect(result.current.draftRestored).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
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

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/notifications/trigger');
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

      expect(fetchMock).not.toHaveBeenCalled();
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
});
