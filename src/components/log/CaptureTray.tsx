'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { Camera, Quotes, PencilSimple, LinkSimple, Microphone } from '@/components/icons';
import { enqueueFileUpload } from '@/lib/offline-queue';

export type CaptureItem = {
  type: 'photo' | 'quote' | 'note' | 'link' | 'audio';
  content: string;
  caption?: string;
  /**
   * Optional kind-specific metadata. Currently only audio uses it:
   * `{ durationMs: number, mimeType: string }`.
   */
  metadata?: Record<string, unknown>;
};

type Tab = CaptureItem['type'];

const TABS: { id: Tab; label: string; Icon: Icon }[] = [
  { id: 'note', label: 'Note', Icon: PencilSimple },
  { id: 'photo', label: 'Photo', Icon: Camera },
  { id: 'quote', label: 'Quote', Icon: Quotes },
  { id: 'link', label: 'Link', Icon: LinkSimple },
  { id: 'audio', label: 'Audio', Icon: Microphone },
];

/**
 * CaptureTray — tabbed capture UI (photo, quote, note, link, audio).
 * Used inline in FacilitateMode (Capture button) and composed inside
 * EvidenceModal. Calls onCapture with the finished item; suppresses its
 * save button when `hideSaveButton` is true (parent supplies its own).
 *
 * Audio recording uses MediaRecorder with webm/opus when available, falling
 * back to plain webm; if permission is denied it triggers a file picker
 * so the parent can still attach an audio file from disk.
 */
