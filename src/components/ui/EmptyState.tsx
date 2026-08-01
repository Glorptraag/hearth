'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';

interface EmptyStateCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

type IconComponent = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

interface EmptyStateProps {
  /** Phosphor icon component from `@/components/icons`. Preferred. */
  icon?: IconComponent;
  /** @deprecated Use `icon` (Phosphor) instead. Emoji kept only for incremental migration. */
  emoji?: string;
  heading: string;
  body: string;
  cta?: EmptyStateCta;
  variant?: 'card' | 'inline';
}

export default function EmptyState({
  icon: Icon,
  emoji,
  heading,
  body,
  cta,
  variant = 'card',
}: EmptyStateProps) {
  const visual = Icon ? (
    <span
      className="inline-flex h-12 w-12 items-center justify-center text-text-secondary"
      aria-hidden="true"
    >
      <Icon size={32} />
    </span>
  ) : emoji ? (
    <span className="text-4xl" aria-hidden="true">{emoji}</span>
  ) : null;

  const content = (
    <>
      {visual}
      <div>
        <h2 className="font-serif text-xl font-semibold text-text-primary">
          {heading}
        </h2>
        <p className="mt-xs font-sans text-sm text-text-secondary">{body}</p>
      </div>
      {cta &&
        (cta.href ? (
          <Link
            href={cta.href}
            className="rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:bg-ember-hover"
          >
            {cta.label}
          </Link>
        ) : (
          <button
            onClick={cta.onClick}
            className="rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:bg-ember-hover"
          >
            {cta.label}
          </button>
        ))}
    </>
  );

  if (variant === 'inline') {
    return (
      <div className="flex flex-col items-center gap-md py-xl text-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-md rounded-[16px] border border-border-subtle bg-surface-panel px-lg py-xl text-center shadow-card">
      {content}
    </div>
  );
}
