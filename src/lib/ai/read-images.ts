/**
 * Server-side image loading for Photo Read (launch pivot W1.4).
 *
 * Evidence photos are PRIVATE Vercel blobs. This mirrors the authed read proxy
 * (`GET /api/evidence`): the stored ref must be a pathname under the family's
 * own prefix (`authorizeEvidenceRef`), and the bytes are read with `get()` —
 * private first, then public for legacy stores. Legacy absolute URLs are never
 * fetched here: the path is the ACL, and a URL carries none.
 *
 * Every image is measured from its header before it is sent. An image whose
 * size cannot be read, or whose estimated cost exceeds the per-image budget,
 * is skipped rather than sent — the Read then stays empty, never guessed.
 */
import { get, type GetBlobResult } from '@vercel/blob';
import { authorizeEvidenceRef } from '@/lib/evidence';
import { PHOTO_READ_LIMITS, estimateImageTokens, imageWithinReadBudget } from './read-flags';

export type ReadImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp';

export type ReadImage = {
  mediaType: ReadImageMediaType;
  /** Base64 bytes, as the Messages API image block expects. */
  data: string;
  width: number;
  height: number;
  estimatedTokens: number;
};

export type ImageSize = { mediaType: ReadImageMediaType; width: number; height: number };

function u16be(b: Uint8Array, i: number): number {
  return (b[i] << 8) | b[i + 1];
}
function u32be(b: Uint8Array, i: number): number {
  return ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
}
function u16le(b: Uint8Array, i: number): number {
  return b[i] | (b[i + 1] << 8);
}
function u24le(b: Uint8Array, i: number): number {
  return b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
}

function jpegSize(b: Uint8Array): { width: number; height: number } | null {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    // Fill bytes and standalone markers carry no length.
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = u16be(b, i + 2);
    // SOF0–SOF15 except DHT (C4), JPG (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: u16be(b, i + 5), width: u16be(b, i + 7) };
    }
    if (len < 2) return null;
    i += 2 + len;
  }
  return null;
}

/**
 * Read an image's media type and pixel size from its header. Pure. Returns
 * null for anything that isn't a JPEG, PNG or WebP with a readable size.
 */
export function readImageSize(bytes: Uint8Array): ImageSize | null {
  const b = bytes;
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    const s = jpegSize(b);
    return s && s.width > 0 && s.height > 0 ? { mediaType: 'image/jpeg', ...s } : null;
  }
  if (
    b.length >= 24 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[12] === 0x49 && b[13] === 0x48 && b[14] === 0x44 && b[15] === 0x52
  ) {
    const width = u32be(b, 16);
    const height = u32be(b, 20);
    return width > 0 && height > 0 ? { mediaType: 'image/png', width, height } : null;
  }
  if (
    b.length >= 30 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    const chunk = String.fromCharCode(b[12], b[13], b[14], b[15]);
    let size: { width: number; height: number } | null = null;
    if (chunk === 'VP8 ') size = { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
    else if (chunk === 'VP8L') {
      const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      size = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    } else if (chunk === 'VP8X') size = { width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 };
    return size && size.width > 0 && size.height > 0 ? { mediaType: 'image/webp', ...size } : null;
  }
  return null;
}

/**
 * Turn raw bytes into a sendable Read image, or null when it is too large,
 * unmeasurable or over the token budget. Pure.
 */
export function toReadImage(bytes: Uint8Array): ReadImage | null {
  if (bytes.byteLength === 0 || bytes.byteLength > PHOTO_READ_LIMITS.maxImageBytes) return null;
  const size = readImageSize(bytes);
  if (!size) return null;
  if (!imageWithinReadBudget(size.width, size.height)) return null;
  return {
    mediaType: size.mediaType,
    data: Buffer.from(bytes).toString('base64'),
    width: size.width,
    height: size.height,
    estimatedTokens: estimateImageTokens(size.width, size.height),
  };
}

async function fetchBlob(pathname: string): Promise<GetBlobResult | null> {
  for (const access of ['private', 'public'] as const) {
    try {
      const blob = await get(pathname, { access });
      if (blob && blob.statusCode === 200 && blob.stream) return blob;
    } catch {
      // try the next access mode
    }
  }
  return null;
}

/**
 * Load one evidence photo for the Read, authorised against the owning family.
 * Never throws: any failure (foreign or malformed ref, storage unconfigured,
 * missing blob, unreadable or oversized image) returns null.
 */
export async function loadReadImage(ref: string, familyId: string): Promise<ReadImage | null> {
  const pathname = authorizeEvidenceRef(ref, familyId);
  if (!pathname) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const blob = await fetchBlob(pathname);
    if (!blob?.stream) return null;
    if (typeof blob.blob?.size === 'number' && blob.blob.size > PHOTO_READ_LIMITS.maxImageBytes) return null;
    const bytes = new Uint8Array(await new Response(blob.stream).arrayBuffer());
    return toReadImage(bytes);
  } catch {
    return null;
  }
}

/**
 * Load up to `PHOTO_READ_LIMITS.maxImages` photos, in the parent's capture
 * order, skipping any that can't be read.
 */
export async function loadReadImages(refs: readonly string[], familyId: string): Promise<ReadImage[]> {
  const out: ReadImage[] = [];
  for (const ref of refs) {
    if (out.length >= PHOTO_READ_LIMITS.maxImages) break;
    const img = await loadReadImage(ref, familyId);
    if (img) out.push(img);
  }
  return out;
}
