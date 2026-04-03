'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface JoinClientProps {
  hearthId: string;
  hearthName: string;
  hearthDescription: string | null;
  code: string;
}

export default function JoinClient({
  hearthId,
  hearthName,
  hearthDescription,
  code,
}: JoinClientProps) {
  const router = useRouter();
  const [consentObs, setConsentObs] = useState(true);
  const [consentEvidence, setConsentEvidence] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/hearths/${hearthId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          consentCrossObservation: consentObs,
          consentEvidenceSharing: consentEvidence,
        }),
      });
      if (res.ok) {
        router.push(`/hearths/${hearthId}`);
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to join');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-lg py-2xl">
      <div className="bg-surface-panel border border-border-subtle rounded-[10px] p-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        {/* Header */}
        <div className="text-center mb-xl">
          <div className="text-3xl mb-md">🏡</div>
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-sm">
            You&apos;ve been invited to join
          </p>
          <h1 className="font-serif text-2xl font-semibold text-text-primary mb-sm">
            {hearthName}
          </h1>
          {hearthDescription && (
            <p className="font-serif text-text-secondary leading-relaxed">
              {hearthDescription}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border-subtle mb-xl" />

        {/* Consent section */}
        <div className="mb-xl">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-md">
            Sharing preferences
          </p>

          {/* Cross-family observations */}
          <label className="flex items-start gap-md py-md border-b border-border-subtle cursor-pointer">
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm font-semibold text-text-primary mb-xs">
                Cross-family observations
              </p>
              <p className="font-serif text-sm text-text-secondary leading-snug">
                Allow members to share observations about your children
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentObs}
              onChange={(e) => setConsentObs(e.target.checked)}
              className="w-5 h-5 mt-xs accent-ember flex-shrink-0"
            />
          </label>

          {/* Shared evidence */}
          <label className="flex items-start gap-md py-md cursor-pointer">
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm font-semibold text-text-primary mb-xs">
                Shared evidence
              </p>
              <p className="font-serif text-sm text-text-secondary leading-snug">
                Allow your children to appear in shared session photos
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentEvidence}
              onChange={(e) => setConsentEvidence(e.target.checked)}
              className="w-5 h-5 mt-xs accent-ember flex-shrink-0"
            />
          </label>
        </div>

        {/* Error */}
        {error && (
          <p className="font-sans text-sm text-red-400 mb-md">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-md">
          <a
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-transparent border border-border-subtle text-text-secondary font-sans text-sm font-semibold rounded-[10px] hover:border-border-medium hover:text-text-primary transition-all duration-200"
          >
            Back to Dashboard
          </a>
          <button
            onClick={handleJoin}
            disabled={joining}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-ember text-text-inverse font-sans text-sm font-semibold rounded-[10px] hover:bg-ember-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {joining ? 'Joining…' : `Join ${hearthName}`}
          </button>
        </div>
      </div>
    </div>
  );
}
