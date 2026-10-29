// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { get } from '@vercel/blob';
import { loadEvidenceImage, sniffImageFormat, MAX_EVIDENCE_IMAGE_BYTES } from './evidence-images';

const FAMILY = 'fam-1';
const PNG = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAEElEQVR4nGP438AARAwoFABkUAj7XH75jwAAAABJRU5ErkJggg==',
    'base64',
  ),
);
const JPEG_HEAD = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const WEBP_HEAD = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
// HEIC: `....ftypheic`
const HEIC_HEAD = Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);

function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

function blobResult(bytes: Uint8Array, size = bytes.byteLength) {
  return {
    statusCode: 200,
    stream: streamOf(bytes),
    blob: { contentType: 'image/png', size },
  } as unknown as Awaited<ReturnType<typeof get>>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sniffImageFormat', () => {
  it('reads JPEG, PNG and WEBP from magic bytes', () => {
    expect(sniffImageFormat(JPEG_HEAD)).toBe('JPEG');
    expect(sniffImageFormat(PNG)).toBe('PNG');
    expect(sniffImageFormat(WEBP_HEAD)).toBe('WEBP');
  });

  it('returns null for anything jsPDF cannot embed', () => {
    expect(sniffImageFormat(HEIC_HEAD)).toBeNull();
    expect(sniffImageFormat(new Uint8Array())).toBeNull();
  });
});

describe('loadEvidenceImage', () => {
  it('reads a private blob under the family prefix', async () => {
    vi.mocked(get).mockResolvedValueOnce(blobResult(PNG));
    const img = await loadEvidenceImage(`evidence/${FAMILY}/a.png`, FAMILY);
    expect(img?.format).toBe('PNG');
    expect(img?.data).toEqual(PNG);
    expect(get).toHaveBeenCalledWith(`evidence/${FAMILY}/a.png`, { access: 'private' });
  });

  it('falls back to public access for a legacy blob', async () => {
    vi.mocked(get).mockResolvedValueOnce(null as never).mockResolvedValueOnce(blobResult(PNG));
    const img = await loadEvidenceImage(`evidence/${FAMILY}/a.png`, FAMILY);
    expect(img?.format).toBe('PNG');
    expect(get).toHaveBeenLastCalledWith(`evidence/${FAMILY}/a.png`, { access: 'public' });
  });

  it("refuses another family's photo without reading it", async () => {
    const img = await loadEvidenceImage('evidence/other-family/a.png', FAMILY);
    expect(img).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  it('refuses a traversal pathname', async () => {
    expect(await loadEvidenceImage(`evidence/${FAMILY}/../x/a.png`, FAMILY)).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  it('returns null for an unsupported format (HEIC)', async () => {
    vi.mocked(get).mockResolvedValueOnce(blobResult(HEIC_HEAD));
    expect(await loadEvidenceImage(`evidence/${FAMILY}/a.heic`, FAMILY)).toBeNull();
  });

  it('returns null for an oversized photo', async () => {
    vi.mocked(get).mockResolvedValueOnce(blobResult(PNG, MAX_EVIDENCE_IMAGE_BYTES + 1));
    expect(await loadEvidenceImage(`evidence/${FAMILY}/big.png`, FAMILY)).toBeNull();
  });

  it('returns null when the blob read throws', async () => {
    vi.mocked(get).mockRejectedValue(new Error('boom'));
    expect(await loadEvidenceImage(`evidence/${FAMILY}/a.png`, FAMILY)).toBeNull();
    vi.mocked(get).mockReset();
  });

  it('never fetches a legacy URL outside Vercel Blob storage', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await loadEvidenceImage('https://example.com/a.png', FAMILY)).toBeNull();
    expect(await loadEvidenceImage('http://abc.public.blob.vercel-storage.com/a.png', FAMILY)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches a legacy public Vercel Blob URL', async () => {
    const fetchSpy = vi.fn(async () => new Response(PNG, { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    const img = await loadEvidenceImage('https://abc.public.blob.vercel-storage.com/evidence/a.png', FAMILY);
    expect(img?.format).toBe('PNG');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
