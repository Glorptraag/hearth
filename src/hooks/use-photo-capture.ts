'use client';

import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { prepareCapturePhoto } from '@/lib/images/capture-prep';
import type { DraftEvidenceItem } from '@/lib/logger/draft';
import { uploadFailureFor, type PhotoUploadFailure } from '@/lib/logger/photo-capture';
import { noticeCopy } from '@/app/(auth)/log/_components/noticeCopy';

const FAILURE_COPY: Record<PhotoUploadFailure, string> = {
  'too-large': noticeCopy.photoTooLarge,
  'rate-limited': noticeCopy.rateLimited,
  unavailable: noticeCopy.photoUnavailable,
  failed: noticeCopy.photoFailed,
};

export type UsePhotoCaptureArgs = {
  /** The uploaded photo, plus its EXIF capture time (zone-less ISO) when it had one. */
  onAdded: (item: DraftEvidenceItem, takenAt: string | null) => void;
  onError: (message: string) => void;
};

export type UsePhotoCaptureReturn = {
  /** Attach to a hidden `<input type="file" accept="image/*">`. */
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  /** Open the camera / library. Call inside a user gesture. */
  openPicker: () => void;
  uploading: boolean;
};

/**
 * Photo-first capture (W3.1). The picked photo goes through the W1.2 client
 * prep — 768 px long edge, re-encoded through a canvas so EXIF (GPS included)
 * is dropped, capture date kept separately — then up to the private evidence
 * store. Prep never falls back to the original file (that would leak GPS), so
 * an unreadable photo is refused with a plain message.
 */
export function usePhotoCapture({ onAdded, onError }: UsePhotoCaptureArgs): UsePhotoCaptureReturn {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const busyRef = useRef(false);

  const openPicker = useCallback(() => {
    if (busyRef.current) return;
    inputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset so picking the same photo again still fires a change.
      e.target.value = '';
      if (!file || busyRef.current) return;
      busyRef.current = true;
      setUploading(true);
      try {
        let prepared: Awaited<ReturnType<typeof prepareCapturePhoto>>;
        try {
          prepared = await prepareCapturePhoto(file);
        } catch {
          onError(noticeCopy.photoUnreadable);
          return;
        }

        const form = new FormData();
        form.append('file', new File([prepared.blob], 'photo.jpg', { type: 'image/jpeg' }));
        let res: Response;
        try {
          res = await fetch('/api/evidence/upload', { method: 'POST', body: form });
        } catch {
          onError(noticeCopy.photoFailed);
          return;
        }
        if (!res.ok) {
          onError(FAILURE_COPY[uploadFailureFor(res.status)]);
          return;
        }
        const body = (await res.json().catch(() => ({}))) as { pathname?: unknown };
        if (typeof body.pathname !== 'string' || !body.pathname) {
          onError(noticeCopy.photoFailed);
          return;
        }
        onAdded({ type: 'photo', content: body.pathname, caption: '' }, prepared.takenAt);
      } finally {
        busyRef.current = false;
        setUploading(false);
      }
    },
    [onAdded, onError],
  );

  return { inputRef, onFileChange, openPicker, uploading };
}
