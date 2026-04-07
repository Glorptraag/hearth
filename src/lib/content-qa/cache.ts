const SWR_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > SWR_TTL) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, timestamp: Date.now() });
}

export function bustCache(packId?: string): void {
  if (packId) {
    for (const key of store.keys()) {
      if (key.includes(packId) || key === 'qa:packs') {
        store.delete(key);
      }
    }
  } else {
    store.clear();
  }
}
