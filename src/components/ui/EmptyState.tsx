'use client';

import Link from 'next/link';

interface EmptyStateCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  emoji: string;
  heading: string;
  body: string;
  cta?: EmptyStateCta;
  variant?: 'card' | 'inline';
}

export default function EmptyState({
  emoji,
  heading,
  body,
  cta,
  variant = 'card',
}: EmptyStateProps) {
  const content = (
    <>
      <span className="text-4xl">{emoji}</span>
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
            className="rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[var(--ease-default)] hover:bg-ember-hover"
          >
            {cta.label}
          </Link>
        ) : (
          <button
            onClick={cta.onClick}
            className="rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[var(--ease-default)] hover:bg-ember-hover"
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
