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

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { width, height } = computeTargetDimensions(bitmap.width, bitmap.height, maxEdge);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob) return file;

    // Already-small images can round-trip larger — keep the smaller original.
    if (blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^./\\]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file;
  }
}
