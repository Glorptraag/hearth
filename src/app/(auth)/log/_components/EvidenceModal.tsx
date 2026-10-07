'use client';

import { useState, useRef } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useToast } from '@/hooks/use-toast';
import { compressImageFile } from '@/lib/images/compress-image';
import { X, Camera } from '@/components/icons';
import type { DraftEvidenceItem as EvidenceItem } from '@/lib/logger/draft';

/**
 * Evidence capture modal — photo upload, child quote, note, or link. Manages its
 * own input/upload state and hands the finished item back via onSave. Extracted
 * verbatim from log/page.tsx; behaviour and markup are unchanged.
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
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);
  const trapRef = useFocusTrap(true);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    selectedFileRef.current = file;
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (type === 'photo' && selectedFileRef.current) {
      setUploading(true);
      try {
        const formData = new FormData();
        const fileToUpload = await compressImageFile(selectedFileRef.current);
        formData.append('file', fileToUpload);
        const res = await fetch('/api/evidence/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          if (res.status === 413) {
            toast('That photo is too large to upload — try a smaller one.', 'error');
            return;
          }
          const err = await res.json().catch(() => ({ error: 'Upload failed. Please try again.' }));
          toast(err.error ?? 'Upload failed. Please try again.', 'error');
          return;
        }
        const { pathname } = await res.json();
        onSave({ type: 'photo', content: pathname, caption });
      } catch {
        // A body that exceeds the platform request limit can surface as a network
        // error before any JSON response — name the likely cause (an oversized
        // photo) rather than a bare connection failure.
        toast('Couldn’t upload that photo — it may be too large. Try a smaller one.', 'error');
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
    quote: "Child's Words",
    note: 'Add Note',
    link: 'Link Resource',
  };

  // Gate the action so a tap with nothing entered isn't a silent no-op. Photo
  // readiness tracks `previewUrl` (state) since the File itself lives in a ref.
  const canSubmit =
    type === 'photo'
      ? !!previewUrl
      : type === 'link'
        ? !!(linkName.trim() || linkUrl.trim())
        : !!content.trim();

  return (
    <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 hearth-backdrop-enter backdrop-modal" onClick={onClose} />
      <div ref={trapRef} role="dialog" aria-modal="true" aria-labelledby="evidence-modal-title" className="hearth-modal-enter relative w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-xl lg:rounded-xl border border-border-subtle bg-surface-panel p-xl shadow-float" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
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
              className="w-full rounded-md border-2 border-dashed border-border-medium p-xl text-center font-sans text-sm text-text-secondary hover:border-ember transition duration-[var(--motion-quick)]"
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
          disabled={uploading || !canSubmit}
          className="mt-lg w-full rounded-md bg-ember py-sm font-sans text-sm font-semibold text-text-inverse hover:bg-ember-hover transition duration-[var(--motion-quick)] min-h-[44px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? 'Uploading...' : 'Add Evidence'}
        </button>
        {/* Reserve space for the iOS home indicator so the action button
            clears it on the bottom-sheet (mobile) layout. */}
        <div aria-hidden className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
}
