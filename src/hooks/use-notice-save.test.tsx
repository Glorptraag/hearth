import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useNoticeSave, type UseNoticeSaveArgs } from './use-notice-save';
import type { LearnerRecord } from './use-learners-fetch';
import { EMPTY_NOTICE, type NoticeFields } from '@/lib/logger/notice';
import type { NoticeSource } from '@/lib/logger/source';
import type { EnrichmentPollCallbacks } from '@/lib/logger/enrichment-poll';
import type { AiEnrichment } from '@/types/enrichment';
import { noticeCopy } from '@/app/(auth)/log/_components/noticeCopy';
import { confirmCopy } from '@/components/logger/confirm/confirmCopy';
import { track, hashForAnalytics } from '@/lib/analytics/posthog';
import { checkBadgeThresholds, buildBadgeReadyToast } from '@/lib/logger/badge-check';
import { queueEntry } from '@/lib/logger/outbox';
import { pollEntryEnrichment } from '@/lib/logger/enrichment-poll';

type CapturedPoll = { entryId: string; cb: EnrichmentPollCallbacks; finish: () => void };

const { polls } = vi.hoisted(() => ({
  polls: [] as Array<{ entryId: string; cb: unknown; finish: () => void }>,
}));

vi.mock('@/lib/analytics/posthog', () => ({
  track: vi.fn(),
  hashForAnalytics: vi.fn().mockResolvedValue('hash_entry_fixture'),
}));

vi.mock('@/lib/logger/badge-check', () => ({
  checkBadgeThresholds: vi.fn().mockResolvedValue([]),
  buildBadgeReadyToast: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/logger/outbox', () => ({
  queueEntry: vi.fn().mockResolvedValue('queued-1'),
}));

vi.mock('@/lib/logger/enrichment-poll', () => ({
  pollEntryEnrichment: vi.fn(
    (entryId: string, cb: unknown) =>
      new Promise<void>((resolve) => {
        polls.push({ entryId, cb, finish: resolve });
      }),
  ),
}));

const NOW = 1_700_000_000_000;

const learners: LearnerRecord[] = [
  { id: 'a', name: 'Sam', dateOfBirth: null, shapeIcon: null, colourToken: 'child-1' },
  { id: 'b', name: 'Lily', dateOfBirth: null, shapeIcon: null, colourToken: 'child-2' },
];

const fields = (overrides: Partial<NoticeFields> = {}): NoticeFields => ({
  ...EMPTY_NOTICE,
  learnerIds: ['a'],
  text: 'We counted shells on the beach',
  ...overrides,
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const setOnline = (online: boolean) =>
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: online });

const enriched = (overrides: Partial<AiEnrichment> = {}): AiEnrichment => ({
  status: 'enriched',
  capability_threads: [{ thread_id: 'M1', confidence: 0.8 }],
  discrete_learning_objectives: [{ dlo_id: 'dlo.M1.developing', tier: 'developing', confidence: 0.8 }],
  per_child_signals: {},
  ...overrides,
});

const lastPoll = (): CapturedPoll => polls[polls.length - 1] as CapturedPoll;

