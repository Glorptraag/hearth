/**
 * useAudioTranscription — MediaRecorder → /api/transcribe path that replaces
 * the Web Speech API in the Logger (works cross-browser incl. iOS Safari).
 *
 * Covers: unsupported-environment fallback; the record→stop→transcribe happy
 * path (incl. the upload payload); the three error kinds (permission / network
 * / failed) and the no-speech branches (empty transcript + zero captured
 * chunks); the auto-stop ceiling; unmount mic-release; and the getUserMedia
 * race guards (double-start, cancel-during-prompt).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioTranscription } from './use-audio-transcription';

type FakeRecorder = {
  state: string;
  mimeType: string;
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};

const recorders: FakeRecorder[] = [];
// Controls what FakeMediaRecorder.stop() flushes: a real chunk, a zero-size
// blob (discarded by the hook's size guard), or nothing at all.
let chunkMode: 'data' | 'zerosize' | 'empty' = 'data';
let lastTrack: { stop: ReturnType<typeof vi.fn> } | null = null;

function installMediaRecorder() {
  function FakeMediaRecorder(this: FakeRecorder, _stream: unknown, opts?: { mimeType?: string }) {
    this.state = 'inactive';
    this.mimeType = opts?.mimeType ?? '';
    this.ondataavailable = null;
    this.onstop = null;
    this.start = vi.fn(() => { this.state = 'recording'; });
    this.stop = vi.fn(() => {
      this.state = 'inactive';
      if (chunkMode === 'data') {
        this.ondataavailable?.({ data: new Blob(['audio'], { type: this.mimeType || 'audio/webm' }) });
      } else if (chunkMode === 'zerosize') {
        this.ondataavailable?.({ data: new Blob([], { type: this.mimeType || 'audio/webm' }) });
      } // 'empty' → never fires ondataavailable
      this.onstop?.();
    });
    recorders.push(this);
  }
  (FakeMediaRecorder as unknown as { isTypeSupported: () => boolean }).isTypeSupported = () => true;
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
}

function setMediaDevices(getUserMedia: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
}

function installImmediateMedia() {
  lastTrack = { stop: vi.fn() };
  const stream = { getTracks: () => [lastTrack] };
  const getUserMedia = vi.fn().mockResolvedValue(stream);
  setMediaDevices(getUserMedia);
  return getUserMedia;
}

function installDeferredMedia() {
  lastTrack = { stop: vi.fn() };
  const stream = { getTracks: () => [lastTrack] };
  let resolveFn: (s: unknown) => void = () => {};
  const getUserMedia = vi.fn(() => new Promise((res) => { resolveFn = res; }));
  setMediaDevices(getUserMedia);
  return { getUserMedia, resolveStream: () => resolveFn(stream) };
}

const okFetch = (transcript: string) =>
  vi.fn().mockResolvedValue({ ok: true, json: async () => ({ transcript }) });

beforeEach(() => {
  recorders.length = 0;
  chunkMode = 'data';
  lastTrack = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  recorders.length = 0;
  // @ts-expect-error — clear the per-test mediaDevices stub
  delete navigator.mediaDevices;
});

describe('useAudioTranscription', () => {
  it('reports unsupported and fires onUnsupported when MediaRecorder is absent', () => {
    const onUnsupported = vi.fn();
    const { result } = renderHook(() =>
      useAudioTranscription({ onTranscript: vi.fn(), onUnsupported }),
    );

    expect(result.current.isSupported).toBe(false);
    act(() => result.current.start());
    expect(onUnsupported).toHaveBeenCalledTimes(1);
    expect(result.current.isRecording).toBe(false);
  });

  it('records, transcribes, and emits the recognised text (with the right payload)', async () => {
    const onTranscript = vi.fn();
    const getUserMedia = installImmediateMedia();
    installMediaRecorder();
    const fetchMock = okFetch('A galah flew past the window.');
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAudioTranscription({ onTranscript }));
    expect(result.current.isSupported).toBe(true);

    await act(async () => { result.current.start(); });
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(result.current.isRecording).toBe(true);

    await act(async () => { result.current.stop(); });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/transcribe');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(Blob);
    expect(init.headers['Content-Type']).toMatch(/^audio\//);
    expect(onTranscript).toHaveBeenCalledWith('A galah flew past the window.');
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isTranscribing).toBe(false);
  });

  it('fires onError("permission") when mic access is denied', async () => {
    const onError = vi.fn();
    const getUserMedia = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    setMediaDevices(getUserMedia);
    installMediaRecorder();

    const { result } = renderHook(() => useAudioTranscription({ onTranscript: vi.fn(), onError }));
    await act(async () => { result.current.start(); });

    expect(onError).toHaveBeenCalledWith('permission');
    expect(result.current.isRecording).toBe(false);
  });

  it('fires onError("failed") when the route responds non-ok', async () => {
    const onTranscript = vi.fn();
    const onError = vi.fn();
    installImmediateMedia();
    installMediaRecorder();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({}) }));

    const { result } = renderHook(() => useAudioTranscription({ onTranscript, onError }));
    await act(async () => { result.current.start(); });
    await act(async () => { result.current.stop(); });

    expect(onError).toHaveBeenCalledWith('failed');
    expect(onTranscript).not.toHaveBeenCalled();
    expect(result.current.isTranscribing).toBe(false);
  });

  it('fires onError("network") when the upload rejects', async () => {
    const onError = vi.fn();
    installImmediateMedia();
    installMediaRecorder();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const { result } = renderHook(() => useAudioTranscription({ onTranscript: vi.fn(), onError }));
    await act(async () => { result.current.start(); });
    await act(async () => { result.current.stop(); });

    expect(onError).toHaveBeenCalledWith('network');
    expect(result.current.isTranscribing).toBe(false);
  });

  it('fires onError("no-speech") on an empty transcript (does not append blank text)', async () => {
    const onTranscript = vi.fn();
    const onError = vi.fn();
    installImmediateMedia();
    installMediaRecorder();
    vi.stubGlobal('fetch', okFetch('   '));

    const { result } = renderHook(() => useAudioTranscription({ onTranscript, onError }));
    await act(async () => { result.current.start(); });
    await act(async () => { result.current.stop(); });

    expect(onError).toHaveBeenCalledWith('no-speech');
    expect(onTranscript).not.toHaveBeenCalled();
  });

  it('fires onError("no-speech") and never uploads when no audio was captured', async () => {
    const onError = vi.fn();
    chunkMode = 'empty';
    installImmediateMedia();
    installMediaRecorder();
    const fetchMock = okFetch('ignored');
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAudioTranscription({ onTranscript: vi.fn(), onError }));
    await act(async () => { result.current.start(); });
    await act(async () => { result.current.stop(); });

    expect(onError).toHaveBeenCalledWith('no-speech');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('auto-stops at the duration ceiling and transcribes', async () => {
    vi.useFakeTimers();
    const onTranscript = vi.fn();
    installImmediateMedia();
    installMediaRecorder();
    vi.stubGlobal('fetch', okFetch('cut off at the cap'));

    const { result } = renderHook(() =>
      useAudioTranscription({ onTranscript, maxDurationMs: 1000 }),
    );
    await act(async () => { result.current.start(); });
    expect(result.current.isRecording).toBe(true);

    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });

    const recorder = recorders[recorders.length - 1];
    expect(recorder.stop).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
    expect(lastTrack?.stop).toHaveBeenCalled();
    expect(onTranscript).toHaveBeenCalledWith('cut off at the cap');
  });

  it('releases the mic on unmount during recording', async () => {
    installImmediateMedia();
    installMediaRecorder();
    vi.stubGlobal('fetch', okFetch('partial'));

    const { result, unmount } = renderHook(() =>
      useAudioTranscription({ onTranscript: vi.fn() }),
    );
    await act(async () => { result.current.start(); });
    const recorder = recorders[recorders.length - 1];

    await act(async () => { unmount(); });

    expect(recorder.stop).toHaveBeenCalled();
    expect(lastTrack?.stop).toHaveBeenCalled();
  });

  it('ignores a second start() while the permission prompt is open (no orphaned stream)', async () => {
    const { getUserMedia, resolveStream } = installDeferredMedia();
    installMediaRecorder();
    vi.stubGlobal('fetch', okFetch('x'));

    const { result } = renderHook(() => useAudioTranscription({ onTranscript: vi.fn() }));
    act(() => {
      result.current.start();
      result.current.start();
    });
    expect(getUserMedia).toHaveBeenCalledTimes(1);

    await act(async () => { resolveStream(); });
    expect(recorders).toHaveLength(1);
    expect(result.current.isRecording).toBe(true);
  });

  it('exposes audioLevel (0 without Web Audio) and still records + transcribes', async () => {
    // jsdom has no AudioContext, so the level meter is skipped — the recording
    // and transcription path must work regardless and audioLevel stays 0.
    const onTranscript = vi.fn();
    installImmediateMedia();
    installMediaRecorder();
    vi.stubGlobal('fetch', okFetch('a kookaburra called'));

    const { result } = renderHook(() => useAudioTranscription({ onTranscript }));
    expect(result.current.audioLevel).toBe(0);

    await act(async () => { result.current.start(); });
    expect(result.current.isRecording).toBe(true);
    expect(result.current.audioLevel).toBe(0);

    await act(async () => { result.current.stop(); });
    expect(onTranscript).toHaveBeenCalledWith('a kookaburra called');
    expect(result.current.audioLevel).toBe(0);
  });

  it('cancels cleanly when stop() is tapped during the permission prompt', async () => {
    const { resolveStream } = installDeferredMedia();
    installMediaRecorder();

    const { result } = renderHook(() => useAudioTranscription({ onTranscript: vi.fn() }));
    act(() => { result.current.start(); });
    act(() => { result.current.stop(); });

    await act(async () => { resolveStream(); });

    expect(recorders).toHaveLength(0); // recording never started
    expect(lastTrack?.stop).toHaveBeenCalled(); // mic released
    expect(result.current.isRecording).toBe(false);
  });
});
