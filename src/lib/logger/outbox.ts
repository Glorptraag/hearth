/**
 * Offline outbox for completed Logger entries.
 *
 * The Logger already survives a refresh via `use-logger-draft` (localStorage +
 * a Postgres mirror), but a *save* attempted with no connection simply failed.
 * This queues that save durably and replays it on reconnect, so "log it now,
 * it'll sync later" is true rather than aspirational — the promise the offline
 * screen makes to the parent. See docs/hearth-native-app-plan-v1.md.
 *
 * SCOPE: entries whose evidence is text (quote / note / link) or none. Photo
 * evidence uploads to Blob storage at evidence-add time and the payload only
 * ever carries the returned pathname, so an offline photo cannot be queued
 * without reshaping the evidence dual-write. Deliberately out of scope here.
 *
 * IndexedDB rather than localStorage: entries are structured, can be numerous,
 * and localStorage is already carrying the in-progress draft.
 */

import type { EntrySavePayload } from './entry-payload';

const DB_NAME = 'hearth-logger';
const DB_VERSION = 1;
const STORE = 'outbox';

/** Give up on an entry that has failed this many times, so the queue drains. */
export const MAX_ATTEMPTS = 5;

export interface OutboxRecord {
  id: string;
  payload: EntrySavePayload;
  queuedAt: number;
  attempts: number;
  lastError?: string;
}

export interface FlushResult {
  sent: number;
  /** Permanently rejected — dropped from the queue, never retried. */
  dropped: number;
  /** Still queued: transient failure, will be retried. */
  remaining: number;
}

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, mode);
    const result = await fn(tx.objectStore(STORE));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return result;
  } finally {
    db.close();
  }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Queue a save for later delivery. Returns the record id. */
export async function queueEntry(payload: EntrySavePayload): Promise<string | null> {
  if (!hasIndexedDb()) return null;

  const record: OutboxRecord = {
    id: newId(),
    payload,
    queuedAt: Date.now(),
    attempts: 0,
  };

  try {
    await withStore('readwrite', async (store) => {
      await promisify(store.add(record));
    });
    return record.id;
  } catch {
    // A full or unavailable IndexedDB must not take the save path down with
    // it — the caller still surfaces its own failure toast.
    return null;
  }
}

export async function listQueued(): Promise<OutboxRecord[]> {
  if (!hasIndexedDb()) return [];
  try {
    return await withStore('readonly', (store) =>
      promisify(store.getAll() as IDBRequest<OutboxRecord[]>),
    );
  } catch {
    return [];
  }
}

export async function countQueued(): Promise<number> {
  if (!hasIndexedDb()) return 0;
  try {
    return await withStore('readonly', (store) => promisify(store.count()));
  } catch {
    return 0;
  }
}

export async function clearQueue(): Promise<void> {
  if (!hasIndexedDb()) return;
  try {
    await withStore('readwrite', async (store) => {
      await promisify(store.clear());
    });
  } catch {
    // best effort
  }
}

async function removeRecord(id: string): Promise<void> {
  await withStore('readwrite', async (store) => {
    await promisify(store.delete(id));
  });
}

async function updateRecord(record: OutboxRecord): Promise<void> {
  await withStore('readwrite', async (store) => {
    await promisify(store.put(record));
  });
}

/**
 * A 4xx means the server has judged this payload invalid; replaying it will
 * never succeed, so it is dropped rather than retried forever. 408 and 429 are
 * the exceptions — both are explicitly "try again".
 */
function isPermanentRejection(status: number): boolean {
  if (status === 408 || status === 429) return false;
  return status >= 400 && status < 500;
}

// Guards against a visibilitychange and an `online` event both firing a flush.
let flushInFlight: Promise<FlushResult> | null = null;

/**
 * Replay every queued entry against POST /api/entries.
 *
 * Concurrent calls share one run — reconnect commonly fires several triggers
 * at once, and without this the same entry would be posted twice.
 */
export function flushOutbox(fetchImpl: typeof fetch = fetch): Promise<FlushResult> {
  if (flushInFlight) return flushInFlight;

  flushInFlight = (async (): Promise<FlushResult> => {
    try {
      return await runFlush(fetchImpl);
    } finally {
      // Cleared inside the async function, so it is already null by the time
      // the returned promise settles for any awaiter. Clearing in a trailing
      // `.finally()` instead would leave a microtask window in which a fresh
      // call sees a settled promise and gets its stale result rather than
      // flushing entries queued since.
      flushInFlight = null;
    }
  })();

  return flushInFlight;
}

async function runFlush(fetchImpl: typeof fetch): Promise<FlushResult> {
  const records = await listQueued();
  let sent = 0;
  let dropped = 0;
  let remaining = 0;

  // Oldest first, so entries arrive in the order the parent wrote them.
  for (const record of [...records].sort((a, b) => a.queuedAt - b.queuedAt)) {
    try {
      const res = await fetchImpl('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record.payload),
      });

      if (res.ok) {
        await removeRecord(record.id);
        sent += 1;
        continue;
      }

      if (isPermanentRejection(res.status)) {
        await removeRecord(record.id);
        dropped += 1;
        continue;
      }

      const attempts = record.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await removeRecord(record.id);
        dropped += 1;
        continue;
      }
      await updateRecord({ ...record, attempts, lastError: `HTTP ${res.status}` });
      remaining += 1;
    } catch (err) {
      // Network failure — still offline. Do NOT count an attempt: otherwise a
      // week of being offline would silently burn through the retry budget
      // and delete the parent's entry.
      await updateRecord({
        ...record,
        lastError: err instanceof Error ? err.message : 'network error',
      });
      remaining += 1;
    }
  }

  return { sent, dropped, remaining };
}
