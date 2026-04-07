'use client';

import { useState } from 'react';
import { AU_STATES } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const COPY_TEMPLATE = (name: string, code: string) =>
  `Hi ${name},

You're invited to join Hearth \u2014 the homeschool platform built for families who already know what they're doing.

Your invitation code:

${code}

To get started:
1. Visit https://app.hearth.au/signup
2. Paste your code when prompted
3. We'll take it from there.

Welcome to Hearth.

\u2014 Drew`;

export default function CreateInvitationModal({ open, onClose, onCreated }: Props) {
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ code: string; familyName: string } | null>(null);
  const [copied, setCopied] = useState<'code' | 'message' | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intendedFamilyName: familyName,
          intendedPrimaryEmail: email || undefined,
          intendedLocationState: state || undefined,
          sourceLabel: source || undefined,
          notes: notes || undefined,
          expiresAt: expiresAt.toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to create invitation');
      const data = await res.json();
      setResult({ code: data.invitation.code, familyName });
    } catch {
      alert('Failed to create invitation');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyCode() {
    if (!result) return;
    navigator.clipboard.writeText(result.code);
    setCopied('code');
    setTimeout(() => setCopied(null), 2000);
  }

  function handleCopyMessage() {
    if (!result) return;
    navigator.clipboard.writeText(COPY_TEMPLATE(result.familyName, result.code));
    setCopied('message');
    setTimeout(() => setCopied(null), 2000);
  }

  function handleDone() {
    setResult(null);
    setFamilyName('');
    setEmail('');
    setState('');
    setSource('');
    setNotes('');
    setExpiryDays(30);
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-backdrop" onClick={onClose}>
      <div
        className="w-full max-w-[480px] rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-medium"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-invitation-title"
      >
        {result ? (
          <div>
            <h2 id="create-invitation-title" className="font-serif text-lg font-semibold text-text-primary mb-lg">
              Invitation Created
            </h2>
            <p className="font-sans text-sm text-text-secondary mb-md">
              Code for {result.familyName}:
            </p>
            <div className="rounded-md bg-surface-raised border border-border-subtle p-md mb-md text-center">
              <span className="font-mono text-xl font-semibold text-ember tracking-wider">
                {result.code}
              </span>
            </div>
            <div className="flex gap-sm mb-lg">
              <button
                onClick={handleCopyCode}
                className="flex-1 rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-sans text-[0.8rem] font-medium text-text-secondary hover:text-text-primary hover:border-border-medium transition-all duration-200"
              >
                {copied === 'code' ? 'Copied!' : 'Copy code'}
              </button>
              <button
                onClick={handleCopyMessage}
                className="flex-1 rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-sans text-[0.8rem] font-medium text-text-secondary hover:text-text-primary hover:border-border-medium transition-all duration-200"
              >
                {copied === 'message' ? 'Copied!' : 'Copy as message'}
              </button>
            </div>
            <p className="font-sans text-xs text-text-muted mb-lg">
              This code is single-use. Once a family redeems it, it cannot be reused.
              The family will see &quot;Welcome, {result.familyName}&quot; when they sign up.
            </p>
            <button
              onClick={handleDone}
              className="w-full rounded-md bg-ember px-md py-sm font-sans text-[0.85rem] font-semibold text-text-inverse transition-all duration-200 hover:bg-ember-hover"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 id="create-invitation-title" className="font-serif text-lg font-semibold text-text-primary mb-lg">
              New Invitation
            </h2>

            <div className="mb-md">
              <label className="block font-sans text-[0.75rem] font-semibold text-text-muted uppercase tracking-wider mb-xs">
                Family name *
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                placeholder="The Morrison Family"
                className="w-full rounded-md border border-border-subtle bg-surface-body px-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none transition-colors duration-200"
              />
            </div>

            <div className="mb-md">
              <label className="block font-sans text-[0.75rem] font-semibold text-text-muted uppercase tracking-wider mb-xs">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="family@example.com"
                className="w-full rounded-md border border-border-subtle bg-surface-body px-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none transition-colors duration-200"
              />
            </div>

            <div className="flex gap-md mb-md">
              <div className="flex-1">
                <label className="block font-sans text-[0.75rem] font-semibold text-text-muted uppercase tracking-wider mb-xs">
                  State / territory
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-md border border-border-subtle bg-surface-body px-md py-sm font-sans text-sm text-text-primary focus:border-ember focus:outline-none transition-colors duration-200"
                >
                  <option value="">Select...</option>
                  {AU_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block font-sans text-[0.75rem] font-semibold text-text-muted uppercase tracking-wider mb-xs">
                  Expires in
                </label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full rounded-md border border-border-subtle bg-surface-body px-md py-sm font-sans text-sm text-text-primary focus:border-ember focus:outline-none transition-colors duration-200"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            </div>

            <div className="mb-md">
              <label className="block font-sans text-[0.75rem] font-semibold text-text-muted uppercase tracking-wider mb-xs">
                Source
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Brisbane Homeschool Co-op"
                className="w-full rounded-md border border-border-subtle bg-surface-body px-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none transition-colors duration-200"
              />
            </div>

            <div className="mb-lg">
              <label className="block font-sans text-[0.75rem] font-semibold text-text-muted uppercase tracking-wider mb-xs">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Admin-only notes"
                className="w-full rounded-md border border-border-subtle bg-surface-body px-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none transition-colors duration-200 resize-none"
              />
            </div>

            <div className="flex gap-sm justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border-subtle bg-transparent px-md py-sm font-sans text-[0.85rem] font-medium text-text-secondary hover:border-border-medium hover:text-text-primary transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!familyName.trim() || submitting}
                className="rounded-md bg-ember px-md py-sm font-sans text-[0.85rem] font-semibold text-text-inverse transition-all duration-200 hover:bg-ember-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Generating...' : 'Generate Invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
