/**
 * Evidence photos for server-side PDF rendering (W5.1 annotated samples).
 *
 * Photos are children's photos stored as PRIVATE blobs. The browser reaches
 * them only through the authenticated `/api/evidence` proxy; the PDF is built
 * on the server, so it reads the blob directly with the same two checks the
 * proxy applies:
 *   1. the caller's family owns the pathname (`authorizeEvidenceRef`; the
 *      pathname is the ACL), and
 *   2. private access first, public as the legacy fallback.
 * Legacy rows that hold a full public blob URL are fetched only when the host
 * is Vercel Blob storage, so a stored ref can never make the server fetch an
 * arbitrary URL.
 *
 * Only JPEG, PNG and WEBP are embedded (what jsPDF reads). Anything else, an
 * oversized file, or any read failure returns null and the PDF says the photo
 * is kept in Hearth instead. Never throws.
 */
import { get } from '@vercel/blob';
import { authorizeEvidenceRef } from '@/lib/evidence';

export type PdfImageFormat = 'JPEG' | 'PNG' | 'WEBP';
export type PdfImage = { data: Uint8Array; format: PdfImageFormat };

/** Capture prep downscales to ~768px; anything far beyond this is not worth embedding. */
export const MAX_EVIDENCE_IMAGE_BYTES = 6 * 1024 * 1024;

const BLOB_HOST_RE = /\.blob\.vercel-storage\.com$/i;

/** Format from magic bytes, not the stored content type. */
export function sniffImageFormat(bytes: Uint8Array): PdfImageFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'JPEG';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return 'PNG';
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'WEBP';
  return null;
}

/** Drain a stream into bytes, giving up past the size cap. */
async function readCapped(stream: ReadableStream<Uint8Array>, cap: number): Promise<Uint8Array | null> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > cap) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

function toImage(bytes: Uint8Array | null): PdfImage | null {
  if (!bytes || bytes.byteLength === 0) return null;
  const format = sniffImageFormat(bytes);
  return format ? { data: bytes, format } : null;
}

async function readPrivateBlob(pathname: string): Promise<Uint8Array | null> {
  for (const access of ['private', 'public'] as const) {
    try {
      const blob = await get(pathname, { access });
      if (!blob || blob.statusCode !== 200 || !blob.stream) continue;
      if (typeof blob.blob?.size === 'number' && blob.blob.size > MAX_EVIDENCE_IMAGE_BYTES) return null;
      return await readCapped(blob.stream, MAX_EVIDENCE_IMAGE_BYTES);
    } catch {
      // Try the next access mode.
    }
  }
  return null;
}

async function readLegacyUrl(ref: string): Promise<Uint8Array | null> {
  let url: URL;
  try {
    url = new URL(ref);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !BLOB_HOST_RE.test(url.hostname)) return null;
  try {
    const res = await fetch(url, { redirect: 'error' });
    if (!res.ok || !res.body) return null;
    return await readCapped(res.body, MAX_EVIDENCE_IMAGE_BYTES);
  } catch {
    return null;
  }
}

/**
 * Load one evidence photo for embedding, or null. `familyId` is the signed-in
 * family: a pathname under any other family's prefix is refused.
 */
export async function loadEvidenceImage(ref: string, familyId: string): Promise<PdfImage | null> {
  if (!ref) return null;
  if (/^https?:\/\//i.test(ref)) return toImage(await readLegacyUrl(ref));
  const pathname = authorizeEvidenceRef(ref, familyId);
  if (!pathname) return null;
  return toImage(await readPrivateBlob(pathname));
}
