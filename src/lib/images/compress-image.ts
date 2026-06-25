const DEFAULT_MAX_EDGE = 1920;
const DEFAULT_QUALITY = 0.8;

export interface CompressOptions {
  maxEdge?: number;
  quality?: number;
}

/**
 * Scale dimensions down so the longest edge is at most `maxEdge`, preserving
 * aspect ratio. Never enlarges. Pure — unit-tested.
 */
export function computeTargetDimensions(
  width: number,
  height: number,
  maxEdge: number
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** A decoded image ready to draw to a canvas, plus a cleanup hook. */
interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

/**
 * Decode a File to something drawable, trying the fastest path first and falling
 * back for older/locked-down browsers:
 *   1. `createImageBitmap(file, { imageOrientation })` — fast, but the options
 *      dictionary THROWS on iOS Safari < 17, which is why a bare iPad upload
 *      previously fell through to the original (uncompressed, often >4.5 MB) file.
 *   2. `createImageBitmap(file)` — no options dict (older Safari).
 *   3. `<img>` + object URL — Safari decodes HEIC/HEIF natively here, so this is
 *      the reliable iOS path.
 * Returns null when nothing can decode it (e.g. desktop Chrome + HEIC).
 */
async function decodeImage(file: File): Promise<DecodedImage | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() };
    } catch {
      try {
        const bitmap = await createImageBitmap(file);
        return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() };
      } catch {
        /* fall through to the <img> path */
      }
    }
  }

  if (typeof document !== 'undefined' && typeof URL?.createObjectURL === 'function') {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        // A decode that fires neither onload nor onerror would hang the upload —
        // time it out so we fall back to the original file + server path instead.
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
 * Downscale + re-encode an image to JPEG in the browser before upload. Keeps
 * the payload well under Vercel's 4.5 MB function-body limit and converts HEIC/
 * HEIF (which iOS decodes natively) to a universally renderable JPEG.
 *
 * Defensive by design: any failure (browser can't decode the source — e.g.
 * desktop Chrome + HEIC — or canvas is unavailable) returns the original file
 * untouched, so the server path and friendly toast still apply.
 */
export async function compressImageFile(
  file: File,
  { maxEdge = DEFAULT_MAX_EDGE, quality = DEFAULT_QUALITY }: CompressOptions = {}
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif') return file; // may be animated — leave alone

  const decoded = await decodeImage(file);
  if (!decoded) return file;

  try {
    const { width, height } = computeTargetDimensions(decoded.width, decoded.height, maxEdge);
    if (!width || !height) return file; // undecodable dimensions

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(decoded.source, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob) return file;

    // HEIC/HEIF must always become JPEG (cross-browser rendering + the server's
    // sharp build may lack libheif), even on the rare case the JPEG is larger.
    // For everything else, an already-small image can round-trip larger — keep
    // the smaller original then.
    const isHeic = /hei[cf]/i.test(file.type);
    if (!isHeic && blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^./\\]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file;
  } finally {
    decoded.cleanup();
  }
}
