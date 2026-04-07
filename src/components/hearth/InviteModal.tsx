'use client';

import { useState } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';

interface InviteModalProps {
  hearthId: string;
  isOpen: boolean;
  onClose: () => void;
}

type InviteState = 'idle' | 'loading' | 'generated';

export default function InviteModal({ hearthId, isOpen, onClose }: InviteModalProps) {
  const [state, setState] = useState<InviteState>('idle');
  const [joinUrl, setJoinUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const trapRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  async function generateLink() {
    setState('loading');
    setError('');
    setCopied(false);

    try {
      const res = await fetch(`/api/hearths/${hearthId}/invite`, { method: 'POST' });
      if (res.ok) {
        const data = (await res.json()) as { code: string };
        setJoinUrl(`${window.location.origin}/hearths/join/${data.code}`);
        setState('generated');
      } else {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Failed to generate invite link.');
        setState('idle');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setState('idle');
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRegenerate() {
    setState('idle');
    setJoinUrl('');
    setCopied(false);
    generateLink();
  }

  return (
    <div
      className="fixed inset-0 bg-overlay-backdrop z-[200] flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div ref={trapRef} role="dialog" aria-modal="true" aria-labelledby="invite-modal-title" className="bg-surface-panel border border-border-subtle rounded-[24px] p-2xl w-[90%] max-w-[520px] max-h-[85vh] overflow-y-auto shadow-warm" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-md">
          <h2 id="invite-modal-title" className="font-serif text-xl font-semibold text-text-primary">
            Invite Families
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary font-sans text-sm transition-all duration-200 ml-md"
          >
            ✕
          </button>
        </div>

        {state === 'idle' && (
          <div>
            <p className="font-serif text-[0.95rem] text-text-secondary mb-lg leading-relaxed">
              Generate a shareable invite link for families to join this Hearth.
            </p>
            {error && (
              <p className="font-sans text-sm text-red-400 mb-md">{error}</p>
            )}
            <div className="flex justify-end gap-md mt-xl pt-lg border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-surface-raised text-text-primary border border-border-subtle rounded-[10px] font-sans text-sm font-medium cursor-pointer hover:bg-surface-hover transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generateLink}
                className="px-6 py-3 bg-ember text-text-inverse font-sans text-sm font-semibold rounded-[10px] cursor-pointer hover:bg-ember-hover transition-all duration-200"
              >
                Generate Invite Link
              </button>
            </div>
          </div>
        )}

        {state === 'loading' && (
          <div className="py-xl text-center">
            <p className="font-sans text-sm text-text-muted">Generating link…</p>
          </div>
        )}

        {state === 'generated' && (
          <div>
            <p className="font-serif text-[0.95rem] text-text-secondary mb-md leading-relaxed">
              Share this link with families to invite them to your Hearth.
            </p>

            {/* URL + Copy */}
            <div className="mb-sm">
              <label className="font-sans text-sm font-medium text-text-secondary mb-sm block">
                Invite link
              </label>
              <div className="flex gap-sm">
                <input
                  type="text"
                  readOnly
                  value={joinUrl}
                  className="flex-1 p-3 px-md bg-surface-raised border border-border-subtle rounded-[10px] text-text-primary font-serif text-[0.95rem] focus:outline-none focus:border-ember focus:shadow-[0_0_0_3px_rgba(217,123,58,0.15)] min-w-0"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2 bg-surface-raised text-text-primary border border-border-subtle rounded-[10px] font-sans text-sm font-medium cursor-pointer hover:bg-surface-hover transition-all duration-200 shrink-0"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="font-sans text-xs text-text-muted mt-xs">
                Expires in 14 days
              </p>
            </div>

            {error && (
              <p className="font-sans text-sm text-red-400 mb-md">{error}</p>
            )}

            <div className="flex justify-between items-center mt-xl pt-lg border-t border-border-subtle">
              <button
                type="button"
                onClick={handleRegenerate}
                className="font-sans text-sm text-text-secondary hover:text-text-primary underline underline-offset-2 transition-all duration-200 cursor-pointer"
              >
                Generate new link
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-surface-raised text-text-primary border border-border-subtle rounded-[10px] font-sans text-sm font-medium cursor-pointer hover:bg-surface-hover transition-all duration-200"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
