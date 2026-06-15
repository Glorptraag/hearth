'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscript: (text: string) => void;
  /**
   * Called instead of a native `alert()` when the browser has no
   * SpeechRecognition support, so the caller can surface a themed toast
   * (UX compendium UC-L-09). Optional — omitting it makes `start()` a no-op
   * on unsupported browsers.
   */
  onUnsupported?: () => void;
}

interface UseSpeechRecognitionResult {
  isRecording: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition({
  lang = 'en-AU',
  continuous = true,
  interimResults = false,
  onTranscript,
  onUnsupported,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onUnsupportedRef = useRef(onUnsupported);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onUnsupportedRef.current = onUnsupported;
  }, [onUnsupported]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setIsSupported(Boolean(Ctor));
  }, []);

  const start = useCallback(() => {
    if (typeof window === 'undefined') return;
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      onUnsupportedRef.current?.();
      return;
    }
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript) onTranscriptRef.current(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, [lang, continuous, interimResults]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return { isRecording, isSupported, start, stop };
}
