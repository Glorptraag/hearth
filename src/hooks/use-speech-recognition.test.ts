/**
 * useSpeechRecognition — unsupported-browser handling (UX compendium UC-L-09).
 *
 * The bare native `alert()` is replaced by an `onUnsupported` callback so the
 * Logger can surface a themed toast. Guards that an unsupported browser fires
 * the callback (never `alert`) and that a supported one starts recognition.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from './use-speech-recognition';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useSpeechRecognition', () => {
  it('fires onUnsupported (not alert) when SpeechRecognition is absent', () => {
    const onUnsupported = vi.fn();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useSpeechRecognition({ onTranscript: vi.fn(), onUnsupported }),
    );

    expect(result.current.isSupported).toBe(false);
    act(() => result.current.start());

    expect(onUnsupported).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
  });

  it('does not throw when start() is called with no onUnsupported handler', () => {
    const { result } = renderHook(() => useSpeechRecognition({ onTranscript: vi.fn() }));
    expect(() => act(() => result.current.start())).not.toThrow();
  });

  it('reports supported and starts recognition when a constructor exists', () => {
    const instance = {
      lang: '',
      continuous: false,
      interimResults: false,
      start: vi.fn(),
      stop: vi.fn(),
      onresult: null,
      onerror: null,
      onend: null,
    };
    // Must be constructable (`new Ctor()`), so a function expression, not an arrow.
    vi.stubGlobal('SpeechRecognition', vi.fn(function () { return instance; }));

    const { result } = renderHook(() => useSpeechRecognition({ onTranscript: vi.fn() }));

    expect(result.current.isSupported).toBe(true);
    act(() => result.current.start());
    expect(instance.start).toHaveBeenCalledTimes(1);
    expect(result.current.isRecording).toBe(true);
  });
});
