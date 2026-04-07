'use client';

import { useState, useRef } from 'react';
import type { QuickCaptureItem } from './types';

export default function QuickCapture({
  captures,
  currentActivityIdx,
  currentActivityTitle,
  onAddCapture,
  onRemoveCapture,
}: {
  captures: QuickCaptureItem[];
  currentActivityIdx: number;
  currentActivityTitle: string;
  onAddCapture: (item: QuickCaptureItem) => void;
  onRemoveCapture: (timestamp: number) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addNote = () => {
    const text = noteText.trim();
    if (!text) return;
    onAddCapture({
      type: 'note',
      content: text,
      activityIdx: currentActivityIdx,
      activityTitle: currentActivityTitle,
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
      form.append('file', file);
      const res = await fetch('/api/evidence/upload', { method: 'POST', body: form });
      if (res.ok) {
        const { url } = (await res.json()) as { url: string };
        onAddCapture({
          type: 'photo',
          content: url,
          activityIdx: currentActivityIdx,
          activityTitle: currentActivityTitle,
          timestamp: Date.now(),
        });
      }
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
          className="font-sans text-sm px-sm py-xs rounded-md border border-border-subtle bg-surface-panel text-text-secondary hover:border-border-medium hover:text-text-primary transition-all duration-200"
        >
          ✏️ Note
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="font-sans text-sm px-sm py-xs rounded-md border border-border-subtle bg-surface-panel text-text-secondary hover:border-border-medium hover:text-text-primary transition-all duration-200 disabled:opacity-50"
        >
          {uploading ? '📷 Uploading...' : '📷 Photo'}
        </button>
        <button
          disabled
          title="Coming soon"
          className="font-sans text-sm px-sm py-xs rounded-md border border-border-subtle bg-surface-panel text-text-muted cursor-not-allowed opacity-50"
        >
          🎤 Voice
        </button>
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
              className="font-sans text-xs text-text-muted hover:text-text-secondary transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={addNote}
              disabled={!noteText.trim()}
              className="font-sans text-xs font-semibold bg-ember text-text-inverse rounded-md px-sm py-xs hover:bg-ember-hover transition-all duration-200 disabled:opacity-50"
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
              <span className="shrink-0 text-xs">{cap.type === 'photo' ? '📷' : '✏️'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[10px] text-text-muted truncate">{cap.activityTitle}</p>
                {cap.type === 'photo' ? (
                  <img src={cap.content} alt="Capture" className="mt-xs rounded max-h-12 object-cover" />
                ) : (
                  <p className="font-serif text-xs text-text-secondary line-clamp-2">{cap.content}</p>
                )}
              </div>
              <button
                onClick={() => onRemoveCapture(cap.timestamp)}
                className="shrink-0 font-sans text-[10px] text-text-muted hover:text-red-400 transition-colors duration-200"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
