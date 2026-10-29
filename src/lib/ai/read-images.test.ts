/**
 * Photo Read image loading: the family-prefix ACL, header measurement and the
 * per-image budget. A photo that can't be authorised, measured or afforded is
 * skipped — never sent.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from '@vercel/blob';
import { loadReadImage, loadReadImages, readImageSize, toReadImage } from './read-images';
import { bytesStream, fakeJpeg, fakePng } from '@/test/image-bytes';

const FAMILY = '11111111-1111-4111-8111-111111111111';
const REF = `evidence/${FAMILY}/photo-1.jpg`;

function blobResult(bytes: Uint8Array) {
  return {
    statusCode: 200,
    stream: bytesStream(bytes),
    blob: { contentType: 'image/jpeg', size: bytes.byteLength },
  } as unknown as Awaited<ReturnType<typeof get>>;
}

beforeEach(() => {
  vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token');
  vi.mocked(get).mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('readImageSize', () => {
  it('reads JPEG and PNG sizes from the header', () => {
    expect(readImageSize(fakeJpeg(768, 576))).toEqual({ mediaType: 'image/jpeg', width: 768, height: 576 });
    expect(readImageSize(fakePng(640, 480))).toEqual({ mediaType: 'image/png', width: 640, height: 480 });
  });

  it('returns null for anything it cannot measure', () => {
    expect(readImageSize(new Uint8Array([1, 2, 3, 4]))).toBeNull();
    expect(readImageSize(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]))).toBeNull();
  });
});

describe('toReadImage', () => {
  it('base64-encodes an in-budget image with its estimate', () => {
    const img = toReadImage(fakeJpeg(768, 576));
    expect(img).toMatchObject({ mediaType: 'image/jpeg', width: 768, height: 576, estimatedTokens: 590 });
    expect(Buffer.from(img!.data, 'base64')).toEqual(Buffer.from(fakeJpeg(768, 576)));
  });

  it('skips an image over the token budget instead of sending it', () => {
    expect(toReadImage(fakeJpeg(2000, 1500))).toBeNull();
  });
});

describe('loadReadImage', () => {
  it('fetches a private blob under the family prefix', async () => {
    vi.mocked(get).mockResolvedValueOnce(blobResult(fakeJpeg(768, 512)));
    const img = await loadReadImage(REF, FAMILY);
    expect(img?.width).toBe(768);
    expect(get).toHaveBeenCalledWith(REF, { access: 'private' });
  });

  it('never fetches another family’s blob, a traversal or a legacy URL', async () => {
    expect(await loadReadImage(`evidence/someone-else/p.jpg`, FAMILY)).toBeNull();
    expect(await loadReadImage(`evidence/${FAMILY}/../x.jpg`, FAMILY)).toBeNull();
    expect(await loadReadImage(`https://public.blob/${FAMILY}/p.jpg`, FAMILY)).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  it('returns null when blob storage is unconfigured', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    expect(await loadReadImage(REF, FAMILY)).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  it('falls back to public access, and returns null when neither finds it', async () => {
    vi.mocked(get).mockResolvedValueOnce(null).mockResolvedValueOnce(blobResult(fakeJpeg(600, 400)));
    expect((await loadReadImage(REF, FAMILY))?.height).toBe(400);
    expect(get).toHaveBeenLastCalledWith(REF, { access: 'public' });

    vi.mocked(get).mockReset();
    vi.mocked(get).mockRejectedValue(new Error('boom'));
    expect(await loadReadImage(REF, FAMILY)).toBeNull();
  });
});

describe('loadReadImages', () => {
  it('sends at most one image, skipping unreadable ones in capture order', async () => {
    vi.mocked(get)
      .mockResolvedValueOnce(blobResult(new Uint8Array([9, 9, 9, 9]))) // private: unreadable bytes
      .mockResolvedValueOnce(blobResult(fakeJpeg(700, 500))) // second ref
      .mockResolvedValueOnce(blobResult(fakeJpeg(600, 400))); // never reached
    const imgs = await loadReadImages([REF, `evidence/${FAMILY}/photo-2.jpg`, `evidence/${FAMILY}/photo-3.jpg`], FAMILY);
    expect(imgs).toHaveLength(1);
    expect(imgs[0].width).toBe(700);
  });
});
