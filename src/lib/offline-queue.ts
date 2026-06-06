'use client';

// Offline queue: stores failed API mutations and retries them on reconnect.
// Only queues POST/PATCH/DELETE — never GET requests.
//
// 2.7 extension: separate file-upload queue for photo/audio captures. Blobs
// can't go through the JSON queue above, so they get their own in-memory
// storage plus a localStorage manifest so the UI can show a pending-uploads
// indicator across navigations. Reload before reconnect loses the Blob —
// acceptable for the pilot; IndexedDB persistence is a documented follow-up.

const QUEUE_KEY = 'hearth_offline_queue';
const FILE_MANIFEST_KEY = 'hearth_offline_file_uploads';
const MAX_QUEUE_SIZE = 50;
const MAX_RETRIES = 3;
const MAX_FILE_QUEUE_SIZE = 20;

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
  } catch {
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

// ──────────────────────────────────────────────────────────────────────────
// 2.7 — File upload queue (photo + audio captures)
// ──────────────────────────────────────────────────────────────────────────

export type LocalCaptureId = string; // shape: `local://<random>`

export interface PendingFileUpload {
  localId: LocalCaptureId;
  uploadUrl: string;
  kind: 'photo' | 'audio';
  enqueuedAt: number;
  retryCount: number;
  metadata?: Record<string, unknown>;
}

export interface UploadResolvedEvent {
  localId: LocalCaptureId;
  remoteUrl: string;
  kind: 'photo' | 'audio';
  /** Extra metadata returned by the upload endpoint (e.g. dimensions). */
  remoteMetadata?: Record<string, unknown>;
}

// In-memory store for the Blob bodies. Lost on reload — the localStorage
// manifest below survives so the UI can show "X uploads pending" but they
// can't be retried after a reload until the manifest is purged.
const fileBlobs = new Map<LocalCaptureId, Blob>();
const fileMeta = new Map<LocalCaptureId, PendingFileUpload>();
const previewUrls = new Map<LocalCaptureId, string>();

type ResolveListener = (event: UploadResolvedEvent) => void;
const listeners = new Set<ResolveListener>();

function readManifest(): PendingFileUpload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FILE_MANIFEST_KEY);
    return raw ? (JSON.parse(raw) as PendingFileUpload[]) : [];
  } catch {
    return [];
  }
}

function writeManifest(manifest: PendingFileUpload[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FILE_MANIFEST_KEY, JSON.stringify(manifest));
  } catch {
    // Storage full — drop oldest half.
    try {
      localStorage.setItem(
        FILE_MANIFEST_KEY,
        JSON.stringify(manifest.slice(-Math.floor(MAX_FILE_QUEUE_SIZE / 2))),
      );
    } catch {
      /* ignore */
    }
  }
}

/**
 * Enqueue a Blob/File for retry. Returns a `{ localId, previewUrl }` pair so
 * the caller can show an immediate preview using URL.createObjectURL while
 * the upload waits for connectivity. Caller stores `localId` as the
 * placeholder content of the capture item; once the upload resolves, the
 * subscriber callback can swap it for the remote URL.
 */
