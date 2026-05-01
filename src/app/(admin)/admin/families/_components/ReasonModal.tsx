'use client';

import { useState } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function ReasonModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = useState('');
  const trapRef = useFocusTrap(open);

  if (!open) return null;

  function handleConfirm() {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  }

  function handleCancel() {
    setReason('');
    onCancel();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-modal"
      onClick={handleCancel}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-float"
      >
        <h2
          id="reason-modal-title"
          className="font-sans text-base font-semibold text-text-primary mb-sm"
        >
          {title}
        </h2>
        <p className="font-sans text-sm text-text-secondary mb-lg">
          {description}
        </p>

        <label className="block font-sans text-xs font-semibold text-text-muted uppercase tracking-wider mb-xs">
          Reason for access
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Support ticket #42, family reported stale dashboard..."
          className="w-full rounded-md border border-border-subtle bg-surface-body px-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none transition-colors duration-200 resize-none mb-lg"
          autoFocus
        />

        <div className="flex gap-sm justify-end">
          <button
            onClick={handleCancel}
            className="rounded-md border border-border-subtle px-md py-sm font-sans text-[0.8rem] font-medium text-text-muted hover:text-text-secondary transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
            className="rounded-md bg-ember px-md py-sm font-sans text-[0.8rem] font-semibold text-text-inverse hover:bg-ember-hover disabled:opacity-50 transition-all duration-200"
          >
            {loading ? 'Loading...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
