'use client';

import { useState, useId, useRef, useEffect } from 'react';

type LoggerMode = 'guided' | 'quick';

interface GuidedModeToggleProps {
  mode: LoggerMode;
  onChange: (mode: LoggerMode) => void;
}

export function GuidedModeToggle({ mode, onChange }: GuidedModeToggleProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popoverOpen]);

  // Close popover on Escape
  useEffect(() => {
    if (!popoverOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setPopoverOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [popoverOpen]);

  const handleModeChange = async (next: LoggerMode) => {
    onChange(next);
    // Persist override to the family row (fire-and-forget)
    fetch('/api/family', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loggerDefaultMode: next }),
    }).catch(() => {/* non-critical — mode is already applied locally */});
  };

  return (
    <div className="relative flex items-center gap-xs">
      {/* Toggle */}
      <div
        role="group"
        aria-label="Logger mode"
        className="flex rounded-md border border-border-subtle bg-surface-raised overflow-hidden"
      >
        <button
          type="button"
          aria-pressed={mode === 'guided'}
          onClick={() => handleModeChange('guided')}
          className={[
            'min-h-[36px] px-md py-xs font-sans text-xs font-semibold transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]',
            mode === 'guided'
              ? 'bg-ember text-text-inverse'
              : 'text-text-secondary hover:text-text-primary',
          ].join(' ')}
        >
          Guided
        </button>
        <button
          type="button"
          aria-pressed={mode === 'quick'}
          onClick={() => handleModeChange('quick')}
          className={[
            'min-h-[36px] px-md py-xs font-sans text-xs font-semibold transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]',
            mode === 'quick'
              ? 'bg-surface-panel text-text-primary'
              : 'text-text-secondary hover:text-text-primary',
          ].join(' ')}
        >
          Quick
        </button>
      </div>

      {/* Info button */}
      <button
        ref={buttonRef}
        type="button"
        aria-label="About logger modes"
        aria-expanded={popoverOpen}
        aria-controls={popoverId}
        onClick={() => setPopoverOpen((v) => !v)}
        className="hit-target h-5 w-5 rounded-full border border-border-subtle bg-surface-raised text-text-muted hover:text-text-secondary hover:border-border-medium transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] font-sans text-xs flex items-center justify-center"
      >
        ?
      </button>

      {/* Popover */}
      {popoverOpen && (
        <div
          id={popoverId}
          ref={popoverRef}
          role="tooltip"
          className="hearth-popover-enter absolute top-full right-0 mt-xs z-20 w-64 rounded-lg border border-border-subtle bg-surface-panel shadow-float p-md"
        >
          <p className="font-serif text-sm font-semibold text-text-primary mb-xs">
            Guided Mode
          </p>
          <p className="font-sans text-xs text-text-secondary mb-sm leading-relaxed">
            Chip unfolds, depth questions, and a raised completeness gate. Best for building your observation eye. Default for first 20 entries.
          </p>
          <p className="font-serif text-sm font-semibold text-text-primary mb-xs">
            Quick Mode
          </p>
          <p className="font-sans text-xs text-text-secondary leading-relaxed">
            Skips the depth prompts and the higher completeness bar, so you can capture fast and move on. Best once you&apos;ve got your eye in.
          </p>
        </div>
      )}
    </div>
  );
}
