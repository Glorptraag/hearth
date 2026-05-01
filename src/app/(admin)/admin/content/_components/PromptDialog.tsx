'use client';

import { useState, useRef, useEffect } from 'react';

interface PromptDialogProps {
  open: boolean;
  title: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({ open, ...props }: PromptDialogProps) {
  // Unmount on close so state (input value) resets naturally on reopen —
  // avoids calling setState synchronously inside an effect.
  if (!open) return null;
  return <PromptDialogBody {...props} />;
}

type PromptDialogBodyProps = Omit<PromptDialogProps, 'open'>;

function PromptDialogBody({ title, placeholder, onSubmit, onCancel }: PromptDialogBodyProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-modal"
      onClick={onCancel}
    >
      <div
        className="bg-surface-panel border border-border-subtle rounded-lg shadow-float p-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h3 className="font-serif text-base font-semibold text-text-primary mb-md">{title}</h3>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 bg-surface-raised border border-border-subtle rounded-[8px] text-text-primary font-sans text-sm outline-none focus:border-ember focus:shadow-focus mb-lg"
        />
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
            onClick={handleSubmit}
            className="px-4 py-2 bg-ember text-text-inverse font-sans text-sm font-semibold rounded-[8px] hover:bg-ember-hover transition-colors duration-150"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
