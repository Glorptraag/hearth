import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

import {
  queueEntry,
  listQueued,
  countQueued,
  clearQueue,
  flushOutbox,
  MAX_ATTEMPTS,
} from './outbox';
import type { EntrySavePayload } from './entry-payload';

function payload(overrides: Partial<EntrySavePayload> = {}): EntrySavePayload {
  return {
    title: 'Made a volcano',
    description: 'Bicarb and vinegar on the back step.',
    dateOccurred: '2026-08-03',
    learnerIds: ['learner-1'],
    engagementPerLearner: { 'learner-1': 4 },
    discoveriesPerLearner: {},
    evidenceUrls: [],
    evidence: [],
    source: 'logger',
    status: 'complete',
    ...overrides,
  };
}

/**
 * The shape the six-section Logger queued before the Notice rebuild. A record
 * like this can still be sitting in a parent's IndexedDB when the new client
 * ships; it must replay untouched (the server's non-strict zod strips the
 * retired keys) rather than be rejected client-side.
 */
const legacyPayload = {
  title: 'Queued before the rebuild',
  description: 'Still in the outbox when the new Logger deployed.',
  dateOccurred: '2026-08-03',
  subjects: ['science'],
  learnerIds: ['learner-1'],
  engagementPerLearner: { 'learner-1': 4 },
  discoveriesPerLearner: {},
  evidenceUrls: [],
  evidence: [],
  observationDetails: { 'learner-1': { detail: 'focused' } },
  mode: 'quick',
  source: 'project',
  projectId: 'proj-1',
  stageNumber: '2',
  status: 'complete',
};

const ok = () => new Response(JSON.stringify({ id: 'entry-1' }), { status: 200 });
const status = (code: number) => () => new Response('', { status: code });
const networkDown = () => {
  throw new TypeError('Failed to fetch');
};

beforeEach(async () => {
  await clearQueue();
});

describe('queueEntry', () => {
  it('persists an entry and reports it as queued', async () => {
    const id = await queueEntry(payload());

    expect(id).toBeTruthy();
    expect(await countQueued()).toBe(1);

    const [record] = await listQueued();
    expect(record.payload.title).toBe('Made a volcano');
    expect(record.attempts).toBe(0);
    expect(record.queuedAt).toBeGreaterThan(0);
  });

  it('keeps entries distinct rather than overwriting', async () => {
    await queueEntry(payload({ title: 'First' }));
    await queueEntry(payload({ title: 'Second' }));

    expect(await countQueued()).toBe(2);
  });
});