export function enqueueFileUpload(
  file: File | Blob,
  uploadUrl: string,
  kind: 'photo' | 'audio',
  metadata?: Record<string, unknown>,
): { localId: LocalCaptureId; previewUrl: string } {
  const localId: LocalCaptureId = `local://${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const previewUrl = URL.createObjectURL(file);

  const manifest = readManifest();
  if (manifest.length >= MAX_FILE_QUEUE_SIZE) {
    const dropped = manifest.shift();
    if (dropped) cleanupLocal(dropped.localId);
  }
  const entry: PendingFileUpload = {
    localId,
    uploadUrl,
    kind,
    enqueuedAt: Date.now(),
    retryCount: 0,
    metadata,
  };
  manifest.push(entry);
  writeManifest(manifest);

  fileBlobs.set(localId, file);
  fileMeta.set(localId, entry);
  previewUrls.set(localId, previewUrl);

  return { localId, previewUrl };
}

/** Cleanup all in-memory and manifest state for one localId. */
function cleanupLocal(localId: LocalCaptureId): void {
  const url = previewUrls.get(localId);
  if (url) {
    URL.revokeObjectURL(url);
    previewUrls.delete(localId);
  }
  fileBlobs.delete(localId);
  fileMeta.delete(localId);
}

export function getPendingUploadCount(): number {
  return readManifest().length;
}

export function getPendingUploads(): PendingFileUpload[] {
  return readManifest();
}

/** Get the local object-URL preview for a queued localId, if still in memory. */
export function getLocalPreviewUrl(localId: LocalCaptureId): string | null {
  return previewUrls.get(localId) ?? null;
}

/**
 * Subscribe to upload-resolved events. Returns an unsubscribe function.
 * Callbacks fire once per resolved upload; the listener is responsible for
 * patching whatever client state references the localId (form draft, saved
 * entry's evidence row via PATCH /api/evidence/:id, etc.).
 */
export function onUploadResolved(listener: ResolveListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Drain the file-upload queue. POSTs each pending Blob to its target URL,
 * fires resolve events, and removes the entry from the manifest.
 * No-ops for entries whose Blob is missing (e.g. lost on reload).
 */
export async function processFileUploadQueue(): Promise<void> {
  const manifest = readManifest();
  if (manifest.length === 0) return;

  const remaining: PendingFileUpload[] = [];

  for (const entry of manifest) {
    const blob = fileBlobs.get(entry.localId);
    if (!blob) {
      // Lost on reload — drop the manifest entry; UI may show a "needs retry"
      // hint, but we can't reupload a Blob we no longer have.
      console.warn('[file-queue] dropping pending upload (blob lost):', entry.localId);
      continue;
    }
    if (entry.retryCount >= MAX_RETRIES) {
      console.warn('[file-queue] dropping after max retries:', entry.localId);
      cleanupLocal(entry.localId);
      continue;
    }

    try {
      const form = new FormData();
      const ext = entry.kind === 'audio'
        ? (blob.type.includes('webm') ? 'webm' : 'm4a')
        : (blob.type.includes('png') ? 'png' : 'jpg');
      form.append('file', new File([blob], `pending.${ext}`, { type: blob.type }));
      const res = await fetch(entry.uploadUrl, { method: 'POST', body: form });
      if (!res.ok) {
        // 4xx is permanent (size, content-type). 5xx is transient.
        if (res.status >= 500) {
          remaining.push({ ...entry, retryCount: entry.retryCount + 1 });
        } else {
          console.warn('[file-queue] dropping after 4xx:', entry.localId, res.status);
          cleanupLocal(entry.localId);
        }
        continue;
      }
      // Private-blob model (#153): upload routes return a pathname (served via
      // the authenticated read proxy), not a public URL. `remoteUrl` on the
      // resolved event carries this ref; listeners display it via evidenceSrc().
      const data = (await res.json().catch(() => ({}))) as {
        pathname?: string;
        durationMs?: number;
        mimeType?: string;
      };
      if (!data.pathname) {
        remaining.push({ ...entry, retryCount: entry.retryCount + 1 });
        continue;
      }
      const event: UploadResolvedEvent = {
        localId: entry.localId,
        remoteUrl: data.pathname,
        kind: entry.kind,
        remoteMetadata: data.durationMs != null ? { durationMs: data.durationMs, mimeType: data.mimeType } : undefined,
      };
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.warn('[file-queue] listener threw:', e);
        }
      }
      cleanupLocal(entry.localId);
    } catch {
      remaining.push({ ...entry, retryCount: entry.retryCount + 1 });
    }
  }

  writeManifest(remaining);
}

// Initialize the online listener once (client-side only)
let initialized = false;

export function initOfflineQueue(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  window.addEventListener('online', () => {
    console.info('[offline-queue] back online — processing queues');
    void processQueue();
    void processFileUploadQueue();
  });

  // Also process on init if we're already online and have queued items
  if (navigator.onLine && readQueue().length > 0) {
    void processQueue();
  }
  if (navigator.onLine && readManifest().length > 0) {
    void processFileUploadQueue();
  }
}