describe('useNoticeSave', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let args: UseNoticeSaveArgs;

  const setup = (overrides: Partial<UseNoticeSaveArgs> = {}) => {
    args = {
      source: { kind: 'logger' },
      learners,
      clearDraft: vi.fn(),
      resetForm: vi.fn(),
      toast: vi.fn(),
      ...overrides,
    };
    return renderHook((props: UseNoticeSaveArgs) => useNoticeSave(props), { initialProps: args });
  };

  const saveOk = async (hook: ReturnType<typeof setup>, f: NoticeFields = fields(), id = 'e1') => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id }, 201));
    await act(async () => {
      await hook.result.current.save(f);
    });
  };

  beforeEach(() => {
    polls.length = 0;
    setOnline(true);
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    fetchMock = vi.fn(async () => jsonResponse({}, 200));
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(track).mockClear();
    vi.mocked(hashForAnalytics).mockClear();
    vi.mocked(checkBadgeThresholds).mockClear().mockResolvedValue([]);
    vi.mocked(buildBadgeReadyToast).mockClear().mockReturnValue(null);
    vi.mocked(queueEntry).mockClear().mockResolvedValue('queued-1');
    vi.mocked(pollEntryEnrichment).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    setOnline(true);
  });

  describe('save gate', () => {
    it('is a no-op when the save is blocked', async () => {
      const hook = setup();
      await act(async () => {
        await hook.result.current.save(fields({ learnerIds: [] }));
        await hook.result.current.save(fields({ text: '   ', evidence: [] }));
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(hook.result.current.state).toBeNull();
      expect(args.clearDraft).not.toHaveBeenCalled();
    });

    it('ignores a second save while one is in flight and reports isSaving', async () => {
      const hook = setup();
      let release: (r: Response) => void = () => {};
      fetchMock.mockImplementationOnce(() => new Promise<Response>((r) => (release = r)));

      let first: Promise<void> = Promise.resolve();
      act(() => {
        first = hook.result.current.save(fields());
      });
      await waitFor(() => expect(hook.result.current.isSaving).toBe(true));
      await act(async () => {
        await hook.result.current.save(fields());
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        release(jsonResponse({ id: 'e1' }, 201));
        await first;
      });
      expect(hook.result.current.isSaving).toBe(false);
      expect(hook.result.current.state?.kind).toBe('pending');
    });
  });

  describe('201 → pending → enrichment', () => {
    it('posts the payload, enters pending, clears the draft and form, tracks entry_created', async () => {
      const hook = setup();
      await saveOk(hook, fields({ felt: { a: 4 }, noticed: { a: 'asked why shells spiral' } }));

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/entries');
      expect(init.method).toBe('POST');
      const body = JSON.parse(init.body);
      expect(body.learnerIds).toEqual(['a']);
      expect(body.engagementPerLearner).toEqual({ a: 4 });

      expect(hook.result.current.state).toEqual({
        kind: 'pending',
        entryId: 'e1',
        savedAtMs: NOW,
        learnerIds: ['a'],
        evidenceCount: 0,
        source: { kind: 'logger' },
      });
      expect(args.clearDraft).toHaveBeenCalledTimes(1);
      expect(args.resetForm).toHaveBeenCalledTimes(1);
      expect(args.toast).not.toHaveBeenCalled();

      expect(track).toHaveBeenCalledWith('entry_created', {
        source_kind: 'logger',
        learner_count: 1,
        has_evidence: false,
        has_felt: true,
        has_noticed: true,
        when_kind: 'today',
        resumed_from_draft: false,
        entry_id: 'hash_entry_fixture',
      });

      expect(pollEntryEnrichment).toHaveBeenCalledTimes(1);
      expect(lastPoll().entryId).toBe('e1');
      expect(lastPoll().cb.isCurrent()).toBe(true);
    });

    it('adds compose_ms (seconds, capped at 4 h) and draft_age_ms when known, read before the form resets', async () => {
      const composeStartedAt = vi.fn<() => number | null>(() => NOW - 65_432);
      const resetForm = vi.fn(() => composeStartedAt.mockReturnValue(null));
      const hook = setup({
        resetForm,
        analytics: { resumedFromDraft: true, draftSavedAt: NOW - 5_000, composeStartedAt },
      });
      await saveOk(hook, fields({ dateOccurred: '2023-11-13' }));

      const props = vi.mocked(track).mock.calls[0][1] as Record<string, unknown>;
      expect(props.compose_ms).toBe(65_000);
      expect(props.draft_age_ms).toBe(5_000);
      expect(props.resumed_from_draft).toBe(true);
      expect(props.when_kind).toBe('yesterday');

      const hookLong = setup({
        analytics: {
          resumedFromDraft: false,
          draftSavedAt: null,
          composeStartedAt: () => NOW - 9 * 60 * 60 * 1000,
        },
      });
      await saveOk(hookLong, fields(), 'e2');
      const longProps = vi.mocked(track).mock.calls[1][1] as Record<string, unknown>;
      expect(longProps.compose_ms).toBe(4 * 60 * 60 * 1000);
      expect(longProps).not.toHaveProperty('draft_age_ms');
    });

    it('stays pending on a pending enrichment, then resolves to proposals', async () => {
      const hook = setup();
      await saveOk(hook);

      act(() => {
        lastPoll().cb.onEnrichment({ status: 'pending' });
      });
      expect(hook.result.current.state?.kind).toBe('pending');

      act(() => {
        lastPoll().cb.onEnrichment(enriched());
      });
      const state = hook.result.current.state;
      expect(state?.kind).toBe('proposals');
      if (state?.kind !== 'proposals') throw new Error('expected proposals');
      expect(state.entryId).toBe('e1');
      expect(state.proposals).toHaveLength(1);
      expect(state.proposals[0]).toMatchObject({
        key: 'a:dlo.M1.developing',
        learnerId: 'a',
        learnerName: 'Sam',
        colourToken: 'child-1',
        dloId: 'dlo.M1.developing',
        threadId: 'M1',
        tier: 'developing',
      });
    });

    it('resolves to nothing for a single child with no DLOs', async () => {
      const hook = setup();
      await saveOk(hook);
      act(() => {
        lastPoll().cb.onEnrichment(enriched({ discrete_learning_objectives: [] }));
      });
      expect(hook.result.current.state).toMatchObject({ kind: 'nothing', nobodyNamed: false });
    });

    it('resolves to nothing + nobodyNamed when a two-child entry names nobody', async () => {
      const hook = setup();
      await saveOk(hook, fields({ learnerIds: ['a', 'b'] }));
      act(() => {
        lastPoll().cb.onEnrichment(enriched({ per_child_signals: {} }));
      });
      expect(hook.result.current.state).toMatchObject({
        kind: 'nothing',
        nobodyNamed: true,
        learnerIds: ['a', 'b'],
      });
    });

    it('attributes only the named child and sorts the check-in thread first', async () => {
      const source: NoticeSource = { kind: 'check_in', learnerId: 'b', threadId: 'M2' };
      const hook = setup({ source });
      await saveOk(hook, fields({ learnerIds: ['a', 'b'] }));
      act(() => {
        lastPoll().cb.onEnrichment(
          enriched({
            discrete_learning_objectives: [
              { dlo_id: 'dlo.M1.developing', tier: 'developing', confidence: 0.9 },
              { dlo_id: 'dlo.M2.emerging', tier: 'emerging', confidence: 0.5 },
            ],
            per_child_signals: {
              lily: { engagement_score: 3, complexity_level: 'developing', notable: null },
            },
          }),
        );
      });
      const state = hook.result.current.state;
      if (state?.kind !== 'proposals') throw new Error('expected proposals');
      expect(state.proposals.map((p) => p.key)).toEqual(['b:dlo.M2.emerging', 'b:dlo.M1.developing']);
      expect(state.source).toEqual(source);
    });

    it('resolves to failed on a failed enrichment', async () => {
      const hook = setup();
      await saveOk(hook);
      act(() => {
        lastPoll().cb.onEnrichment({ status: 'failed', failedAt: '2026-10-07T00:00:00Z' });
      });
      expect(hook.result.current.state).toMatchObject({ kind: 'failed', entryId: 'e1' });
    });

    it('resolves to failed when the poll times out while still pending, and leaves a terminal state alone', async () => {
      const hook = setup();
      await saveOk(hook);
      act(() => {
        lastPoll().cb.onTimeout();
      });
      expect(hook.result.current.state?.kind).toBe('failed');

      const hook2 = setup();
      await saveOk(hook2, fields(), 'e9');
      act(() => {
        lastPoll().cb.onEnrichment(enriched());
        lastPoll().cb.onTimeout();
      });
      expect(hook2.result.current.state?.kind).toBe('proposals');
    });

    it('surfaces a badge-ready toast for the saved children', async () => {
      vi.mocked(checkBadgeThresholds).mockResolvedValue([{ badgeId: 'bdg', learnerId: 'a' }]);
      const badge = { type: 'badge' as const, message: 'Quick check?', action: { label: 'Now', href: '/badges/assess/bdg' } };
      vi.mocked(buildBadgeReadyToast).mockReturnValue(badge);

      const hook = setup();
      await saveOk(hook, fields({ learnerIds: ['a', 'b'] }));

      await waitFor(() => expect(hook.result.current.badgeReady).toEqual(badge));
      expect(checkBadgeThresholds).toHaveBeenCalledWith(['a', 'b']);
      const nameMap = vi.mocked(buildBadgeReadyToast).mock.calls[0][1];
      expect(nameMap.get('a')).toBe('Sam');
      expect(nameMap.get('b')).toBe('Lily');
    });

    it('never throws when the badge check rejects', async () => {
      vi.mocked(checkBadgeThresholds).mockRejectedValue(new Error('boom'));
      const hook = setup();
      await saveOk(hook);
      await act(async () => {
        await Promise.resolve();
      });
      expect(hook.result.current.state?.kind).toBe('pending');
      expect(hook.result.current.badgeReady).toBeNull();
    });
  });

  describe('server rejections', () => {
    it('403 → forbidden toast, nothing queued, draft kept', async () => {
      const hook = setup();
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'nope' }, 403));
      await act(async () => {
        await hook.result.current.save(fields());
      });
      expect(args.toast).toHaveBeenCalledWith(noticeCopy.forbidden, 'error');
      expect(queueEntry).not.toHaveBeenCalled();
      expect(args.clearDraft).not.toHaveBeenCalled();
      expect(args.resetForm).not.toHaveBeenCalled();
      expect(hook.result.current.state).toBeNull();
      expect(hook.result.current.isSaving).toBe(false);
    });

    it('429 → rate-limited toast', async () => {
      const hook = setup();
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'slow down' }, 429));
      await act(async () => {
        await hook.result.current.save(fields());
      });
      expect(args.toast).toHaveBeenCalledWith(noticeCopy.rateLimited, 'error');
      expect(hook.result.current.state).toBeNull();
    });

    it('other non-ok → save failed toast', async () => {
      const hook = setup();
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'oops' }, 500));
      await act(async () => {
        await hook.result.current.save(fields());
      });
      expect(args.toast).toHaveBeenCalledWith(noticeCopy.saveFailed, 'error');
      expect(queueEntry).not.toHaveBeenCalled();
      expect(track).not.toHaveBeenCalled();
    });
  });

  describe('network failure', () => {
    it('offline → queues the payload and enters queued', async () => {
      setOnline(false);
      const hook = setup();
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await act(async () => {
        await hook.result.current.save(fields({ learnerIds: ['a', 'b'] }));
      });
      expect(queueEntry).toHaveBeenCalledTimes(1);
      expect(vi.mocked(queueEntry).mock.calls[0][0]).toMatchObject({ learnerIds: ['a', 'b'] });
      expect(hook.result.current.state).toEqual({ kind: 'queued', learnerIds: ['a', 'b'] });
      expect(args.clearDraft).toHaveBeenCalledTimes(1);
      expect(args.resetForm).toHaveBeenCalledTimes(1);
      expect(args.toast).toHaveBeenCalledWith(noticeCopy.savedOffline);
      expect(pollEntryEnrichment).not.toHaveBeenCalled();
    });

    it('offline but the outbox refuses → could-not-queue toast, draft kept', async () => {
      setOnline(false);
      vi.mocked(queueEntry).mockResolvedValue(null);
      const hook = setup();
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await act(async () => {
        await hook.result.current.save(fields());
      });
      expect(args.toast).toHaveBeenCalledWith(noticeCopy.couldNotQueue, 'error');
      expect(hook.result.current.state).toBeNull();
      expect(args.clearDraft).not.toHaveBeenCalled();
    });

    it('online throw → save failed toast, nothing queued', async () => {
      const hook = setup();
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await act(async () => {
        await hook.result.current.save(fields());
      });
      expect(args.toast).toHaveBeenCalledWith(noticeCopy.saveFailed, 'error');
      expect(queueEntry).not.toHaveBeenCalled();
      expect(hook.result.current.state).toBeNull();
    });
  });

  describe('logAnother', () => {
    it('clears the surface and invalidates the running poll', async () => {
      const badge = { type: 'badge' as const, message: 'x', action: { label: 'y', href: '/z' } };
      vi.mocked(checkBadgeThresholds).mockResolvedValue([{ badgeId: 'bdg', learnerId: 'a' }]);
      vi.mocked(buildBadgeReadyToast).mockReturnValue(badge);
      const hook = setup();
      await saveOk(hook);
      await waitFor(() => expect(hook.result.current.badgeReady).toEqual(badge));
      const poll = lastPoll();

      act(() => {
        hook.result.current.logAnother();
      });
      expect(hook.result.current.state).toBeNull();
      expect(hook.result.current.badgeReady).toBeNull();
      expect(poll.cb.isCurrent()).toBe(false);

      act(() => {
        poll.cb.onEnrichment(enriched());
        poll.cb.onTimeout();
      });
      expect(hook.result.current.state).toBeNull();
    });

    it('drops a late badge result for an entry that is no longer on the surface', async () => {
      let release: (v: Array<{ badgeId: string; learnerId: string }>) => void = () => {};
      vi.mocked(checkBadgeThresholds).mockImplementation(() => new Promise((r) => (release = r)));
      vi.mocked(buildBadgeReadyToast).mockReturnValue({
        type: 'badge',
        message: 'x',
        action: { label: 'y', href: '/z' },
      });
      const hook = setup();
      await saveOk(hook);
      act(() => {
        hook.result.current.logAnother();
      });
      await act(async () => {
        release([{ badgeId: 'bdg', learnerId: 'a' }]);
        await Promise.resolve();
      });
      expect(hook.result.current.badgeReady).toBeNull();
    });
  });

  describe('retryEnrichment', () => {
    const failFirst = async (hook: ReturnType<typeof setup>) => {
      await saveOk(hook);
      act(() => {
        lastPoll().cb.onEnrichment({ status: 'failed' });
      });
      expect(hook.result.current.state?.kind).toBe('failed');
    };

    it('does nothing unless the surface is failed', async () => {
      const hook = setup();
      await saveOk(hook);
      await act(async () => {
        await hook.result.current.retryEnrichment();
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(hook.result.current.state?.kind).toBe('pending');
    });

    it('posts to the enrich route, returns to pending and re-polls', async () => {
      const hook = setup();
      await failFirst(hook);

      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }, 200));
      await act(async () => {
        await hook.result.current.retryEnrichment();
      });
      expect(fetchMock).toHaveBeenLastCalledWith('/api/entries/e1/enrich', { method: 'POST' });
      expect(hook.result.current.state).toMatchObject({ kind: 'pending', entryId: 'e1' });
      expect(pollEntryEnrichment).toHaveBeenCalledTimes(2);
      expect(lastPoll().entryId).toBe('e1');

      act(() => {
        lastPoll().cb.onEnrichment(enriched());
      });
      expect(hook.result.current.state?.kind).toBe('proposals');
    });

    it('a rejected retry toasts and stays failed', async () => {
      const hook = setup();
      await failFirst(hook);

      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'rl' }, 429));
      await act(async () => {
        await hook.result.current.retryEnrichment();
      });
      expect(args.toast).toHaveBeenCalledWith(confirmCopy.retryFailed, 'error');
      expect(hook.result.current.state?.kind).toBe('failed');
      expect(pollEntryEnrichment).toHaveBeenCalledTimes(1);

      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await act(async () => {
        await hook.result.current.retryEnrichment();
      });
      expect(args.toast).toHaveBeenCalledTimes(2);
      expect(hook.result.current.state?.kind).toBe('failed');
    });
  });
});
