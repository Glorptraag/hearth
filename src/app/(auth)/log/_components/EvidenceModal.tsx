'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { X, Camera, Microphone } from '@/components/icons';
import type { DraftEvidenceItem as EvidenceItem } from '@/lib/logger/draft';

/**
 * Evidence capture modal — photo upload, audio recording, child quote, note,
 * or link. Manages its own input/upload state and hands the finished item back
 * via onSave.
 */
export function EvidenceModal({
  type,
  onClose,
  onSave,
}: {
  type: string;
  onClose: () => void;
  onSave: (item: EvidenceItem) => void;
}) {
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);
  const trapRef = useFocusTrap(true);

  // Audio recording state
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const recordStartRef = useRef(0);

  // Clean up object URLs and timer on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioPreviewUrl, previewUrl]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    selectedFileRef.current = file;
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioBlob(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
    setRecordingDuration(0);
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      recordStartRef.current = Date.now();
      setRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordStartRef.current) / 1000));
      }, 500);
    } catch {
      // Mic permission denied or unavailable — fall back to file picker
      audioFileRef.current?.click();
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const uploadAudioBlob = async (blob: Blob): Promise<{ url: string; durationMs: number; mimeType: string }> => {
    const durationMs = recordStartRef.current
      ? Date.now() - recordStartRef.current
      : 0;
    const ext = blob.type.includes('webm') ? 'webm' : 'm4a';
    const file = new File([blob], `recording.${ext}`, { type: blob.type });
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/evidence/audio-upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error ?? 'Upload failed');
    }
    const { url } = await res.json();
    return { url, durationMs, mimeType: blob.type };
  };

  const handleSave = async () => {
    if (type === 'photo' && selectedFileRef.current) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFileRef.current);
        const res = await fetch('/api/evidence/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }));
          alert(err.error ?? 'Upload failed. Please try again.');
          return;
        }
        const { url } = await res.json();
        onSave({ type: 'photo', content: url, caption });
      } catch {
        alert('Upload failed. Check your connection and try again.');
        return;
      } finally {
        setUploading(false);
      }
    } else if (type === 'audio' && audioBlob) {
      setUploading(true);
      try {
        const { url, durationMs, mimeType } = await uploadAudioBlob(audioBlob);
        onSave({
          type: 'audio',
          content: url,
          caption,
          metadata: { durationMs, mimeType },
        });
      } catch {
        alert('Audio upload failed. Check your connection and try again.');
        return;
      } finally {
        setUploading(false);
      }
    } else if (type === 'quote' && content.trim()) {
      onSave({ type: 'quote', content: content.trim() });
    } else if (type === 'note' && content.trim()) {
      onSave({ type: 'note', content: content.trim() });
    } else if (type === 'link' && (linkName.trim() || linkUrl.trim())) {
      onSave({ type: 'link', content: linkName.trim(), name: linkName.trim(), url: linkUrl.trim() });
    }
  };

  const titles: Record<string, string> = {
    photo: 'Add Photo',
    audio: 'Record Audio',
    quote: "Child's Words",
    note: 'Add Note',
    link: 'Link Resource',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 backdrop-modal" onClick={onClose} />
      <div ref={trapRef} role="dialog" aria-modal="true" aria-labelledby="evidence-modal-title" className="relative w-full max-w-lg rounded-t-xl lg:rounded-xl border border-border-subtle bg-surface-panel p-xl shadow-float" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
        <div className="flex items-center justify-between mb-lg">
          <h3 id="evidence-modal-title" className="font-serif text-lg font-semibold text-text-primary">{titles[type]}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {type === 'photo' && (
          <div className="space-y-md">
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-md border-2 border-dashed border-border-medium p-xl text-center font-sans text-sm text-text-secondary hover:border-ember transition-all duration-200"
            >
              <span className="inline-flex items-center gap-xs"><Camera size={16} aria-hidden="true" /> {previewUrl ? 'Photo selected — tap to change' : 'Tap to select photo'}</span>
            </button>
            {previewUrl && (
              // Local createObjectURL blob — no remote host to whitelist, no
              // intrinsic size; next/image's required width/height don't fit.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="w-full max-h-[200px] object-cover rounded-md" />
            )}
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption..."
              className="w-full rounded-md border border-border-subtle bg-surface-raised p-sm font-serif text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none"
            />
          </div>
        )}

        {type === 'audio' && (
          <div className="space-y-md">
            <input ref={audioFileRef} type="file" accept="audio/*" onChange={handleAudioFileSelect} className="hidden" />

            {!audioBlob && !recording && (
              <div className="flex flex-col items-center gap-md">
                <button
                  onClick={startRecording}
                  className="flex items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-border-medium text-text-secondary hover:border-ember hover:text-ember transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)]"
                  aria-label="Start recording"
                >
                  <Microphone size={32} aria-hidden="true" />
                </button>
                <p className="font-sans text-xs text-text-muted">Tap to record, or</p>
                <button
                  onClick={() => audioFileRef.current?.click()}
                  className="font-sans text-xs text-ember underline"
                >
                  choose an audio file
                </button>
              </div>
            )}

            {recording && (
              <div className="flex flex-col items-center gap-md">
                <button
                  onClick={stopRecording}
                  className="flex items-center justify-center w-20 h-20 rounded-full bg-ember/10 border-2 border-ember text-ember animate-pulse"
                  aria-label="Stop recording"
                >
                  <div className="w-6 h-6 rounded-sm bg-ember" />
                </button>
                <p className="font-sans text-sm font-semibold text-ember tabular-nums">
                  {formatDuration(recordingDuration)}
                </p>
                <p className="font-sans text-xs text-text-muted">Recording... tap to stop</p>
              </div>
            )}

            {audioBlob && !recording && (
              <div className="space-y-sm">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio src={audioPreviewUrl} controls className="w-full" />
                <button
                  onClick={() => {
                    setAudioBlob(null);
                    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
                    setAudioPreviewUrl('');
                    setRecordingDuration(0);
                    recordStartRef.current = 0;
                  }}
                  className="font-sans text-xs text-text-muted underline"
                >
                  Record again
                </button>
              </div>
            )}

            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption..."
              className="w-full rounded-md border border-border-subtle bg-surface-raised p-sm font-serif text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none"
            />
          </div>
        )}

        {(type === 'quote' || type === 'note') && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={type === 'quote' ? "What did they say?" : "Your observation or note..."}
            rows={4}
            className="w-full rounded-md border border-border-subtle bg-surface-raised p-md font-serif text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none resize-y"
            autoFocus
          />
        )}

        {type === 'link' && (
          <div className="space-y-md">
            <input
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="Resource name..."
              className="w-full rounded-md border border-border-subtle bg-surface-raised p-sm font-serif text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none"
              autoFocus
            />
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https:// (optional)"
              className="w-full rounded-md border border-border-subtle bg-surface-raised p-sm font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={uploading || recording}
          className="mt-lg w-full rounded-md bg-ember py-sm font-sans text-sm font-semibold text-text-inverse hover:bg-ember-hover transition-all duration-200 min-h-[44px] disabled:opacity-40"
        >
          {uploading ? 'Uploading...' : 'Add Evidence'}
        </button>
      </div>
    </div>
  );
}
