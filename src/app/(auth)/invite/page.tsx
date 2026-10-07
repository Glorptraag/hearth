'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Key, Confetti, Lifebuoy } from '@/components/icons';

export default function InvitePage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [familyName, setFamilyName] = useState('');
  const [errorMsg, setErrorMsg] = useState(token ? '' : 'No invitation token found.');

  useEffect(() => {
    if (!token) return;

    fetch('/api/family/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setFamilyName(data.familyName);
          setStatus('success');
        } else {
          setErrorMsg(data.error ?? 'Failed to accept invitation');
          setStatus('error');
        }
      })
      .catch(() => {
        setErrorMsg('Something went wrong.');
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-md py-2xl">
      <div className="rounded-[16px] border border-border-subtle bg-surface-panel p-xl text-center shadow-card">
        {status === 'loading' && (
          <>
            <span className="inline-flex justify-center text-text-secondary" aria-hidden="true">
              <Key size={32} />
            </span>
            <p className="mt-md font-serif text-lg text-text-secondary">Accepting invitation...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <span className="inline-flex justify-center text-ember" aria-hidden="true">
              <Confetti size={32} />
            </span>
            <h1 className="mt-md font-serif text-xl font-semibold text-text-primary">
              Welcome to {familyName}
            </h1>
            <p className="mt-sm font-sans text-sm text-text-secondary">
              You now have access to this family&rsquo;s learning story.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-lg rounded-[6px] bg-ember px-lg py-sm font-sans text-sm font-semibold text-text-inverse transition hover:bg-ember-hover"
            >
              Go to Dashboard
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <span className="inline-flex justify-center text-text-secondary" aria-hidden="true">
              <Lifebuoy size={32} />
            </span>
            <h1 className="mt-md font-serif text-xl font-semibold text-text-primary">
              Invitation Issue
            </h1>
            <p className="mt-sm font-sans text-sm text-text-secondary">{errorMsg}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-lg rounded-[6px] border border-border-subtle px-lg py-sm font-sans text-sm font-semibold text-text-secondary transition hover:text-text-primary"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
