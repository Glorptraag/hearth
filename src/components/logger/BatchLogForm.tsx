'use client';

import { useState } from 'react';

interface BatchEntry {
  id: string;
  title: string;
  dateOccurred: string;
  subjects: string[];
  learnerIds: string[];
}

const SUBJECTS = ['English', 'Mathematics', 'Science', 'HASS', 'Arts', 'Technologies', 'HPE', 'Languages', 'Nature Study', 'Life Skills'];

interface BatchLogFormProps {
  learners: Array<{ id: string; name: string }>;
  onComplete: () => void;
  onCancel: () => void;
}

function emptyEntry(date: string): BatchEntry {
  return {
    id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    title: '',
    dateOccurred: date,
    subjects: [],
    learnerIds: [],
  };
}

export function BatchLogForm({ learners, onComplete, onCancel }: BatchLogFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [entries, setEntries] = useState<BatchEntry[]>([emptyEntry(today), emptyEntry(today)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addEntry() {
    setEntries((prev) => [...prev, emptyEntry(today)]);
  }

  function updateEntry(id: string, field: keyof BatchEntry, value: unknown) {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  }

  function removeEntry(id: string) {
    if (entries.length <= 1) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function toggleSubject(entryId: string, subject: string) {
    setEntries((prev) => prev.map((e) => {
      if (e.id !== entryId) return e;
      return {
        ...e,
        subjects: e.subjects.includes(subject)
          ? e.subjects.filter((s) => s !== subject)
          : [...e.subjects, subject],
      };
    }));
  }

  function toggleLearner(entryId: string, learnerId: string) {
    setEntries((prev) => prev.map((e) => {
      if (e.id !== entryId) return e;
      return {
        ...e,
        learnerIds: e.learnerIds.includes(learnerId)
          ? e.learnerIds.filter((id) => id !== learnerId)
          : [...e.learnerIds, learnerId],
      };
    }));
  }

  async function handleSave() {
    const valid = entries.filter((e) => e.title.trim());
    if (valid.length === 0) {
      setError('Add at least one session title.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const responses = await Promise.all(
        valid.map((entry) =>
          fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: entry.title.trim(),
              dateOccurred: entry.dateOccurred,
              subjects: entry.subjects,
              learnerIds: entry.learnerIds,
              status: 'draft',
              source: 'logger',
            }),
          })
        )
      );
      const failed = responses.filter((r) => !r.ok);
      if (failed.length > 0) {
        setError(`${failed.length} of ${responses.length} sessions failed to save.`);
        return;
      }
      onComplete();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const validCount = entries.filter((e) => e.title.trim()).length;

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">Log multiple sessions</h2>
        <p className="font-serif text-sm text-text-secondary">
          Quickly capture several sessions at once. Add a title and date for each — that&apos;s all you need.
        </p>
      </div>

      <div className="flex flex-col gap-md">
        {entries.map((entry, idx) => (
          <div key={entry.id} className="bg-surface-panel rounded-lg border border-border-subtle p-md">
            <div className="flex items-center justify-between mb-sm">
              <span className="font-sans text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em]">
                Session {idx + 1}
              </span>
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="font-sans text-xs text-text-muted hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="flex flex-col gap-sm">
              <input
                type="text"
                value={entry.title}
                onChange={(e) => updateEntry(entry.id, 'title', e.target.value)}
                placeholder="What did you learn?"
                className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember focus:shadow-focus"
              />

              <div className="flex gap-sm">
                <input
                  type="date"
                  value={entry.dateOccurred}
                  onChange={(e) => updateEntry(entry.id, 'dateOccurred', e.target.value)}
                  className="flex-1 bg-surface-raised border border-border-subtle rounded-md py-[8px] px-md font-sans text-sm text-text-primary outline-none transition-all duration-200 focus:border-ember"
                />
              </div>

              {learners.length > 0 && (
                <div className="flex flex-wrap gap-xs">
                  {learners.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleLearner(entry.id, l.id)}
                      className={[
                        'font-sans text-xs rounded-full px-sm py-[3px] border transition-all duration-200',
                        entry.learnerIds.includes(l.id)
                          ? 'bg-ember text-text-inverse border-ember'
                          : 'border-border-subtle text-text-muted hover:border-border-medium',
                      ].join(' ')}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-xs">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(entry.id, s)}
                    className={[
                      'font-sans text-xs rounded-md px-sm py-[3px] border transition-all duration-200',
                      entry.subjects.includes(s)
                        ? 'bg-surface-hover border-border-medium text-text-primary'
                        : 'border-border-subtle text-text-muted hover:border-border-medium',
                    ].join(' ')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="rounded-md border border-dashed border-border-medium py-sm font-sans text-sm text-text-secondary hover:border-ember hover:text-ember transition-colors duration-200"
      >
        + Add another session
      </button>

      {error && <p className="font-sans text-sm text-red-400">{error}</p>}

      <div className="flex gap-md pt-sm border-t border-border-subtle">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 font-sans text-sm text-text-secondary border border-border-subtle rounded-md min-h-[44px] px-lg transition-all duration-200 hover:border-border-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 font-sans text-sm font-semibold text-text-inverse bg-ember rounded-md min-h-[44px] px-lg shadow-ember transition-all duration-200 disabled:opacity-50"
        >
          {saving ? 'Saving…' : `Save ${validCount} session${validCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
