import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Proposal } from '@/lib/logger/proposals';

const trackMock = vi.fn();
vi.mock('@/lib/analytics/posthog', () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

import { confidenceBucket, useProposalConfirm } from './use-proposal-confirm';

const proposal: Proposal = {
  key: 'learner-ada:dlo.M1.developing',
  learnerId: 'learner-ada',
  learnerName: 'Ada',
  colourToken: 'sage',
  dloId: 'dlo.M1.developing',
  threadId: 'M1',
  threadName: 'Number Sense',
  tier: 'developing',
  confidence: 0.82,
};

const ok = () => ({ ok: true, status: 200 }) as Response;
const bad = () => ({ ok: false, status: 500 }) as Response;

type Deferred = { promise: Promise<Response>; resolve: (r: Response) => void };
function deferred(): Deferred {
  let resolve!: (r: Response) => void;
  const promise = new Promise<Response>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('useProposalConfirm', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    trackMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('first tap optimistically confirms and POSTs confirm; second tap clears and POSTs dispute', async () => {
    fetchMock.mockResolvedValue(ok());
    const { result } = renderHook(() =>
      useProposalConfirm({ fetchImpl: fetchMock as unknown as typeof fetch }),
    );

    let first!: Promise<void>;
    act(() => {
      first = result.current.toggle(proposal);
    });
    expect(result.current.confirmed.has(proposal.key)).toBe(true);
    await act(async () => {
      await first;
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/capabilities/learner-ada/dlo/dlo.M1.developing/confirm');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: 'confirm' });

    let second!: Promise<void>;
    act(() => {
      second = result.current.toggle(proposal);
    });
    expect(result.current.confirmed.has(proposal.key)).toBe(false);
    await act(async () => {
      await second;
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ action: 'dispute' });
    expect(result.current.busy.size).toBe(0);
  });

  it('reverts the optimistic state and calls onError when the request fails', async () => {
    fetchMock.mockResolvedValue(bad());
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useProposalConfirm({ fetchImpl: fetchMock as unknown as typeof fetch, onError }),
    );

    await act(async () => {
      await result.current.toggle(proposal);
    });

    expect(result.current.confirmed.has(proposal.key)).toBe(false);
    expect(result.current.busy.has(proposal.key)).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(proposal);
    expect(trackMock).not.toHaveBeenCalled();
  });

  it('uses the global fetch when no fetchImpl is given', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(ok()));
    const { result } = renderHook(() => useProposalConfirm());

    await act(async () => {
      await result.current.toggle(proposal);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.confirmed.has(proposal.key)).toBe(true);
  });

  it('ignores taps while a request for the same key is in flight', async () => {
    const d = deferred();
    fetchMock.mockReturnValue(d.promise);
    const { result } = renderHook(() =>
      useProposalConfirm({ fetchImpl: fetchMock as unknown as typeof fetch }),
    );

    let first!: Promise<void>;
    act(() => {
      first = result.current.toggle(proposal);
    });
    expect(result.current.busy.has(proposal.key)).toBe(true);

    await act(async () => {
      await result.current.toggle(proposal);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.confirmed.has(proposal.key)).toBe(true);

    await act(async () => {
      d.resolve(ok());
      await first;
    });
    await waitFor(() => expect(result.current.busy.has(proposal.key)).toBe(false));
    expect(result.current.confirmed.has(proposal.key)).toBe(true);
  });

  it('tracks confirmed then cleared with thread, tier and confidence bucket', async () => {
    fetchMock.mockResolvedValue(ok());
    const { result } = renderHook(() =>
      useProposalConfirm({ fetchImpl: fetchMock as unknown as typeof fetch }),
    );

    await act(async () => {
      await result.current.toggle(proposal);
    });
    await act(async () => {
      await result.current.toggle(proposal);
    });

    expect(trackMock).toHaveBeenNthCalledWith(1, 'logger_proposal_confirmed', {
      thread_id: 'M1',
      tier: 'developing',
      confidence_bucket: 'high',
    });
    expect(trackMock).toHaveBeenNthCalledWith(2, 'logger_proposal_cleared', {
      thread_id: 'M1',
      tier: 'developing',
      confidence_bucket: 'high',
    });
  });

  it('buckets confidence at 0.5 and 0.75', () => {
    expect(confidenceBucket(0.1)).toBe('low');
    expect(confidenceBucket(0.49)).toBe('low');
    expect(confidenceBucket(0.5)).toBe('mid');
    expect(confidenceBucket(0.74)).toBe('mid');
    expect(confidenceBucket(0.75)).toBe('high');
    expect(confidenceBucket(1)).toBe('high');
  });
});
