'use client';

import { useState, useRef } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { Camera, Quotes, PencilSimple, LinkSimple, Microphone } from '@/components/icons';

export type CaptureItem = {
  type: 'photo' | 'quote' | 'note' | 'link' | 'audio';
  content: string;
  caption?: string;
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
 * Used inline in FacilitateMode and composed inside EvidenceModal.
 * Calls onCapture with the finished item; does NOT render a save button when
 * `hideSaveButton` is true (the parent provides its own).
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    selectedFileRef.current = file;
    setPreviewUrl(URL.createObjectURL(file));
  };

  const canSave = () => {
    switch (activeTab) {
      case 'photo': return !!selectedFileRef.current;
      case 'quote':
      case 'note': return !!textContent.trim();
      case 'link': return !!(linkUrl.trim() || linkName.trim());
      case 'audio': return false; // audio recording deferred to task 2.2
      default: return false;
    }
  };

  const handleSave = async () => {
    if (activeTab === 'photo' && selectedFileRef.current) {
      setUploading(true);
      try {
        const form = new FormData();
        form.append('file', selectedFileRef.current);
        const res = await fetch('/api/evidence/upload', { method: 'POST', body: form });
        if (!res.ok) {
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
        alert('Upload failed. Check your connection and try again.');
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
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
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
        <div className="rounded-md border border-border-subtle bg-surface-raised p-md text-center">
          <p className="font-sans text-xs text-text-muted">
            Audio capture coming soon — use Voice in Quick Capture for now.
          </p>
        </div>
      )}

      {!hideSaveButton && (
        <button
          onClick={handleSave}
          disabled={uploading || !canSave()}
          className="w-full rounded-md bg-ember py-sm font-sans text-sm font-semibold text-text-inverse hover:bg-ember-hover transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] min-h-[44px] disabled:opacity-40"
        >
          {uploading ? 'Uploading...' : saveLabel}
        </button>
      )}
    </div>
  );
}
