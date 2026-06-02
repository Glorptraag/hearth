'use client';

import { useFocusTrap } from '@/hooks/use-focus-trap';
import { X } from '@/components/icons';
import type { DraftEvidenceItem as EvidenceItem } from '@/lib/logger/draft';
import { CaptureTray, type CaptureItem } from '@/components/log/CaptureTray';

/**
 * Evidence capture modal — photo upload, child quote, note, or link.
 * Composes CaptureTray for its content body; modal chrome (backdrop, title,
 * close button) is unchanged from the user's perspective.
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
  const trapRef = useFocusTrap(true);

  const titles: Record<string, string> = {
    photo: 'Add Photo',
    quote: "Child's Words",
    note: 'Add Note',
    link: 'Link Resource',
    audio: 'Record Audio',
  };

  const handleCapture = (item: CaptureItem) => {
    if (item.type === 'photo') {
      onSave({ type: 'photo', content: item.content, caption: item.caption });
    } else if (item.type === 'quote') {
      onSave({ type: 'quote', content: item.content });
    } else if (item.type === 'note') {
      onSave({ type: 'note', content: item.content });
    } else if (item.type === 'link') {
      onSave({ type: 'link', content: item.caption ?? item.content, name: item.caption, url: item.content });
    }
    onClose();
  };

  const validTab = (['photo', 'quote', 'note', 'link', 'audio'] as const).includes(
    type as 'photo' | 'quote' | 'note' | 'link' | 'audio'
  )
    ? (type as 'photo' | 'quote' | 'note' | 'link' | 'audio')
    : 'note';

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 backdrop-modal" onClick={onClose} />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-modal-title"
        className="relative w-full max-w-lg rounded-t-xl lg:rounded-xl border border-border-subtle bg-surface-panel p-xl shadow-float"
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      >
        <div className="flex items-center justify-between mb-lg">
          <h3 id="evidence-modal-title" className="font-serif text-lg font-semibold text-text-primary">
            {titles[type] ?? titles.note}
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <CaptureTray
          initialTab={validTab}
          onCapture={handleCapture}
          saveLabel="Add Evidence"
        />
      </div>
    </div>
  );
}
