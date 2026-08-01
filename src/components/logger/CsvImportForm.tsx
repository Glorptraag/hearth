'use client';

import { useState } from 'react';
import { Check } from '@/components/icons';

interface CsvImportFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

const TEMPLATE = `title,dateOccurred,subjects,description
"Maths with blocks",2026-03-15,"mathematics","We counted and sorted coloured blocks into groups of 5 and 10."
"Nature walk",2026-03-16,"science,hpe","Explored the creek bed and identified 3 native plants."
"Story writing",2026-03-17,"english","Emma wrote a short story about a dragon who learns to be kind."
`;

export function CsvImportForm({ onComplete, onCancel }: CsvImportFormProps) {
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors?: { row: number; reason: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    if (!csvText.trim()) {
      setError('Paste your CSV data above.');
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const res = await fetch('/api/entries/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Import failed.');
        return;
      }
      setResult(data);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setImporting(false);
    }
  }

  function loadTemplate() {
    setCsvText(TEMPLATE);
    setResult(null);
    setError(null);
  }

  if (result) {
    return (
      <div className="flex flex-col gap-lg">
        <div className="rounded-lg border border-sage/20 bg-sage/10 p-md">
          <p className="inline-flex items-center gap-xs font-serif text-base font-semibold text-sage mb-xs">
            <Check size={16} aria-hidden="true" />
            {result.imported} session{result.imported !== 1 ? 's' : ''} imported
          </p>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-sm">
              <p className="font-sans text-xs font-semibold text-text-muted uppercase tracking-[0.08em] mb-xs">Rows skipped</p>
              {result.errors.map((e) => (
                <p key={e.row} className="font-sans text-xs text-red-400">Row {e.row}: {e.reason}</p>
              ))}
            </div>
          )}
        </div>
        <p className="font-serif text-sm text-text-secondary">
          Your entries are being enriched in the background — they&apos;ll appear in your portfolio shortly.
        </p>
        <button
          type="button"
          onClick={onComplete}
          className="font-sans text-sm font-semibold text-text-inverse bg-ember rounded-md min-h-[44px] px-lg transition-all duration-[var(--motion-quick)] hover:bg-ember-hover"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">Import from CSV</h2>
        <p className="font-serif text-sm text-text-secondary leading-relaxed">
          Paste CSV with columns: <code className="font-mono text-xs bg-surface-raised px-xs py-[2px] rounded">title</code>,{' '}
          <code className="font-mono text-xs bg-surface-raised px-xs py-[2px] rounded">dateOccurred</code> (yyyy-mm-dd),{' '}
          <code className="font-mono text-xs bg-surface-raised px-xs py-[2px] rounded">subjects</code>,{' '}
          <code className="font-mono text-xs bg-surface-raised px-xs py-[2px] rounded">description</code>
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-xs">
          <label className="font-sans text-xs font-semibold text-text-muted uppercase tracking-[0.08em]">CSV Data</label>
          <button
            type="button"
            onClick={loadTemplate}
            className="font-sans text-xs text-ember hover:text-ember-hover transition-colors duration-[var(--motion-quick)] underline underline-offset-2"
          >
            Load example
          </button>
        </div>
        <textarea
          value={csvText}
          onChange={(e) => { setCsvText(e.target.value); setError(null); }}
          rows={8}
          placeholder={'title,dateOccurred,subjects,description\n"Session title",2026-03-15,"mathematics","Description..."'}
          className="w-full rounded-md border border-border-subtle bg-surface-raised font-mono text-xs text-text-secondary placeholder:text-text-muted outline-none p-md resize-none transition-all duration-[var(--motion-quick)] focus:border-ember focus:shadow-focus"
        />
      </div>

      {error && <p className="font-sans text-sm text-red-400">{error}</p>}

      <div className="flex gap-md pt-sm border-t border-border-subtle">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 font-sans text-sm text-text-secondary border border-border-subtle rounded-md min-h-[44px] px-lg transition-all duration-[var(--motion-quick)] hover:border-border-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={importing || !csvText.trim()}
          className="flex-1 font-sans text-sm font-semibold text-text-inverse bg-ember rounded-md min-h-[44px] px-lg shadow-ember transition-all duration-[var(--motion-quick)] disabled:opacity-50"
        >
          {importing ? 'Importing…' : 'Import Sessions'}
        </button>
      </div>
    </div>
  );
}
