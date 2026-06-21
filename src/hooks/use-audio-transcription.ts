'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Records a short voice clip with MediaRecorder and transcribes it server-side
 * via /api/transcribe (Deepgram). Replaces the Web Speech API path for the
 * Logger: MediaRecorder + getUserMedia work cross-browser — including iOS
 * Safari and in-app webviews, where SpeechRecognition is unreliable-to-absent.
 *
 * Flow: start() opens the mic and records → stop() finalises the clip, POSTs
 * it, and calls onTranscript with the recognised (smart-formatted) text.
 *
 * Mirrors useSpeechRecognition's surface (isRecording / isSupported / start /
 * stop) so the Logger swap is mechanical, plus `isTranscribing` for the
 * upload→result gap and a typed `onError` for permission / network / empty
 * failures.
 */
export type TranscriptionErrorKind = 'permission' | 'network' | 'failed' | 'no-speech';

interface UseAudioTranscriptionOptions {
  onTranscript: (text: string) => void;
  /** Called when MediaRecorder/getUserMedia is unavailable (themed toast). */
  onUnsupported?: () => void;
  /** Called on a runtime failure (mic denied, upload failed, nothing heard). */
  onError?: (kind: TranscriptionErrorKind) => void;
  /** Auto-stop ceiling so a forgotten recording can't run unbounded. */
  maxDurationMs?: number;
}

interface UseAudioTranscriptionResult {
  isRecording: boolean;
  isTranscribing: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
}

/** Prefer Opus-in-WebM (Chrome/Firefox/Android); iOS Safari falls back to mp4. */
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return undefined;
}

export function useAudioTranscription({
  onTranscript,
  onUnsupported,
  onError,
  maxDurationMs = 120_000,
}: UseAudioTranscriptionOptions): UseAudioTranscriptionResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Re-entrancy guards for the async getUserMedia window. `startingRef` blocks a
  // second start() while the mic prompt is open (otherwise a second
  // getUserMedia orphans the first stream and leaves the mic hot). `cancelRef`
  // lets stop() abandon a recording that hasn't begun yet (tap Voice → tap Stop
  // while the permission prompt is open).
  const startingRef = useRef(false);
  const cancelRef = useRef(false);
  // Aborts an in-flight transcription upload on unmount so a navigate-away
  // doesn't bill a Deepgram call whose result is then discarded.
  const abortRef = useRef<AbortController | null>(null);

  const onTranscriptRef = useRef(onTranscript);
  const onUnsupportedRef = useRef(onUnsupported);
  const onErrorRef = useRef(onError);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onUnsupportedRef.current = onUnsupported; }, [onUnsupported]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Capability probe in an effect (not a lazy useState initializer) so SSR and
    // the first client render agree on `false`, avoiding a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSupported(
      typeof MediaRecorder !== 'undefined' &&
        Boolean(navigator.mediaDevices?.getUserMedia)
    );
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const transcribe = useCallback(async (blob: Blob) => {
    setIsTranscribing(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'audio/webm' },
        body: blob,
        signal: controller.signal,
      });
      if (!res.ok) {
        onErrorRef.current?.('failed');
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { transcript?: string };
      const text = (data.transcript ?? '').trim();
      if (text) onTranscriptRef.current(text);
      // Deepgram heard nothing usable (silence / background noise). Tell the
      // parent rather than silently dropping the result.
      else onErrorRef.current?.('no-speech');
    } catch (err) {
      // An intentional unmount abort is not a user-facing failure.
      if ((err as Error)?.name !== 'AbortError') onErrorRef.current?.('network');
    } finally {
      abortRef.current = null;
      setIsTranscribing(false);
    }
  }, []);

  const start = useCallback(() => {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      onUnsupportedRef.current?.();
      return;
    }
    // Ignore taps while a start is pending or a recording/stream is already live.
    if (startingRef.current || recorderRef.current || streamRef.current) return;
    startingRef.current = true;
    cancelRef.current = false;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // stop() was tapped during the permission prompt — abandon cleanly and
        // release the mic instead of recording into the void.
        if (cancelRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          startingRef.current = false;
          cancelRef.current = false;
          return;
        }
        streamRef.current = stream;
        chunksRef.current = [];
        const mimeType = pickMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          setIsRecording(false);
          recorderRef.current = null;
          if (autoStopRef.current) {
            clearTimeout(autoStopRef.current);
            autoStopRef.current = null;
          }
          const chunks = chunksRef.current;
          chunksRef.current = [];
          releaseStream();
          if (chunks.length > 0) {
            void transcribe(new Blob(chunks, { type: recorder.mimeType || mimeType }));
          } else {
            // Nothing captured (an instant/silent tap, common on iOS Safari) —
            // surface feedback instead of flipping the button back silently.
            onErrorRef.current?.('no-speech');
          }
        };
        recorder.start();
        recorderRef.current = recorder;
        startingRef.current = false;
        setIsRecording(true);
        autoStopRef.current = setTimeout(() => {
          if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
        }, maxDurationMs);
      })
      .catch(() => {
        // getUserMedia rejects on denied permission or no input device.
        releaseStream();
        startingRef.current = false;
        cancelRef.current = false;
        onErrorRef.current?.('permission');
      });
  }, [maxDurationMs, releaseStream, transcribe]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop(); // fires onstop → transcribe
    } else if (startingRef.current) {
      // getUserMedia is still pending — cancel the recording when it resolves.
      cancelRef.current = true;
      setIsRecording(false);
    } else {
      setIsRecording(false);
    }
  }, []);

  // Unmount cleanup — abort an in-flight upload, stop the recorder, release mic.
  useEffect(() => () => {
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    abortRef.current?.abort();
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return { isRecording, isTranscribing, isSupported, start, stop };
}
