/**
 * usePhotoCapture (W3.1): every photo goes through the W1.2 client prep (no
 * fallback to the original file, which would leak GPS), then to the private
 * evidence store; failures surface as plain messages and add nothing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { usePhotoCapture } from './use-photo-capture';
import { noticeCopy } from '@/app/(auth)/log/_components/noticeCopy';

const { prepareMock } = vi.hoisted(() => ({ prepareMock: vi.fn() }));
vi.mock('@/lib/images/capture-prep', () => ({ prepareCapturePhoto: prepareMock }));

const fetchMock = vi.fn();

function changeEvent(file: File | null) {
  const target = { files: file ? [file] : [], value: 'C:\\fakepath\\p.jpg' };
  return { target } as unknown as ChangeEvent<HTMLInputElement> & { target: { value: string } };
}

function setup() {
  const onAdded = vi.fn();
  const onError = vi.fn();
  const { result } = renderHook(() => usePhotoCapture({ onAdded, onError }));
  return { result, onAdded, onError };
}

const FILE = new File([new Uint8Array([1, 2, 3])], 'IMG_0001.HEIC', { type: 'image/heic' });

beforeEach(() => {
  prepareMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePhotoCapture', () => {
  it('preps, uploads the prepared JPEG and hands back the pathname + capture time', async () => {
    const prepared = new Blob([new Uint8Array([9])], { type: 'image/jpeg' });
    prepareMock.mockResolvedValue({ blob: prepared, takenAt: '2026-10-20T14:05:33', width: 768, height: 576 });
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ pathname: 'evidence/fam/1.jpg' }), { status: 200 }));
    const { result, onAdded, onError } = setup();

    const e = changeEvent(FILE);
    await act(() => result.current.onFileChange(e));

    expect(prepareMock).toHaveBeenCalledWith(FILE);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/evidence/upload');
    const sent = (init.body as FormData).get('file') as File;
    expect(sent.type).toBe('image/jpeg');
    expect(sent.size).toBe(prepared.size); // the prepared blob, never the original file
    expect(onAdded).toHaveBeenCalledWith(
      { type: 'photo', content: 'evidence/fam/1.jpg', caption: '' },
      '2026-10-20T14:05:33',
    );
    expect(onError).not.toHaveBeenCalled();
    expect(e.target.value).toBe('');
    expect(result.current.uploading).toBe(false);
  });

  it('refuses a photo the prep cannot read, without uploading the original', async () => {
    prepareMock.mockRejectedValue(new Error('decode failed'));
    const { result, onAdded, onError } = setup();
    await act(() => result.current.onFileChange(changeEvent(FILE)));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onAdded).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(noticeCopy.photoUnreadable);
  });

  it.each([
    [413, noticeCopy.photoTooLarge],
    [429, noticeCopy.rateLimited],
    [503, noticeCopy.photoUnavailable],
    [500, noticeCopy.photoFailed],
  ])('maps an upload %i to a plain message and adds nothing', async (status, message) => {
    prepareMock.mockResolvedValue({ blob: new Blob([]), takenAt: null, width: 1, height: 1 });
    fetchMock.mockResolvedValue(new Response('{}', { status }));
    const { result, onAdded, onError } = setup();
    await act(() => result.current.onFileChange(changeEvent(FILE)));
    expect(onAdded).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(message);
  });

  it('treats a network failure as a failed upload', async () => {
    prepareMock.mockResolvedValue({ blob: new Blob([]), takenAt: null, width: 1, height: 1 });
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { result, onError } = setup();
    await act(() => result.current.onFileChange(changeEvent(FILE)));
    expect(onError).toHaveBeenCalledWith(noticeCopy.photoFailed);
  });

  it('ignores an empty pick', async () => {
    const { result, onAdded, onError } = setup();
    await act(() => result.current.onFileChange(changeEvent(null)));
    expect(prepareMock).not.toHaveBeenCalled();
    expect(onAdded).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
