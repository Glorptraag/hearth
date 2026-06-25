import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeTargetDimensions, compressImageFile } from './compress-image';

/** Stub a canvas whose 2d context + toBlob succeed, returning a small JPEG. */
function stubCanvas(blobSize = 8) {
  const realCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string, opts?: unknown) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: vi.fn() }),
        toBlob: (cb: (b: Blob | null) => void) =>
          cb(new Blob([new Uint8Array(blobSize)], { type: 'image/jpeg' })),
      } as unknown as HTMLCanvasElement;
    }
    return realCreate(tag as string, opts as ElementCreationOptions);
  }) as typeof document.createElement);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('computeTargetDimensions', () => {
  it('leaves images at or below the max edge untouched', () => {
    expect(computeTargetDimensions(1600, 1200, 1920)).toEqual({ width: 1600, height: 1200 });
    expect(computeTargetDimensions(1920, 1080, 1920)).toEqual({ width: 1920, height: 1080 });
  });

  it('scales a landscape image by its width', () => {
    expect(computeTargetDimensions(3840, 2160, 1920)).toEqual({ width: 1920, height: 1080 });
  });

  it('scales a portrait image by its height', () => {
    expect(computeTargetDimensions(2160, 3840, 1920)).toEqual({ width: 1080, height: 1920 });
  });

  it('scales a square image to the max edge', () => {
    expect(computeTargetDimensions(4000, 4000, 1920)).toEqual({ width: 1920, height: 1920 });
  });

  it('rounds fractional dimensions to whole pixels', () => {
    // 4032×3024 (typical iPhone) → longest 4032, scale 1920/4032
    expect(computeTargetDimensions(4032, 3024, 1920)).toEqual({ width: 1920, height: 1440 });
  });
});

describe('compressImageFile', () => {
  it('falls back to createImageBitmap() without options when the options dict throws (iOS Safari < 17)', async () => {
    const createImageBitmap = vi.fn((...args: unknown[]) => {
      // Options-dict call throws on older Safari — the regression we fixed.
      if (args.length > 1) return Promise.reject(new Error('options unsupported'));
      return Promise.resolve({ width: 4000, height: 3000, close: vi.fn() });
    });
    vi.stubGlobal('createImageBitmap', createImageBitmap);
    stubCanvas();

    const file = new File([new Uint8Array(50_000)], 'pic.heic', { type: 'image/heic' });
    const out = await compressImageFile(file);

    expect(createImageBitmap).toHaveBeenCalledTimes(2); // with options, then without
    expect(out).not.toBe(file);
    expect(out.type).toBe('image/jpeg');
    expect(out.name).toBe('pic.jpg');
  });

  it('falls back to an <img> decode when createImageBitmap is unavailable', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 4000;
      naturalHeight = 3000;
      set src(_v: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', FakeImage);
    const revoke = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:fake', configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revoke, configurable: true });
    stubCanvas();

    const file = new File([new Uint8Array(50_000)], 'ipad.heic', { type: 'image/heic' });
    const out = await compressImageFile(file);

    expect(out.type).toBe('image/jpeg');
    expect(out.name).toBe('ipad.jpg');
    expect(revoke).toHaveBeenCalled(); // object URL released
  });

  it('returns the original file when nothing can decode it', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_v: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal('Image', FakeImage);
    Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:fake', configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });

    const file = new File([new Uint8Array(1000)], 'broken.heic', { type: 'image/heic' });
    const out = await compressImageFile(file);
    expect(out).toBe(file);
  });

  it('leaves non-images untouched', async () => {
    const file = new File([new Uint8Array(10)], 'notes.txt', { type: 'text/plain' });
    expect(await compressImageFile(file)).toBe(file);
  });
});
