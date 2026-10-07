'use client';

import { useState } from 'react';
import { LEARNER_COLOUR_MAP } from '@/components/ui/LearnerAvatar';
import { Check, PencilSimple } from '@/components/icons';

interface ObservationCardProps {
  id: string;
  observerName: string;
  targetLearnerName: string;
  targetLearnerColour: string | null;
  observationText: string;
  evidenceIds?: string[];
  status: 'pending' | 'accepted' | 'dismissed';
  onAccept?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function ObservationCard({
  id, observerName, targetLearnerName, targetLearnerColour,
  observationText, status: initialStatus, onAccept, onDismiss, onEdit,
}: ObservationCardProps) {
  const [status, setStatus] = useState(initialStatus);

  const colourEntry = LEARNER_COLOUR_MAP[targetLearnerColour ?? 'rose'] ?? LEARNER_COLOUR_MAP.rose;

  const handleAccept = () => {
    setStatus('accepted');
    onAccept?.(id);
  };
  const handleDismiss = () => {
    setStatus('dismissed');
    onDismiss?.(id);
  };

  if (status === 'dismissed') {
    return (
      <div className="bg-surface-raised border border-border-subtle rounded-[10px] p-xl opacity-40">
        <span className="font-sans text-sm text-text-muted">Dismissed</span>
      </div>
    );
  }

  return (
    <div className={`bg-surface-raised border border-border-medium rounded-[10px] p-xl mb-lg ${status === 'accepted' ? 'border-l-[3px] border-l-sage' : 'border-l-[3px] border-l-ember'}`}>
      {/* Header */}
      <div className="flex items-center gap-sm mb-md">
        <span className="font-sans text-sm font-medium text-ember">{observerName} observed:</span>
        <span
          className={`px-2 py-0.5 rounded-[6px] font-sans text-xs font-medium border ${colourEntry.pill}`}
        >
          {targetLearnerName}
        </span>
      </div>

      {/* Text */}
      <p className="font-serif text-[0.95rem] text-text-secondary leading-relaxed italic mb-md">
        &ldquo;{observationText}&rdquo;
      </p>

      {/* Actions */}
      {status === 'pending' ? (
        <div className="flex gap-sm">
          <button onClick={handleAccept} className="inline-flex items-center gap-xs px-3.5 py-1.5 bg-sage/10 text-sage border border-sage/20 rounded-[6px] font-sans text-sm font-semibold cursor-pointer hover:bg-sage/20 transition duration-[var(--motion-quick)]">
            <Check size={14} aria-hidden="true" /> Accept
          </button>
          {onEdit && (
            <button onClick={() => onEdit(id)} className="inline-flex items-center gap-xs px-3.5 py-1.5 bg-transparent text-text-secondary border border-border-subtle rounded-[6px] font-sans text-sm cursor-pointer hover:bg-surface-hover transition duration-[var(--motion-quick)]">
              <PencilSimple size={14} aria-hidden="true" /> Edit &amp; Accept
            </button>
          )}
          <button onClick={handleDismiss} className="px-3.5 py-1.5 bg-transparent text-text-muted border-none font-sans text-sm cursor-pointer hover:text-text-secondary transition duration-[var(--motion-quick)]">
            Dismiss
          </button>
        </div>
      ) : (
        <span className="inline-flex items-center gap-xs px-2 py-0.5 bg-sage/10 text-sage border border-sage/20 rounded-[6px] font-sans text-sm font-semibold">
          <Check size={14} aria-hidden="true" /> Accepted — will appear in your entry
        </span>
      )}
    </div>
  );
}
