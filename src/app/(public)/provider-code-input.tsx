'use client';

import { useState } from 'react';

type Status = 'idle' | 'loading' | 'valid' | 'invalid';

export default function ProviderCodeInput() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function apply() {
    const trimmed = code.trim();
    if (!trimmed) {
      setStatus('invalid');
      setMessage('Please enter a provider code.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/provider-code/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      setStatus(data.valid ? 'valid' : 'invalid');
      setMessage(data.message);
    } catch {
      setStatus('invalid');
      setMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="mt-lg border-t border-border-subtle pt-lg">
      <div className="mb-sm font-sans text-xs font-medium uppercase tracking-[0.05em] text-text-muted">
        Have a provider code?
      </div>
      <div className="mx-auto mb-lg flex max-w-[320px] gap-sm">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
          placeholder="Enter code"
          className="flex-1 rounded-[10px] border bg-surface-body px-md py-sm font-sans text-sm text-text-primary outline-none transition-colors duration-200 placeholder:text-text-muted focus:border-[rgba(217,123,58,0.25)]"
          style={{
            borderColor:
              status === 'valid'
                ? 'rgba(74,222,128,0.3)'
                : 'var(--color-border-subtle)',
          }}
        />
        <button
          onClick={apply}
          disabled={status === 'loading'}
          className="whitespace-nowrap rounded-[6px] border border-ember px-md py-sm font-sans text-xs font-semibold text-ember transition-all duration-200 hover:bg-[rgba(217,123,58,0.15)] disabled:opacity-60"
        >
          {status === 'loading' ? '…' : 'Apply'}
        </button>
      </div>
      {message && (
        <p
          className="font-sans text-xs"
          style={{
            color: status === 'valid' ? 'var(--color-sage)' : 'var(--color-text-muted)',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
