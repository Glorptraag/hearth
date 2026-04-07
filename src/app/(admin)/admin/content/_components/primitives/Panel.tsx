'use client';

import { useState, type ReactNode } from 'react';

interface PanelProps {
  title: string;
  emoji: string;
  right?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Panel({ title, emoji, right, defaultOpen = true, children }: PanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface-panel border border-border-subtle rounded-lg mb-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-xl py-md cursor-pointer border-b border-transparent data-[open=true]:border-border-subtle"
        data-open={open}
      >
        <h2 className="font-serif text-base font-semibold text-text-primary flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          {title}
        </h2>
        <div className="flex items-center gap-2.5">
          {right}
          <span className="text-text-muted text-xs">{open ? '▼' : '▶'}</span>
        </div>
      </button>
      {open && <div className="p-xl">{children}</div>}
    </div>
  );
}
