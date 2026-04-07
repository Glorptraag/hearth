'use client';

import { PortableText } from '@portabletext/react';

export const ptComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-3 font-serif text-base leading-relaxed text-text-primary">{children}</p>
    ),
    sayBlock: ({ children }: { children?: React.ReactNode }) => (
      <div className="border-l-[3px] border-ember pl-lg my-lg">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ember mb-sm">What to Say</p>
        <p className="font-serif text-lg text-text-primary leading-relaxed">{children}</p>
      </div>
    ),
    pauseNote: ({ children }: { children?: React.ReactNode }) => (
      <div className="flex items-start gap-sm p-md bg-surface-raised rounded-md my-lg">
        <span className="text-ember shrink-0">⏸</span>
        <p className="font-sans text-sm text-text-secondary leading-relaxed">{children}</p>
      </div>
    ),
    watchBlock: ({ children }: { children?: React.ReactNode }) => (
      <div className="border-l-[3px] border-sage pl-lg my-lg">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-sage mb-sm">Watch For</p>
        <p className="font-serif text-sm text-text-secondary leading-relaxed">{children}</p>
      </div>
    ),
  },
};

export function HearthPortableText({ value }: { value: Parameters<typeof PortableText>[0]['value'] }) {
  return <PortableText value={value} components={ptComponents} />;
}
