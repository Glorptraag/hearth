import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  CapturePrepError,
  computeCaptureDimensions,
  exifDateToIso,
  parseExifDateTimeOriginal,
  prepareCapturePhoto,
} from './capture-prep';

/** Build a minimal JPEG (SOI + APP0 + APP1/Exif + EOI) carrying DateTimeOriginal. */
function buildExifJpeg(date: string, little = true, tag = 0x9003): ArrayBuffer {
  const tiff = new DataView(new ArrayBuffer(8 + 2 + 12 + 4 + 2 + 12 + 4 + 20));
  const u16 = (o: number, v: number) => tiff.setUint16(o, v, little);
  const u32 = (o: number, v: number) => tiff.setUint32(o, v, little);

  tiff.setUint16(0, little ? 0x4949 : 0x4d4d);
  u16(2, 42);
  u32(4, 8);

  // IFD0 at 8: one entry -> Exif IFD pointer to offset 26
  u16(8, 1);
  u16(10, 0x8769);
  u16(12, 4);
  u32(14, 1);
  u32(18, 26);
  u32(22, 0);

  // Exif IFD at 26: one ASCII entry whose value lives at offset 44
  u16(26, 1);
  u16(28, tag);
  u16(30, 2);
  u32(32, 20);
  u32(36, 44);
  u32(40, 0);

  for (let i = 0; i < 19; i++) tiff.setUint8(44 + i, date.charCodeAt(i));
  tiff.setUint8(63, 0);

  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0, 0];
  const app1Len = 2 + exifHeader.length + tiff.byteLength;
  const bytes: number[] = [
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46, // APP0 (length 4, 2 payload bytes)
    0xff, 0xe1, app1Len >> 8, app1Len & 0xff,
    ...exifHeader,
    ...new Uint8Array(tiff.buffer),
    0xff, 0xd9,
  ];
  return new Uint8Array(bytes).buffer;
}

describe('computeCaptureDimensions', () => {
  it('downscales a landscape photo to a 768px long edge', () => {
    expect(computeCaptureDimensions(4032, 3024)).toEqual({ width: 768, height: 576 });
  });

  it('downscales a portrait photo by its height', () => {
    expect(computeCaptureDimensions(3024, 4032)).toEqual({ width: 576, height: 768 });
  });

  it('never enlarges a small photo', () => {
    expect(computeCaptureDimensions(640, 480)).toEqual({ width: 640, height: 480 });
  });
});

describe('exifDateToIso', () => {
  it('converts the EXIF format to a zone-less ISO string', () => {
    expect(exifDateToIso('2024:03:09 14:05:33')).toBe('2024-03-09T14:05:33');
  });

  it('rejects malformed and zeroed dates', () => {
    expect(exifDateToIso('')).toBeNull();
    expect(exifDateToIso('not a date at all!')).toBeNull();
    expect(exifDateToIso('0000:00:00 00:00:00')).toBeNull();
    expect(exifDateToIso('2024:13:09 14:05:33')).toBeNull();
    expect(exifDateToIso('2024:03:09 25:05:33')).toBeNull();
  });
});

describe('parseExifDateTimeOriginal', () => {
  it('reads little-endian EXIF', () => {
    expect(parseExifDateTimeOriginal(buildExifJpeg('2023:11:02 08:15:00', true))).toBe('2023-11-02T08:15:00');
  });

  it('reads big-endian EXIF', () => {
    expect(parseExifDateTimeOriginal(buildExifJpeg('2023:11:02 08:15:00', false))).toBe('2023-11-02T08:15:00');
  });

  it('returns null when the tag is not DateTimeOriginal', () => {
    expect(parseExifDateTimeOriginal(buildExifJpeg('2023:11:02 08:15:00', true, 0x9004))).toBeNull();
  });

  it('returns null for non-JPEG, empty and truncated input', () => {
    expect(parseExifDateTimeOriginal(new ArrayBuffer(0))).toBeNull();
    expect(parseExifDateTimeOriginal(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toBeNull();
    expect(parseExifDateTimeOriginal(buildExifJpeg('2023:11:02 08:15:00').slice(0, 40))).toBeNull();
  });

  it('returns null for a JPEG with no EXIF segment', () => {
    const bare = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46, 0xff, 0xd9]).buffer;
    expect(parseExifDateTimeOriginal(bare)).toBeNull();
  });
});

function stubCanvas(opts: { blob?: Blob | null; ctx?: boolean } = {}) {
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => (opts.ctx === false ? null : { drawImage: vi.fn() }),
    toBlob: (cb: (b: Blob | null) => void) =>
      cb(opts.blob === undefined ? new Blob([new Uint8Array(8)], { type: 'image/jpeg' }) : opts.blob),
  };
  const realCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string, o?: unknown) =>
    tag === 'canvas' ? (canvas as unknown as HTMLCanvasElement) : realCreate(tag as string, o as ElementCreationOptions)) as typeof document.createElement);
  return canvas;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('prepareCapturePhoto', () => {
  it('downscales, re-encodes as JPEG and returns the EXIF date separately', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 4032, height: 3024, close }));
    const canvas = stubCanvas();
    const input = new Blob([buildExifJpeg('2024:05:06 07:08:09')], { type: 'image/jpeg' });

    const result = await prepareCapturePhoto(input);

    expect(result.takenAt).toBe('2024-05-06T07:08:09');
    expect(result.width).toBe(768);
    expect(result.height).toBe(576);
    expect(canvas.width).toBe(768);
    expect(canvas.height).toBe(576);
    expect(result.blob.type).toBe('image/jpeg');
    expect(result.blob).not.toBe(input);
    expect(close).toHaveBeenCalled();
  });

  it('returns a null date when the photo has no EXIF', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 800, height: 600, close: vi.fn() }));
    stubCanvas();
    const result = await prepareCapturePhoto(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));
    expect(result.takenAt).toBeNull();
    expect(result.width).toBe(768);
  });

  it('falls back to createImageBitmap without options', async () => {
    const bitmap = vi.fn().mockRejectedValueOnce(new Error('options unsupported')).mockResolvedValueOnce({
      width: 100,
      height: 50,
      close: vi.fn(),
    });
    vi.stubGlobal('createImageBitmap', bitmap);
    stubCanvas();
    const result = await prepareCapturePhoto(new Blob([new Uint8Array(4)], { type: 'image/jpeg' }));
    expect(bitmap).toHaveBeenCalledTimes(2);
    expect(result.width).toBe(100);
  });

  it('throws rather than returning the original when decoding fails', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('nope')));
    vi.stubGlobal('URL', { createObjectURL: undefined });
    await expect(prepareCapturePhoto(new Blob([new Uint8Array(4)]))).rejects.toBeInstanceOf(CapturePrepError);
  });

  it('throws when the canvas cannot encode and still releases the bitmap', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 100, height: 100, close }));
    stubCanvas({ blob: null });
    await expect(prepareCapturePhoto(new Blob([new Uint8Array(4)]))).rejects.toBeInstanceOf(CapturePrepError);
    expect(close).toHaveBeenCalled();
  });
});
