'use client';

import { useState } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';

interface ReflectionModalProps {
  isOpen: boolean;
  sessionId: string;
  hearthId: string;
  hearthName: string;
  sessionTitle: string;
  onClose: () => void;
  onShared?: () => void;
  onSkipped?: () => void;
}

export default function ReflectionModal({
  isOpen, sessionId, hearthId, hearthName, sessionTitle,
  onClose, onShared, onSkipped,
}: ReflectionModalProps) {
  const [reflectionText, setReflectionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const trapRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  const handleSkip = () => {
    onSkipped?.();
    onClose();
  };

  const handleShare = async () => {
    if (!reflectionText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/hearths/${hearthId}/sessions/${sessionId}/reflections`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reflectionText: reflectionText.trim() }),
        }
      );
      if (res.ok) {
        onShared?.();
        onClose();
      }
    } catch {
      // Silent failure — reflection is optional
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-overlay-backdrop z-[200] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) handleSkip(); }}
    >
      <div ref={trapRef} role="dialog" aria-modal="true" aria-labelledby="reflection-modal-title" className="bg-surface-panel border border-border-subtle rounded-[24px] p-2xl w-[90%] max-w-[520px] max-h-[85vh] overflow-y-auto shadow-warm" onKeyDown={(e) => { if (e.key === 'Escape') handleSkip(); }}>
        {/* Success header */}
        <div className="text-center text-3xl mb-md" aria-hidden="true">✓</div>
        <h2 id="reflection-modal-title" className="font-serif text-xl font-semibold text-center mb-md">
          Entry saved
        </h2>
        <p className="font-serif text-[0.95rem] text-text-secondary text-center leading-relaxed mb-xl">
          Your {sessionTitle} session is now part of your family&apos;s learning records.
        </p>

        {/* Reflection card */}
        <div className="bg-surface-raised border border-border-subtle rounded-lg p-xl">
          <h3 className="font-serif text-base font-semibold mb-sm">
            Share a reflection with your group?
          </h3>
          <p className="font-serif text-sm text-text-secondary leading-relaxed mb-md">
            Help build the {hearthName}&apos;s story. What stood out? What continued at home?
            What are you grateful for? This is visible to all members.
          </p>
          <textarea
            className="w-full p-3 px-md bg-surface-body border border-border-subtle rounded-[10px] text-text-primary font-serif text-[0.95rem] focus:outline-none focus:border-ember focus:shadow-[0_0_0_3px_rgba(217,123,58,0.15)] min-h-[80px] resize-y leading-relaxed placeholder:text-text-muted"
            placeholder="e.g. 'Emma couldn't stop talking about the tadpoles on the drive home...'"
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
          />
          <div className="font-sans text-xs text-text-muted mt-sm">
            These reflections become part of your Hearth&apos;s collective story
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-md mt-xl pt-lg border-t border-border-subtle">
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-surface-raised text-text-primary border border-border-subtle rounded-[10px] font-sans text-sm font-medium cursor-pointer hover:bg-surface-hover transition-all duration-200"
          >
            Skip
          </button>
          <button
            onClick={handleShare}
            disabled={!reflectionText.trim() || submitting}
            className="px-6 py-3 bg-ember text-text-inverse font-sans text-sm font-semibold rounded-[10px] cursor-pointer hover:bg-ember-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Sharing...' : 'Share with group'}
          </button>
        </div>
      </div>
    </div>
  );
}
