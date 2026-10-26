'use client';

import { Camera, X } from '@/components/icons';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { photoReadCopy } from './photoReadCopy';

export type PhotoReadDisclosureProps = {
  /** Read could run for this family now (flag + allowlist); else the sheet says so. */
  readAvailable: boolean;
  /**
   * The parent's answer. Called synchronously from the button's click so the
   * caller can open the camera inside the same user gesture (iOS needs that).
   */
  onAnswer: (optIn: boolean) => void;
  /** Closed without answering (Escape, backdrop, close button). Nothing is stored. */
  onDismiss: () => void;
};

const SECTION_TITLE = 'font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted';
const BODY = 'body-serif text-[0.95rem] leading-relaxed text-text-secondary';

/**
 * The first-photo disclosure (pivot P4, D-LP-4, W3.2). Shown once, the first
 * time a family adds a photo, before the camera opens. It says what is sent,
 * what is kept and how to turn it off, then stores the answer in
 * `families.photo_read_opt_in` through the caller. Copy lives in photoReadCopy
 * (pending Drew's approval).
 */
export function PhotoReadDisclosure({ readAvailable, onAnswer, onDismiss }: PhotoReadDisclosureProps) {
  const trapRef = useFocusTrap(true);
  const c = photoReadCopy.sheet;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center lg:items-center">
      <div className="hearth-backdrop-enter backdrop-modal absolute inset-0" onClick={onDismiss} aria-hidden="true" />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-read-title"
        aria-describedby="photo-read-intro"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onDismiss();
        }}
        className="hearth-modal-enter relative flex max-h-[90dvh] w-full max-w-lg flex-col gap-lg overflow-y-auto overscroll-contain rounded-t-xl border border-border-subtle bg-surface-panel p-xl shadow-float lg:rounded-xl"
      >
        <div className="flex items-start justify-between gap-md">
          <div className="flex flex-col gap-xs">
            <span className="inline-flex items-center gap-xs font-sans text-[11px] uppercase tracking-[0.08em] text-text-muted">
              <Camera size={14} aria-hidden="true" />
              {c.overline}
            </span>
            <h2 id="photo-read-title" className="heading font-serif text-xl font-semibold text-text-primary">
              {c.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={c.closeLabel}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-text-muted hover:text-text-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p id="photo-read-intro" className={BODY}>
          {c.intro}
        </p>

        <dl className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <dt className={SECTION_TITLE}>{c.whatIsSentTitle}</dt>
            <dd className={BODY}>{c.whatIsSent}</dd>
          </div>
          <div className="flex flex-col gap-xs">
            <dt className={SECTION_TITLE}>{c.whatIsKeptTitle}</dt>
            <dd className={BODY}>{c.whatIsKept}</dd>
          </div>
          <div className="flex flex-col gap-xs">
            <dt className={SECTION_TITLE}>{c.turnOffTitle}</dt>
            <dd className={BODY}>{c.turnOff}</dd>
          </div>
        </dl>

        {!readAvailable && (
          <p className="rounded-md border border-border-subtle bg-surface-raised p-md font-sans text-[13px] text-text-secondary">
            {c.notYetAvailable}
          </p>
        )}

        <div className="flex flex-col gap-sm sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => onAnswer(true)}
            className="min-h-[44px] rounded-md bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse hover:bg-ember-hover"
          >
            {c.accept}
          </button>
          <button
            type="button"
            onClick={() => onAnswer(false)}
            className="min-h-[44px] rounded-md border border-border-subtle bg-transparent px-md py-sm font-sans text-sm font-semibold text-text-secondary hover:border-border-medium hover:text-text-primary"
          >
            {c.decline}
          </button>
        </div>
        <div aria-hidden="true" className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
}