describe('flushOutbox', () => {
  it('sends queued entries and empties the queue', async () => {
    await queueEntry(payload({ title: 'First' }));
    await queueEntry(payload({ title: 'Second' }));

    const fetchImpl = vi.fn(ok);
    const result = await flushOutbox(fetchImpl as unknown as typeof fetch);

    expect(result).toEqual({ sent: 2, dropped: 0, remaining: 0 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(await countQueued()).toBe(0);
  });

  it('replays in the order the parent wrote them', async () => {
    await queueEntry(payload({ title: 'First' }));
    await new Promise((r) => setTimeout(r, 5));
    await queueEntry(payload({ title: 'Second' }));

    const titles: string[] = [];
    const fetchImpl = vi.fn((_url: string, init: RequestInit) => {
      titles.push(JSON.parse(init.body as string).title);
      return ok();
    });

    await flushOutbox(fetchImpl as unknown as typeof fetch);

    expect(titles).toEqual(['First', 'Second']);
  });

  it('posts the payload verbatim to /api/entries', async () => {
    await queueEntry(payload());

    const fetchImpl = vi.fn((_url: string, _init: RequestInit) => ok());
    await flushOutbox(fetchImpl as unknown as typeof fetch);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('/api/entries');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(payload());
  });

  it('replays a legacy-shaped record byte-for-byte and removes it on success', async () => {
    await queueEntry(legacyPayload as unknown as EntrySavePayload);

    const fetchImpl = vi.fn(
      (_url: string, _init: RequestInit) =>
        new Response(JSON.stringify({ id: 'entry-legacy' }), { status: 201 }),
    );
    const result = await flushOutbox(fetchImpl as unknown as typeof fetch);

    expect(result).toEqual({ sent: 1, dropped: 0, remaining: 0 });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('/api/entries');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify(legacyPayload));
    expect(await countQueued()).toBe(0);
  });

  it('keeps the entry queued while the network is still down', async () => {
    await queueEntry(payload());

    const result = await flushOutbox(networkDown as unknown as typeof fetch);

    expect(result).toEqual({ sent: 0, dropped: 0, remaining: 1 });
    expect(await countQueued()).toBe(1);
  });

  it('does not burn retry budget on network failures', async () => {
    // A parent offline for a week must not have their entry deleted by the
    // retry cap — only real server rejections count as attempts.
    await queueEntry(payload());

    for (let i = 0; i < MAX_ATTEMPTS + 3; i += 1) {
      await flushOutbox(networkDown as unknown as typeof fetch);
    }

    expect(await countQueued()).toBe(1);
    const [record] = await listQueued();
    expect(record.attempts).toBe(0);
  });

  it('drops an entry the server permanently rejects', async () => {
    await queueEntry(payload());

    const result = await flushOutbox(status(400) as unknown as typeof fetch);

    expect(result).toEqual({ sent: 0, dropped: 1, remaining: 0 });
    expect(await countQueued()).toBe(0);
  });

  it.each([408, 429, 500, 503])('retries a %i rather than dropping it', async (code) => {
    await queueEntry(payload());

    const result = await flushOutbox(status(code) as unknown as typeof fetch);

    expect(result).toEqual({ sent: 0, dropped: 0, remaining: 1 });
    expect(await countQueued()).toBe(1);
  });

  it('gives up after MAX_ATTEMPTS server errors so the queue drains', async () => {
    await queueEntry(payload());

    for (let i = 0; i < MAX_ATTEMPTS - 1; i += 1) {
      await flushOutbox(status(500) as unknown as typeof fetch);
      expect(await countQueued()).toBe(1);
    }

    const final = await flushOutbox(status(500) as unknown as typeof fetch);
    expect(final.dropped).toBe(1);
    expect(await countQueued()).toBe(0);
  });

  it('coalesces concurrent flushes so an entry is never posted twice', async () => {
    // Reconnect fires `online` and visibilitychange together; without the
    // in-flight guard both would replay the same record.
    await queueEntry(payload());

    let calls = 0;
    const slow = vi.fn(async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return ok();
    });

    const [a, b] = await Promise.all([
      flushOutbox(slow as unknown as typeof fetch),
      flushOutbox(slow as unknown as typeof fetch),
    ]);

    expect(calls).toBe(1);
    expect(a).toBe(b);
    expect(await countQueued()).toBe(0);
  });

  it('flushes again for entries queued after a previous flush settled', async () => {
    // Regression: an earlier implementation cleared the in-flight guard in a
    // trailing .finally(), leaving a microtask window where the next call
    // returned the *previous* run's result instead of sending the new entry.
    await queueEntry(payload({ title: 'First' }));

    const fetchImpl = vi.fn(ok);
    const first = await flushOutbox(fetchImpl as unknown as typeof fetch);
    expect(first.sent).toBe(1);

    await queueEntry(payload({ title: 'Second' }));
    const second = await flushOutbox(fetchImpl as unknown as typeof fetch);

    expect(second.sent).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(await countQueued()).toBe(0);
  });

  it('is a no-op on an empty queue', async () => {
    const fetchImpl = vi.fn(ok);
    const result = await flushOutbox(fetchImpl as unknown as typeof fetch);

    expect(result).toEqual({ sent: 0, dropped: 0, remaining: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends the good entries in a batch even when one is rejected', async () => {
    await queueEntry(payload({ title: 'Good' }));
    await new Promise((r) => setTimeout(r, 5));
    await queueEntry(payload({ title: 'Bad' }));

    const fetchImpl = vi.fn((_url: string, init: RequestInit) =>
      JSON.parse(init.body as string).title === 'Bad' ? status(400)() : ok(),
    );

    const result = await flushOutbox(fetchImpl as unknown as typeof fetch);

    expect(result).toEqual({ sent: 1, dropped: 1, remaining: 0 });
    expect(await countQueued()).toBe(0);
  });
});
