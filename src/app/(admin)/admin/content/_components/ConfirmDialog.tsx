'use client';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-backdrop"
      onClick={onCancel}
    >
      <div
        className="bg-surface-panel border border-border-subtle rounded-lg shadow-medium p-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h3 className="font-serif text-base font-semibold text-text-primary mb-sm">{title}</h3>
        <p className="text-text-secondary text-sm font-sans mb-lg">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-surface-raised border border-border-subtle rounded-[8px] text-text-secondary font-sans text-sm hover:bg-surface-hover transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 font-sans text-sm font-semibold rounded-[8px] transition-colors duration-150 ${
              danger
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-ember text-text-inverse hover:bg-ember-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
