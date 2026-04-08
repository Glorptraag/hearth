'use client';

import { useState } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';

interface CreateSessionModalProps {
  hearthId: string;
  defaultLocation?: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateSessionModal({
  hearthId,
  defaultLocation = '',
  isOpen,
  onClose,
  onCreated,
}: CreateSessionModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState(defaultLocation);
  const [prepNotes, setPrepNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const trapRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date) {
      setError('Title and date are required.');
      return;
    }
    setError('');
    setSubmitting(true);

    const [timeStart, timeEnd] = time.split('—').map((s) => s.trim());

    try {
      const res = await fetch(`/api/hearths/${hearthId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, timeStart, timeEnd, location, prepNotes }),

      });
      if (res.ok) {
        onCreated();
        onClose();
      } else {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Failed to create session.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 backdrop-modal z-[200] flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div ref={trapRef} role="dialog" aria-modal="true" aria-labelledby="create-session-title" className="bg-surface-panel border border-border-subtle rounded-[24px] p-2xl w-[90%] max-w-[520px] max-h-[85vh] overflow-y-auto shadow-float" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
        <h2 id="create-session-title" className="font-serif text-xl font-semibold mb-md text-text-primary">
          Create Session
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="mb-md">
            <label className="font-sans text-sm font-medium text-text-secondary mb-sm block">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning Nature Study"
              className="w-full p-3 px-md bg-surface-raised border border-border-subtle rounded-[10px] text-text-primary font-serif text-[0.95rem] focus:outline-none focus:border-ember focus:shadow-focus"
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mb-md">
            <div>
              <label className="font-sans text-sm font-medium text-text-secondary mb-sm block">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 px-md bg-surface-raised border border-border-subtle rounded-[10px] text-text-primary font-serif text-[0.95rem] focus:outline-none focus:border-ember focus:shadow-focus"
              />
            </div>
            <div>
              <label className="font-sans text-sm font-medium text-text-secondary mb-sm block">
                Time
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="9:30 AM — 12:00 PM"
                className="w-full p-3 px-md bg-surface-raised border border-border-subtle rounded-[10px] text-text-primary font-serif text-[0.95rem] focus:outline-none focus:border-ember focus:shadow-focus"
              />
              <p className="font-sans text-xs text-text-muted mt-xs">
                Separate start and end with —
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="mb-md">
            <label className="font-sans text-sm font-medium text-text-secondary mb-sm block">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Community Hall"
              className="w-full p-3 px-md bg-surface-raised border border-border-subtle rounded-[10px] text-text-primary font-serif text-[0.95rem] focus:outline-none focus:border-ember focus:shadow-focus"
            />
          </div>

          {/* Prep notes */}
          <div className="mb-md">
            <label className="font-sans text-sm font-medium text-text-secondary mb-sm block">
              Prep notes for families
            </label>
            <textarea
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              placeholder="What should families know or bring?"
              className="w-full p-3 px-md bg-surface-raised border border-border-subtle rounded-[10px] text-text-primary font-serif text-[0.95rem] focus:outline-none focus:border-ember focus:shadow-focus min-h-[80px] resize-y leading-relaxed"
            />
          </div>

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
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-ember text-text-inverse font-sans text-sm font-semibold rounded-[10px] cursor-pointer hover:bg-ember-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating…' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
