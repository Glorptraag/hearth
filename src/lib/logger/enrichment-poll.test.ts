import { describe, it, expect, vi } from 'vitest';
import { pollEntryEnrichment, type EnrichmentPollCallbacks } from './enrichment-poll';
import type { AiEnrichment } from '@/types/enrichment';

const enrichment = (status: AiEnrichment['status'], extra: Partial<AiEnrichment> = {}): AiEnrichment =>
  ({ status, ...extra } as AiEnrichment);

function res(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

/** Spy callbacks; isCurrent stays true unless a test overrides it. */
function makeCallbacks(over: Partial<EnrichmentPollCallbacks> = {}) {
  let current = true;
  return {
    isCurrent: over.isCurrent ?? (() => current),
    clearCurrent: over.clearCurrent ?? vi.fn(() => { current = false; }),
    onEnrichment: over.onEnrichment ?? vi.fn(),
    onTimeout: over.onTimeout ?? vi.fn(),
    _setCurrent: (v: boolean) => { current = v; },
  };
}

const noSleep = () => Promise.resolve();

describe('pollEntryEnrichment', () => {
  it('applies the enrichment and stops on a terminal status', async () => {
    const cb = makeCallbacks();
    const fetchImpl = vi.fn().mockResolvedValue(res({ aiEnrichment: enrichment('enriched') }));

    await pollEntryEnrichment('e1', cb, { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: noSleep });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith('/api/entries/e1');
    expect(cb.onEnrichment).toHaveBeenCalledWith(enrichment('enriched'));
    expect(cb.clearCurrent).toHaveBeenCalled();
    expect(cb.onTimeout).toHaveBeenCalledTimes(1); // always called; call site no-ops on terminal
  });

  it('keeps polling while pending, then stops when it turns terminal', async () => {
    const cb = makeCallbacks();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(res({ aiEnrichment: enrichment('pending') }))
      .mockResolvedValueOnce(res({ aiEnrichment: enrichment('pending') }))
      .mockResolvedValueOnce(res({ aiEnrichment: enrichment('enriched') }));

    await pollEntryEnrichment('e1', cb, { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: noSleep });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(cb.onEnrichment).toHaveBeenCalledTimes(3); // applied each fetch, including pending
  });

  it('skips transient failures (non-OK, missing enrichment, thrown) and keeps polling', async () => {
    const cb = makeCallbacks();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(res({}, false)) // non-OK
      .mockResolvedValueOnce(res({ aiEnrichment: null })) // missing
      .mockRejectedValueOnce(new Error('network')) // thrown
      .mockResolvedValueOnce(res({ aiEnrichment: enrichment('enriched') }));

    await pollEntryEnrichment('e1', cb, { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: noSleep });

    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(cb.onEnrichment).toHaveBeenCalledTimes(1); // only the successful one
    expect(cb.onEnrichment).toHaveBeenCalledWith(enrichment('enriched'));
  });

  it('bails before fetching when the guard goes false (parent moved on)', async () => {
    const cb = makeCallbacks({ isCurrent: () => false });
    const fetchImpl = vi.fn();

    await pollEntryEnrichment('e1', cb, { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: noSleep });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(cb.onEnrichment).not.toHaveBeenCalled();
    expect(cb.onTimeout).toHaveBeenCalledTimes(1);
  });

  it('resolves via timeout when the status never goes terminal', async () => {
    const cb = makeCallbacks();
    const fetchImpl = vi.fn().mockResolvedValue(res({ aiEnrichment: enrichment('pending') }));
    // Clock advances one interval per now() tick; timeout after ~2 intervals.
    let t = 0;
    const now = () => (t += 1500) - 1500; // 0, 1500, 3000…
    await pollEntryEnrichment('e1', cb, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: noSleep,
      now,
      intervalMs: 1500,
      timeoutMs: 3000,
    });

    expect(cb.clearCurrent).toHaveBeenCalled(); // post-loop teardown
    expect(cb.onTimeout).toHaveBeenCalledTimes(1);
  });
});
