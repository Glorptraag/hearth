'use client';

import { useState, useRef } from 'react';
import type { QuickCaptureItem } from './types';
import { PencilSimple, Camera, Microphone, X } from '@/components/icons';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { evidenceSrc } from '@/lib/evidence';
import { compressImageFile } from '@/lib/images/compress-image';
import { useToast } from '@/hooks/use-toast';

export default function QuickCapture({
  captures,
  currentActivityIdx,
  currentActivityTitle,
  currentActivityId,
  onAddCapture,
  onRemoveCapture,
}: {
  captures: QuickCaptureItem[];
  currentActivityIdx: number;
  currentActivityTitle: string;
  // Sanity activity _id — optional because legacy callers may not yet pass it.
  // LogMode collects these into the entry's sourceActivityIds[].
  currentActivityId?: string;
  onAddCapture: (item: QuickCaptureItem) => void;
  onRemoveCapture: (timestamp: number) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { isRecording, isSupported: voiceSupported, start: startVoice, stop: stopVoice } = useSpeechRecognition({
    onTranscript: (transcript) => {
      setNoteOpen(true);
      setNoteText((prev) => prev + (prev ? ' ' : '') + transcript);
    },
  });

  const addNote = () => {
    const text = noteText.trim();
    if (!text) return;
    onAddCapture({
      type: 'note',
      content: text,
      activityIdx: currentActivityIdx,
      activityTitle: currentActivityTitle,
      activityId: currentActivityId,
      timestamp: Date.now(),
    });
    setNoteText('');
    setNoteOpen(false);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      const fileToUpload = await compressImageFile(file);
      form.append('file', fileToUpload);
      const res = await fetch('/api/evidence/upload', { method: 'POST', body: form });
      if (!res.ok) {
        if (res.status === 413) {
          toast('That photo is too large to upload — try a smaller one.', 'error');
          return;
        }
        const err = await res.json().catch(() => ({ error: 'Upload failed. Please try again.' }));
        toast(err.error ?? 'Upload failed. Please try again.', 'error');
        return;
      }
      const { pathname } = (await res.json()) as { pathname: string };
      onAddCapture({
        type: 'photo',
        content: pathname,
        activityIdx: currentActivityIdx,
        activityTitle: currentActivityTitle,
        activityId: currentActivityId,
        timestamp: Date.now(),
      });
    } catch {
      // A body that exceeds the platform request limit can surface as a network
      // error before any JSON response — name the likely cause (an oversized
      // photo) rather than a bare connection failure.
      toast('Couldn’t upload that photo — it may be too large. Try a smaller one.', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="bg-surface-raised rounded-lg border border-border-subtle p-md space-y-sm">
      <div className="flex gap-xs flex-wrap">
        <button
          onClick={() => setNoteOpen((v) => !v)}
          className="hearth-press min-h-[40px] inline-flex items-center gap-xs font-sans text-sm px-sm py-xs rounded-md border border-border-subtle bg-surface-panel text-text-secondary hover:border-border-medium hover:text-text-primary"
        >
          <PencilSimple size={14} aria-hidden="true" /> Note
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="hearth-press min-h-[40px] inline-flex items-center gap-xs font-sans text-sm px-sm py-xs rounded-md border border-border-subtle bg-surface-panel text-text-secondary hover:border-border-medium hover:text-text-primary disabled:opacity-50"
        >
          <Camera size={14} aria-hidden="true" /> {uploading ? 'Uploading…' : 'Photo'}
        </button>
        {voiceSupported && (
          <button
            onClick={isRecording ? stopVoice : startVoice}
            className={`hearth-press min-h-[40px] inline-flex items-center gap-xs font-sans text-sm px-sm py-xs rounded-md border ${
              isRecording
                ? 'border-ember bg-ember/10 text-ember'
                : 'border-border-subtle bg-surface-panel text-text-secondary hover:border-border-medium hover:text-text-primary'
            }`}
          >
            <Microphone size={14} aria-hidden="true" /> {isRecording ? 'Recording…' : 'Voice'}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
          className="hidden"
        />
      </div>

      {noteOpen && (
        <div className="space-y-xs">
          <textarea
            rows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Quick observation..."
            className="w-full bg-surface-panel border border-border-subtle rounded-md px-sm py-xs font-serif text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium resize-none"
            autoFocus
          />
          <div className="flex gap-xs justify-end">
            <button
              onClick={() => { setNoteOpen(false); setNoteText(''); }}
              className="min-h-[40px] px-sm font-sans text-xs text-text-muted hover:text-text-secondary transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]"
            >
              Cancel
            </button>
            <button
              onClick={addNote}
              disabled={!noteText.trim()}
              className="hearth-press min-h-[40px] font-sans text-xs font-semibold bg-ember text-text-inverse rounded-md px-sm py-xs hover:bg-ember-hover disabled:opacity-50"
            >
              Add Note
            </button>
          </div>
        </div>
      )}

      {captures.length > 0 && (
        <div className="space-y-xs pt-xs border-t border-border-subtle">
          {captures.map((cap) => (
            <div
              key={cap.timestamp}
              className="flex items-start gap-xs bg-surface-panel rounded-md p-xs border border-border-subtle"
            >
              <span className="shrink-0 inline-flex text-text-secondary" aria-hidden="true">
                {cap.type === 'photo' ? <Camera size={14} /> : <PencilSimple size={14} />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[10px] text-text-muted truncate">{cap.activityTitle}</p>
                {cap.type === 'photo' ? (
                  // Vercel Blob photo capture, intrinsic dimensions unknown
                  // and the layout uses max-h flow rather than a sized box —
                  // next/image's required width/height/fill don't fit here.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={evidenceSrc(cap.content)} alt="Capture" className="mt-xs rounded max-h-12 object-cover" />
                ) : (
                  <p className="font-serif text-xs text-text-secondary line-clamp-2">{cap.content}</p>
                )}
              </div>
              <button
                onClick={() => onRemoveCapture(cap.timestamp)}
                className="shrink-0 text-text-muted hover:text-red-400 transition-colors duration-[var(--motion-quick)]"
                aria-label="Remove capture"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
