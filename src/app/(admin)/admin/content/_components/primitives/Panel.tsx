'use client';

import { useState, type ReactNode, type ComponentType } from 'react';
import { CaretDown } from '@/components/icons';

type IconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

interface PanelProps {
  title: string;
  Icon: IconC;
  right?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Panel({ title, Icon, right, defaultOpen = true, children }: PanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface-panel border border-border-subtle rounded-lg mb-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-xl py-md cursor-pointer border-b border-transparent data-[open=true]:border-border-subtle"
        data-open={open}
      >
        <h2 className="font-serif text-base font-semibold text-text-primary flex items-center gap-sm">
          <span className="inline-flex text-text-secondary" aria-hidden="true"><Icon size={18} /></span>
          {title}
        </h2>
        <div className="flex items-center gap-2.5">
          {right}
          <span className="text-text-muted" aria-hidden="true">
            <CaretDown size={12} className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
          </span>
        </div>
      </button>
      {open && <div className="p-xl">{children}</div>}
    </div>
  );
}
