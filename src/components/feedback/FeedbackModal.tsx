'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  ChatCircleText,
  CheckCircle,
  HandHeart,
  Lightbulb,
  SealQuestion,
  WarningCircle,
  X,
} from '@/components/icons';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { track } from '@/lib/analytics/posthog';

/**
 * In-app pilot feedback capture (decisions log PR-1). Submissions land in
 * the `feedback` table via POST /api/feedback and are triaged into
 * docs/hearth-research-log.md. Cheap by design: the channel must cost the
 * parent less than the friction she's reporting (research log R7) — so one
 * category tap, one textarea, done.
 */

type Category = 'bug' | 'idea' | 'confusion' | 'praise';

const CATEGORIES: { id: Category; label: string; Icon: typeof Lightbulb }[] = [
  { id: 'bug', label: "Something's broken", Icon: WarningCircle },
  { id: 'confusion', label: 'I got lost', Icon: SealQuestion },
  { id: 'idea', label: 'An idea', Icon: Lightbulb },
  { id: 'praise', label: 'Something worked', Icon: HandHeart },
];

export function FeedbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const dialogRef = useFocusTrap(open);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const close = useCallback(() => {
    onClose();
    // Reset after the exit so a reopened modal starts fresh.
    setTimeout(() => {
      setCategory(null);
      setMessage('');
      setState('idle');
    }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;

  async function handleSubmit() {
    if (!category || !message.trim() || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ category, message: message.trim(), route: pathname }),
      });
      if (!res.ok) throw new Error(`feedback save failed: ${res.status}`);
      track('feedback_submitted', { category });
      setState('sent');
      setTimeout(close, 1600);
    } catch {
      setState('error');
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center backdrop-modal backdrop-blur-sm p-0 sm:items-center sm:p-lg"
      onClick={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="hearth-modal-enter w-full max-w-[440px] rounded-t-lg border border-border-subtle bg-surface-panel p-xl shadow-float sm:rounded-lg"
      >
        <div className="mb-md flex items-start justify-between gap-sm">
          <div className="flex items-center gap-sm">
            <ChatCircleText size={22} aria-hidden="true" className="text-ember" />
            <h2 id="feedback-modal-title" className="font-serif text-lg font-semibold text-text-primary">
              Tell us what happened
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close feedback form"
            className="rounded-full p-xs text-text-muted transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:text-text-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {state === 'sent' ? (
          <div className="flex items-center gap-sm py-lg" role="status">
            <CheckCircle size={22} aria-hidden="true" className="text-sage" />
            <p className="font-serif text-text-primary">
              Thank you — this goes straight into our research notes.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-md font-serif text-sm text-text-secondary">
              Big or small — if it slowed you down or made your day, we want to know.
            </p>

            <div className="mb-md grid grid-cols-2 gap-sm" role="radiogroup" aria-label="Feedback type">
              {CATEGORIES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={category === id}
                  onClick={() => setCategory(id)}
                  className={`flex items-center gap-sm rounded-md border px-md py-sm text-left font-sans text-sm font-medium transition-[border-color,background-color,color] duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
                    category === id
                      ? 'border-border-active bg-surface-raised text-text-primary'
                      : 'border-border-subtle text-text-secondary hover:border-border-medium hover:text-text-primary'
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="What were you doing, and what did you expect?"
              aria-label="Feedback message"
              className="mb-md w-full resize-none rounded-md border border-border-subtle bg-surface-input p-md font-sans text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:shadow-focus"
            />

            {state === 'error' && (
              <p className="mb-sm font-sans text-sm text-rose-text" role="alert">
                That didn&apos;t send — your note is still here, try again in a moment.
              </p>
            )}

            <div className="flex justify-end gap-sm">
              <button
                type="button"
                onClick={close}
                className="rounded-md border border-border-subtle bg-transparent px-md py-sm font-sans text-sm font-medium text-text-secondary transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:text-text-primary"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!category || !message.trim() || state === 'sending'}
                className="hearth-press rounded-md bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state === 'sending' ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Trigger + modal in one drop-in — used in Settings (desktop) and the mobile Settings tray. */
export function FeedbackButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          'flex items-center gap-xs rounded-md border border-border-subtle bg-transparent px-md py-sm font-sans text-sm font-medium text-text-secondary transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:border-border-medium hover:text-text-primary'
        }
      >
        <ChatCircleText size={16} aria-hidden="true" />
        Send feedback
      </button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
