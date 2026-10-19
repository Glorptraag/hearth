import { computeTargetDimensions } from './compress-image';

export const CAPTURE_MAX_EDGE = 768;
export const CAPTURE_JPEG_QUALITY = 0.8;

// EXIF lives in the first APP1 segment, which sits near the start of the file.
const EXIF_SCAN_BYTES = 256 * 1024;

export interface PreparedCapture {
  /** JPEG re-encoded through a canvas: no EXIF, so no GPS. */
  blob: Blob;
  /** Original EXIF DateTimeOriginal as a zone-less ISO string (YYYY-MM-DDTHH:MM:SS), or null. */
  takenAt: string | null;
  width: number;
  height: number;
}

export class CapturePrepError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CapturePrepError';
  }
}

/** Longest edge capped at `maxEdge`, never enlarged. Pure. */
export function computeCaptureDimensions(
  width: number,
  height: number,
  maxEdge: number = CAPTURE_MAX_EDGE
): { width: number; height: number } {
  return computeTargetDimensions(width, height, maxEdge);
}

/** "2024:03:09 14:05:33" -> "2024-03-09T14:05:33". Null when malformed. Pure. */
export function exifDateToIso(raw: string): string | null {
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const month = Number(mo);
  const day = Number(d);
  if (Number(y) < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (Number(h) > 23 || Number(mi) > 59 || Number(s) > 59) return null;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}

const TAG_EXIF_IFD_POINTER = 0x8769;
const TAG_DATE_TIME_ORIGINAL = 0x9003;
const TYPE_ASCII = 2;

function findTag(view: DataView, tiffStart: number, ifdOffset: number, tag: number, little: boolean): number | null {
  const ifd = tiffStart + ifdOffset;
  const count = view.getUint16(ifd, little);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (view.getUint16(entry, little) === tag) return entry;
  }
  return null;
}

/**
 * Minimal, dependency-free read of EXIF DateTimeOriginal from JPEG bytes.
 * Returns a zone-less ISO string or null (not a JPEG, no EXIF, no tag, or
 * malformed/truncated data). Never throws. Pure.
 */
export function parseExifDateTimeOriginal(buffer: ArrayBuffer): string | null {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xff) return null;
      const marker = view.getUint8(offset + 1);
      if (marker === 0xff) {
        offset += 1;
        continue;
      }
      if (marker === 0xda || marker === 0xd9) return null;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
        offset += 2;
        continue;
      }
      const length = view.getUint16(offset + 2);
      if (length < 2) return null;

      const isExif =
        marker === 0xe1 &&
        offset + 10 <= view.byteLength &&
        view.getUint32(offset + 4) === 0x45786966 && // "Exif"
        view.getUint16(offset + 8) === 0;
      if (isExif) return readTiffDate(view, offset + 10);

      offset += 2 + length;
    }
    return null;
  } catch {
    return null;
  }
}

function readTiffDate(view: DataView, tiffStart: number): string | null {
  const order = view.getUint16(tiffStart);
  if (order !== 0x4949 && order !== 0x4d4d) return null;
  const little = order === 0x4949;
  if (view.getUint16(tiffStart + 2, little) !== 42) return null;

  const ifd0 = view.getUint32(tiffStart + 4, little);
  const pointer = findTag(view, tiffStart, ifd0, TAG_EXIF_IFD_POINTER, little);
  if (pointer === null) return null;

  const exifIfd = view.getUint32(pointer + 8, little);
  const entry = findTag(view, tiffStart, exifIfd, TAG_DATE_TIME_ORIGINAL, little);
  if (entry === null) return null;
  if (view.getUint16(entry + 2, little) !== TYPE_ASCII) return null;

  const count = view.getUint32(entry + 4, little);
  if (count < 19) return null;
  const valueStart = count > 4 ? tiffStart + view.getUint32(entry + 8, little) : entry + 8;

  let raw = '';
  for (let i = 0; i < 19; i++) raw += String.fromCharCode(view.getUint8(valueStart + i));
  return exifDateToIso(raw);
}

function readBytes(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

async function decode(blob: Blob): Promise<Decoded | null> {
  if (typeof createImageBitmap === 'function') {
    for (const opts of [{ imageOrientation: 'from-image' as const }, undefined]) {
      try {
        const bitmap = opts ? await createImageBitmap(blob, opts) : await createImageBitmap(blob);
        return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() };
      } catch {
        /* try the next path */
      }
    }
  }

  if (typeof document !== 'undefined' && typeof URL?.createObjectURL === 'function') {
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        const timer = setTimeout(() => reject(new Error('image decode timed out')), 15000);
        el.onload = () => {
          clearTimeout(timer);
          resolve(el);
        };
        el.onerror = () => {
          clearTimeout(timer);
          reject(new Error('image decode failed'));
        };
        el.src = url;
      });
      return {
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        cleanup: () => URL.revokeObjectURL(url),
      };
    } catch {
      URL.revokeObjectURL(url);
    }
  }
  return null;
}

/**
 * Prepare a captured photo for upload: downscale to 768px long edge and
 * re-encode as JPEG through a canvas (which drops all EXIF, GPS included),
 * returning the original DateTimeOriginal separately.
 *
 * Unlike compressImageFile this never falls back to the original file — doing
 * so would leak GPS — so it throws CapturePrepError when the image cannot be
 * decoded or encoded.
 */
export async function prepareCapturePhoto(
  input: Blob,
  { maxEdge = CAPTURE_MAX_EDGE, quality = CAPTURE_JPEG_QUALITY }: { maxEdge?: number; quality?: number } = {}
): Promise<PreparedCapture> {
  let takenAt: string | null = null;
  try {
    takenAt = parseExifDateTimeOriginal(await readBytes(input.slice(0, EXIF_SCAN_BYTES)));
  } catch {
    takenAt = null;
  }

  const decoded = await decode(input);
  if (!decoded) throw new CapturePrepError('This photo could not be read.');

  try {
    const { width, height } = computeCaptureDimensions(decoded.width, decoded.height, maxEdge);
    if (!width || !height) throw new CapturePrepError('This photo has no readable size.');

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new CapturePrepError('This browser cannot process photos.');
    ctx.drawImage(decoded.source, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new CapturePrepError('This photo could not be prepared.');

    return { blob, takenAt, width, height };
  } finally {
    decoded.cleanup();
  }
}
