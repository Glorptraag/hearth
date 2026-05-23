'use client';

import { useState, useCallback, useEffect } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { PortableText } from '@portabletext/react';
import { Printer, X } from '@/components/icons';

type ReadingMode = 'standard' | 'short' | 'readAloud';

interface CommonsReaderProps {
  isOpen: boolean;
  title: string;
  kind?: string;
  tradition?: string;
  body?: unknown[];
  shortBody?: unknown[];
  readAloudVersion?: unknown[];
  estimatedReadAloudMinutes?: number;
  source?: string;
  onClose: () => void;
  onPrint?: () => void;
  returnLabel?: string;
}

// Portable text components for the reader — high-legibility reading surface
const readerPtComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-4 font-serif text-lg leading-[1.7] text-text-primary lg:text-[18px]">
        {children}
      </p>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="font-serif text-xl font-semibold text-text-primary mt-8 mb-3">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="font-serif text-lg font-semibold text-text-primary mt-6 mb-2">{children}</h3>
    ),
  },
  marks: {
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold">{children}</strong>
    ),
  },
};

// Read-aloud variant renders pacing notes in muted colour
const readAloudPtComponents = {
  ...readerPtComponents,
  block: {
    ...readerPtComponents.block,
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-4 font-serif text-lg leading-[1.8] text-text-primary lg:text-[18px] [&_.pacing]:text-text-tertiary [&_.pacing]:text-base [&_.pacing]:font-sans">
        {children}
      </p>
    ),
  },
};

export function CommonsReader({
  isOpen,
  title,
  kind,
  tradition,
  body,
  shortBody,
  readAloudVersion,
  estimatedReadAloudMinutes,
  source,
  onClose,
  onPrint,
  returnLabel = 'Back',
}: CommonsReaderProps) {
  const trapRef = useFocusTrap(isOpen);

  const hasShort = shortBody && shortBody.length > 0;
  const hasReadAloud = readAloudVersion && readAloudVersion.length > 0;
  const hasVariants = hasShort || hasReadAloud;

  const [mode, setMode] = useState<ReadingMode>('standard');

  const activeBody = mode === 'short' && hasShort
    ? shortBody
    : mode === 'readAloud' && hasReadAloud
      ? readAloudVersion
      : body;

  const activeComponents = mode === 'readAloud' ? readAloudPtComponents : readerPtComponents;

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset reading mode on open
      setMode('standard');
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const kindLabel = kind?.replace(/_/g, ' ') ?? '';
  const metaParts = [
    kindLabel,
    tradition,
    estimatedReadAloudMinutes ? `${estimatedReadAloudMinutes} min read-aloud` : '',
  ].filter(Boolean);

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="commons-reader-title"
      className="fixed inset-0 z-50 bg-surface-body overflow-y-auto"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-lg py-md bg-surface-body/95 backdrop-blur-sm border-b border-border-subtle">
        <button
          onClick={onClose}
          className="font-sans text-sm text-ember hover:text-ember/80 transition-colors duration-200"
        >
          ← {returnLabel}
        </button>
        <div className="flex items-center gap-sm">
          {onPrint && (
            <button
              onClick={onPrint}
              className="p-sm text-text-muted hover:text-text-primary transition-colors duration-200"
              aria-label="Print this text"
            >
              <Printer size={18} aria-hidden="true" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-sm text-text-muted hover:text-text-primary transition-colors duration-200"
            aria-label="Close reader"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[680px] mx-auto px-[20px] py-xl">
        {/* Title block */}
        <div className="mb-xl">
          <h1 id="commons-reader-title" className="font-serif text-[32px] font-semibold text-text-primary leading-tight mb-sm">
            {title}
          </h1>
          {metaParts.length > 0 && (
            <p className="font-sans text-[13px] text-text-muted">
              {metaParts.join(' · ')}
            </p>
          )}
        </div>

        {/* Mode switcher */}
        {hasVariants && (
          <div className="flex items-center gap-sm mb-xl">
            <ModeButton active={mode === 'standard'} onClick={() => setMode('standard')}>
              Standard
            </ModeButton>
            {hasShort && (
              <ModeButton active={mode === 'short'} onClick={() => setMode('short')}>
                Short
              </ModeButton>
            )}
            {hasReadAloud && (
              <ModeButton active={mode === 'readAloud'} onClick={() => setMode('readAloud')}>
                Read-aloud
              </ModeButton>
            )}
          </div>
        )}

        {/* Divider */}
        <hr className="border-border-subtle mb-xl" />

        {/* Body */}
        {activeBody && activeBody.length > 0 ? (
          <div className="commons-reader-body">
            <PortableText value={activeBody as Parameters<typeof PortableText>[0]['value']} components={activeComponents} />
          </div>
        ) : (
          <p className="font-serif text-base text-text-muted italic">No reading available.</p>
        )}

        {/* Divider */}
        <hr className="border-border-subtle mt-xl mb-lg" />

        {/* Source attribution */}
        {source && (
          <footer className="mb-xl">
            <p className="font-sans text-[12px] text-text-muted leading-relaxed">
              Source: {source}
            </p>
          </footer>
        )}
      </main>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-sans text-sm px-md py-xs rounded-[10px] border transition-all duration-200 ${
        active
          ? 'bg-ember text-text-inverse border-ember font-semibold'
          : 'bg-transparent text-text-secondary border-border-subtle hover:border-border-medium'
      }`}
    >
      {children}
    </button>
  );
}
