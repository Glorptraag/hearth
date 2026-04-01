'use client';

// Offline queue: stores failed API mutations and retries them on reconnect.
// Only queues POST/PATCH/DELETE — never GET requests.

const QUEUE_KEY = 'hearth_offline_queue';
const MAX_QUEUE_SIZE = 50;
const MAX_RETRIES = 3;

export interface QueuedRequest {
  id: string;
  method: 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  url: string;
  body: unknown;
  headers?: Record<string, string>;
  enqueuedAt: number;
  retryCount: number;
}

function readQueue(): QueuedRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full — drop oldest entry and retry
    const trimmed = queue.slice(-Math.floor(MAX_QUEUE_SIZE / 2));
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed)); } catch { /* ignore */ }
  }
}

export function enqueueRequest(
  method: QueuedRequest['method'],
  url: string,
  body: unknown,
  headers?: Record<string, string>,
): void {
  const queue = readQueue();
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift(); // drop oldest
  }
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    method,
    url,
    body,
    headers,
    enqueuedAt: Date.now(),
    retryCount: 0,
  });
  writeQueue(queue);
}

export function getQueueLength(): number {
  return readQueue().length;
}

export function clearQueue(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(QUEUE_KEY);
  }
}

async function processQueue(): Promise<void> {
  const queue = readQueue();
  if (queue.length === 0) return;

  const remaining: QueuedRequest[] = [];

  for (const req of queue) {
    if (req.retryCount >= MAX_RETRIES) {
      // Drop permanently — too many failures
      console.warn('[offline-queue] dropping request after max retries:', req.url);
      continue;
    }
    try {
      const res = await fetch(req.url, {
        method: req.method,
        headers: { 'Content-Type': 'application/json', ...req.headers },
        body: JSON.stringify(req.body),
      });
      if (!res.ok && res.status >= 500) {
        // Server error — keep in queue for retry
        remaining.push({ ...req, retryCount: req.retryCount + 1 });
      }
      // 4xx errors are permanent failures — drop them
    } catch {
      // Network error — keep for retry
      remaining.push({ ...req, retryCount: req.retryCount + 1 });
    }
  }

  writeQueue(remaining);
}

// Wrapped fetch that auto-queues on network failure
export async function fetchWithQueue(
  url: string,
  options: RequestInit & { method: QueuedRequest['method'] },
): Promise<Response | null> {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    // Network failure — queue the request
    if (options.method !== undefined) {
      enqueueRequest(
        options.method,
        url,
        options.body ? JSON.parse(options.body as string) : undefined,
        options.headers as Record<string, string> | undefined,
      );
    }
    console.info('[offline-queue] queued request for retry:', url);
    return null;
  }
}

// Initialize the online listener once (client-side only)
let initialized = false;

export function initOfflineQueue(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  window.addEventListener('online', () => {
    console.info('[offline-queue] back online — processing queue');
    processQueue();
  });

  // Also process on init if we're already online and have queued items
  if (navigator.onLine && readQueue().length > 0) {
    processQueue();
  }
}