export function CaptureTray({
  initialTab = 'note',
  onCapture,
  hideSaveButton = false,
  saveLabel = 'Add',
}: {
  initialTab?: Tab;
  onCapture: (item: CaptureItem) => void | Promise<void>;
  hideSaveButton?: boolean;
  saveLabel?: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [textContent, setTextContent] = useState('');
  const [caption, setCaption] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  // Audio recording state
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const audioFileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const recordStartRef = useRef(0);

  // Clean up object URLs, timer, and any in-flight stream on unmount.
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
        setRecordingDuration(
          Math.floor((Date.now() - recordStartRef.current) / 1000),
        );
      }, 500);
    } catch {
      // Mic permission denied or unavailable — fall back to file picker.
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

  const uploadAudioBlob = async (
    blob: Blob,
  ): Promise<{ url: string; durationMs: number; mimeType: string }> => {
    const durationMs = recordStartRef.current
      ? Date.now() - recordStartRef.current
      : 0;
    const ext = blob.type.includes('webm') ? 'webm' : 'm4a';
    const file = new File([blob], `recording.${ext}`, { type: blob.type });
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/evidence/audio-upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error ?? 'Upload failed');
    }
    const { url } = await res.json();
    return { url, durationMs, mimeType: blob.type };
  };

  const canSave = () => {
    switch (activeTab) {
      case 'photo':
        return !!selectedFileRef.current;
      case 'quote':
      case 'note':
        return !!textContent.trim();
      case 'link':
        return !!(linkUrl.trim() || linkName.trim());
      case 'audio':
        return !!audioBlob && !recording;
      default:
        return false;
    }
  };

  const handleSave = async () => {
    if (activeTab === 'photo' && selectedFileRef.current) {
      setUploading(true);
      const file = selectedFileRef.current;
      // Offline path — don't even try the fetch; queue immediately and let
      // the parent save with a `local://` placeholder. Re-online auto-drains
      // via initOfflineQueue's `online` listener.
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const { localId } = enqueueFileUpload(file, '/api/evidence/upload', 'photo');
        await onCapture({
          type: 'photo',
          content: localId,
          caption: caption || undefined,
          metadata: { pending_upload: true },
        });
        setPreviewUrl('');
        setCaption('');
        selectedFileRef.current = null;
        if (fileRef.current) fileRef.current.value = '';
        setUploading(false);
        return;
      }
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/evidence/upload', { method: 'POST', body: form });
        if (!res.ok) {
          if (res.status >= 500) {
            // Transient — queue and let the resolver swap in the URL later.
            const { localId } = enqueueFileUpload(file, '/api/evidence/upload', 'photo');
            await onCapture({
              type: 'photo',
              content: localId,
              caption: caption || undefined,
              metadata: { pending_upload: true },
            });
            setPreviewUrl('');
            setCaption('');
            selectedFileRef.current = null;
            if (fileRef.current) fileRef.current.value = '';
            return;
          }
          const err = await res.json().catch(() => ({ error: 'Upload failed' }));
          alert(err.error ?? 'Upload failed. Please try again.');
          return;
        }
        const { url } = await res.json();
        await onCapture({ type: 'photo', content: url, caption: caption || undefined });
        setPreviewUrl('');
        setCaption('');
        selectedFileRef.current = null;
        if (fileRef.current) fileRef.current.value = '';
      } catch {
        // Network error — queue.
        const { localId } = enqueueFileUpload(file, '/api/evidence/upload', 'photo');
        await onCapture({
          type: 'photo',
          content: localId,
          caption: caption || undefined,
          metadata: { pending_upload: true },
        });
        setPreviewUrl('');
        setCaption('');
        selectedFileRef.current = null;
        if (fileRef.current) fileRef.current.value = '';
      } finally {
        setUploading(false);
      }
      return;
    }

    if (activeTab === 'audio' && audioBlob) {
      setUploading(true);
      const durationMs = recordStartRef.current
        ? Date.now() - recordStartRef.current
        : 0;
      const mimeType = audioBlob.type;
      // Offline → queue immediately.
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const { localId } = enqueueFileUpload(
          audioBlob,
          '/api/evidence/audio-upload',
          'audio',
          { durationMs, mimeType },
        );
        await onCapture({
          type: 'audio',
          content: localId,
          caption: caption || undefined,
          metadata: { durationMs, mimeType, pending_upload: true },
        });
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioBlob(null);
        setAudioPreviewUrl('');
        setRecordingDuration(0);
        recordStartRef.current = 0;
        setCaption('');
        setUploading(false);
        return;
      }
      try {
        const { url, durationMs: serverDurationMs, mimeType: serverMimeType } =
          await uploadAudioBlob(audioBlob);
        await onCapture({
          type: 'audio',
          content: url,
          caption: caption || undefined,
          metadata: { durationMs: serverDurationMs, mimeType: serverMimeType },
        });
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioBlob(null);
        setAudioPreviewUrl('');
        setRecordingDuration(0);
        recordStartRef.current = 0;
        setCaption('');
      } catch {
        // Network failure — queue and surface placeholder.
        const { localId } = enqueueFileUpload(
          audioBlob,
          '/api/evidence/audio-upload',
          'audio',
          { durationMs, mimeType },
        );
        await onCapture({
          type: 'audio',
          content: localId,
          caption: caption || undefined,
          metadata: { durationMs, mimeType, pending_upload: true },
        });
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioBlob(null);
        setAudioPreviewUrl('');
        setRecordingDuration(0);
        recordStartRef.current = 0;
        setCaption('');
      } finally {
        setUploading(false);
      }
      return;
    }

    if (activeTab === 'quote' || activeTab === 'note') {
      const text = textContent.trim();
      if (!text) return;
      await onCapture({ type: activeTab, content: text });
      setTextContent('');
      return;
    }

    if (activeTab === 'link') {
      const url = linkUrl.trim();
      const name = linkName.trim();
      if (!url && !name) return;
      await onCapture({ type: 'link', content: url || name, caption: name || undefined });
      setLinkUrl('');
      setLinkName('');
      return;
    }
  };

  return (
    <div className="space-y-md">
      {/* Tab bar */}
      <div className="flex gap-xs overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`shrink-0 inline-flex items-center gap-xs font-sans text-xs px-sm py-xs rounded-md border transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
              activeTab === id
                ? 'border-ember bg-ember/10 text-ember'
                : 'border-border-subtle bg-surface-panel text-text-secondary hover:border-border-medium hover:text-text-primary'
            }`}
          >
            <Icon size={13} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      {activeTab === 'photo' && (
        <div className="space-y-sm">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-md border-2 border-dashed border-border-medium p-md text-center font-sans text-xs text-text-secondary hover:border-ember transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)]"
          >
            <span className="inline-flex items-center gap-xs">
              <Camera size={14} aria-hidden="true" />
              {previewUrl ? 'Photo selected — tap to change' : 'Tap to select photo'}
            </span>
          </button>
          {previewUrl && (
            // Local createObjectURL blob — no remote host to whitelist, no
            // intrinsic size; next/image's required width/height don't fit.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Preview" className="w-full max-h-[160px] object-cover rounded-md" />
          )}
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption..."
            className="w-full rounded-md border border-border-subtle bg-surface-raised p-sm font-serif text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none"
          />
        </div>
      )}

      {(activeTab === 'quote' || activeTab === 'note') && (
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder={activeTab === 'quote' ? 'What did they say?' : 'Your observation or note...'}
          rows={3}
          className="w-full rounded-md border border-border-subtle bg-surface-raised p-sm font-serif text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none resize-y"
          autoFocus
        />
      )}

      {activeTab === 'link' && (
        <div className="space-y-sm">
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

      {activeTab === 'audio' && (
        <div className="space-y-sm">
          <input
            ref={audioFileRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioFileSelect}
            className="hidden"
          />

          {!audioBlob && !recording && (
            <div className="flex flex-col items-center gap-sm py-sm">
              <button
                onClick={startRecording}
                className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-dashed border-border-medium text-text-secondary hover:border-ember hover:text-ember transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)]"
                aria-label="Start recording"
              >
                <Microphone size={28} aria-hidden="true" />
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
            <div className="flex flex-col items-center gap-sm py-sm">
              <button
                onClick={stopRecording}
                className="flex items-center justify-center w-16 h-16 rounded-full bg-ember/10 border-2 border-ember text-ember animate-pulse"
                aria-label="Stop recording"
              >
                <div className="w-5 h-5 rounded-sm bg-ember" />
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

      {!hideSaveButton && (
        <button
          onClick={handleSave}
          disabled={uploading || recording || !canSave()}
          className="w-full rounded-md bg-ember py-sm font-sans text-sm font-semibold text-text-inverse hover:bg-ember-hover transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] min-h-[44px] disabled:opacity-40"
        >
          {uploading ? 'Uploading...' : saveLabel}
        </button>
      )}
    </div>
  );
}
