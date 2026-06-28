import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '@/components/ui/Toast';
import { compressImageFile } from '@/lib/images/compress-image';
import QuickCapture from './QuickCapture';

/**
 * Regression coverage for the in-session runner's photo capture.
 *
 * Two bugs this guards against — both were live when prod photo uploads broke:
 *  - the raw file was uploaded with no client compression, so large HEIC photos
 *    could exceed Vercel's 4.5 MB body limit and 413;
 *  - a non-OK upload response did nothing (no toast), so the photo silently
 *    vanished. It now mirrors the Logger's EvidenceModal.
 */

// Compression has its own unit test; here we only need it called and to pass the
// file straight through (no canvas in jsdom).
vi.mock('@/lib/images/compress-image', () => ({
  compressImageFile: vi.fn((file: File) => Promise.resolve(file)),
}));

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const stubUpload = (response: Response) => {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/evidence/upload' && init?.method === 'POST') {
      return response;
    }
    throw new Error(`Unhandled fetch: ${init?.method ?? 'GET'} ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const renderCapture = () => {
  const onAddCapture = vi.fn();
  const onRemoveCapture = vi.fn();
  const { container } = render(
    <ToastProvider>
      <QuickCapture
        captures={[]}
        currentActivityIdx={2}
        currentActivityTitle="Observe the tide pool"
        currentActivityId="activity_x"
        onAddCapture={onAddCapture}
        onRemoveCapture={onRemoveCapture}
      />
    </ToastProvider>,
  );
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  return { onAddCapture, onRemoveCapture, input };
};

const photo = () => new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('QuickCapture · handlePhoto', () => {
  it('compresses the file then records the capture on a successful upload', async () => {
    const fetchMock = stubUpload(jsonResponse({ pathname: 'evidence/abc.jpg' }));
    const { onAddCapture, input } = renderCapture();
    const file = photo();

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onAddCapture).toHaveBeenCalledTimes(1));
    expect(compressImageFile).toHaveBeenCalledWith(file);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/evidence/upload',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(onAddCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'photo',
        content: 'evidence/abc.jpg',
        activityIdx: 2,
        activityTitle: 'Observe the tide pool',
        activityId: 'activity_x',
      }),
    );
  });

  it('shows the oversized-photo toast on a 413 and records nothing', async () => {
    stubUpload(jsonResponse({}, 413));
    const { onAddCapture, input } = renderCapture();

    fireEvent.change(input, { target: { files: [photo()] } });

    expect(
      await screen.findByText('That photo is too large to upload — try a smaller one.'),
    ).toBeInTheDocument();
    expect(onAddCapture).not.toHaveBeenCalled();
  });

  it('surfaces the server error message on a non-OK response and records nothing', async () => {
    stubUpload(jsonResponse({ error: 'Uploads are unavailable right now.' }, 503));
    const { onAddCapture, input } = renderCapture();

    fireEvent.change(input, { target: { files: [photo()] } });

    expect(await screen.findByText('Uploads are unavailable right now.')).toBeInTheDocument();
    expect(onAddCapture).not.toHaveBeenCalled();
  });
});
