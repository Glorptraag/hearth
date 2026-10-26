/**
 * Photo-first capture helpers (launch pivot W3.1). Pure; client-safe.
 *
 * The photo itself is prepared by `prepareCapturePhoto` (W1.2: 768 px long
 * edge, re-encoded so GPS is gone, EXIF DateTimeOriginal kept separately). Its
 * date becomes the moment's date only when the parent hasn't picked one —
 * retrospective logging means a camera-roll photo from Tuesday is a Tuesday
 * moment, but a date the parent chose always wins.
 */
import { format, isValid, parseISO } from 'date-fns';
import { todayIso } from './notice';

/**
 * The `dateOccurred` a photo implies, or null to leave the form alone.
 * - The parent already chose a date (non-null) → null.
 * - No EXIF date, unparsable, today or in the future → null (null already means today).
 */
export function photoDateDefault(takenAt: string | null, currentDate: string | null, now: Date): string | null {
  if (currentDate !== null || !takenAt) return null;
  const d = parseISO(takenAt);
  if (!isValid(d)) return null;
  const day = format(d, 'yyyy-MM-dd');
  const today = todayIso(now);
  return day < today ? day : null;
}

export type PhotoUploadFailure = 'too-large' | 'rate-limited' | 'unavailable' | 'failed';

/** Map an upload response status onto the parent-facing failure kind. */
export function uploadFailureFor(status: number): PhotoUploadFailure {
  if (status === 413) return 'too-large';
  if (status === 429) return 'rate-limited';
  if (status === 503) return 'unavailable';
  return 'failed';
}
