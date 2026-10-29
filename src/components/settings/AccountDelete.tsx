'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';

/**
 * Delete-account flow (decision D1: transfer ownership).
 *
 * Asks `GET /api/account/delete` what would happen (same successor and Hearth
 * rules as the POST), then shows the matching copy:
 *  - ownership_transferred: a transfer step first (who becomes owner, what
 *    stays), then the typed confirmation.
 *  - family_deleted: the full-delete warning, including what happens to
 *    Hearths the family created.
 *  - member_removed: a co-facilitator leaving; the family is untouched.
 */

const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';

type Outcome = 'member_removed' | 'ownership_transferred' | 'family_deleted';

interface Preview {
  outcome: Outcome;
  successor?: { email: string | null; role: string };
  hearthsHandedOver: number;
  hearthsDeleted: number;
}

type Stage = 'loading' | 'load-error' | 'transfer' | 'confirm';

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export default function AccountDelete() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-lg rounded-[10px] border border-red-900/30 bg-red-900/10 p-lg">
      <h3 className="font-sans text-sm font-semibold text-red-400">Danger Zone</h3>
      <p className="mt-sm font-sans text-sm text-text-secondary">
        Deleting your account is permanent. We will show you exactly what happens to your family&rsquo;s
        learning record before anything is removed.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-md rounded-[6px] border border-red-900/30 bg-red-900/20 px-md py-sm font-sans text-sm font-semibold text-red-400 transition hover:bg-red-900/30"
      >
        Delete account
      </button>
      {open && <DeleteDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function DeleteDialog({ onClose }: { onClose: () => void }) {
  const trapRef = useFocusTrap(true);
  const [stage, setStage] = useState<Stage>('loading');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setStage('loading');
    try {
      const res = await fetch('/api/account/delete');
      if (!res.ok) throw new Error('preview failed');
      const data = (await res.json()) as Preview;
      setPreview(data);
      setStage(data.outcome === 'ownership_transferred' ? 'transfer' : 'confirm');
    } catch {
      setStage('load-error');
    }
  }, []);

  useEffect(() => {
    // Fetch-on-open: the dialog mounts only when the parent opens it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPreview();
  }, [loadPreview]);

  async function handleDelete() {
    if (confirmation !== CONFIRM_PHRASE || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });
      if (res.ok) {
        window.location.href = '/sign-in';
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? 'Something went wrong and your account was not deleted. Please try again.');
    } catch {
      setError('We could not reach Hearth, so your account was not deleted. Check your connection and try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[190] backdrop-modal hearth-backdrop-enter" onClick={onClose} />
      <div className="fixed inset-0 z-[200] flex items-end justify-center p-md sm:items-center pointer-events-none">
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-delete-title"
          onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
          className="hearth-modal-enter pointer-events-auto flex max-h-[90dvh] w-full max-w-[480px] flex-col gap-md overflow-y-auto rounded-[16px] border border-border-subtle bg-surface-panel p-lg shadow-float"
        >
          {stage === 'loading' && (
            <>
              <h2 id="account-delete-title" className="font-serif text-lg font-semibold text-text-primary">
                Delete account
              </h2>
              <p role="status" className="font-sans text-sm text-text-secondary">
                Checking what would happen to your family&rsquo;s data&hellip;
              </p>
              <DialogActions>
                <CancelButton onClick={onClose} />
              </DialogActions>
            </>
          )}

          {stage === 'load-error' && (
            <>
              <h2 id="account-delete-title" className="font-serif text-lg font-semibold text-text-primary">
                Delete account
              </h2>
              <p role="alert" className="font-sans text-sm text-text-secondary">
                We could not check what deleting would do, so we have not started. Nothing has changed. Please try again.
              </p>
              <DialogActions>
                <button
                  type="button"
                  onClick={() => void loadPreview()}
                  className="rounded-[6px] border border-border-subtle px-md py-sm font-sans text-sm font-semibold text-text-primary transition hover:border-border-medium"
                >
                  Try again
                </button>
                <CancelButton onClick={onClose} />
              </DialogActions>
            </>
          )}

          {stage === 'transfer' && preview && (
            <>
              <h2 id="account-delete-title" className="font-serif text-lg font-semibold text-text-primary">
                Hand over your family first
              </h2>
              <div className="flex flex-col gap-sm font-serif text-sm text-text-secondary">
                <p>
                  Another adult is part of your family, so your family&rsquo;s learning record will not be deleted.
                  Ownership passes to{' '}
                  <strong className="font-semibold text-text-primary">
                    {preview.successor?.email ?? 'your longest-standing adult member'}
                  </strong>
                  .
                </p>
                <ul className="list-disc pl-lg">
                  <li>Your children, entries, evidence and reports stay with the family.</li>
                  <li>Hearths your family created stay with the family, under the new owner.</li>
                  <li>Your own sign-in and personal drafts are removed.</li>
                </ul>
                <p>You will no longer be able to sign in to this family.</p>
              </div>
              <DialogActions>
                <button
                  type="button"
                  onClick={() => setStage('confirm')}
                  className="rounded-[6px] border border-border-medium px-md py-sm font-sans text-sm font-semibold text-text-primary transition hover:border-border-active"
                >
                  Continue
                </button>
                <CancelButton onClick={onClose} />
              </DialogActions>
            </>
          )}

          {stage === 'confirm' && preview && (
            <>
              <h2 id="account-delete-title" className="font-serif text-lg font-semibold text-text-primary">
                {preview.outcome === 'ownership_transferred'
                  ? 'Confirm and hand over'
                  : preview.outcome === 'member_removed'
                    ? 'Leave this family'
                    : 'Delete your family permanently'}
              </h2>
              <ConfirmCopy preview={preview} />
              <label className="flex flex-col gap-xs font-sans text-xs text-text-secondary">
                <span>
                  Type <strong>{CONFIRM_PHRASE}</strong> to confirm
                </span>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder={CONFIRM_PHRASE}
                  autoComplete="off"
                  className="w-full rounded-[6px] border border-red-900/30 bg-surface-raised px-md py-sm font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-red-400 focus:outline-none"
                />
              </label>
              {error && (
                <p role="alert" className="font-sans text-sm text-red-400">
                  {error}
                </p>
              )}
              <DialogActions>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={confirmation !== CONFIRM_PHRASE || deleting}
                  className="rounded-[6px] bg-red-600 px-md py-sm font-sans text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-40"
                >
                  {deleting
                    ? 'Working...'
                    : preview.outcome === 'ownership_transferred'
                      ? 'Hand over and delete my account'
                      : preview.outcome === 'member_removed'
                        ? 'Delete my account'
                        : 'Permanently delete'}
                </button>
                <CancelButton onClick={onClose} />
              </DialogActions>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ConfirmCopy({ preview }: { preview: Preview }) {
  if (preview.outcome === 'ownership_transferred') {
    return (
      <p className="font-serif text-sm text-text-secondary">
        Ownership passes to {preview.successor?.email ?? 'the next adult member'}, and your sign-in is deleted.
        The family&rsquo;s learning record stays.
      </p>
    );
  }
  if (preview.outcome === 'member_removed') {
    return (
      <p className="font-serif text-sm text-text-secondary">
        You are a co-facilitator, so only your own access is removed. The family and its learning record stay as they are.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-sm font-serif text-sm text-text-secondary">
      <p>
        You are the only adult in this family, so deleting your account permanently removes everything:
        children, learning entries, photos and evidence, reports, badges and planner history. This cannot be undone.
      </p>
      <p>Consider downloading your export first.</p>
      <HearthsLine preview={preview} />
    </div>
  );
}

function HearthsLine({ preview }: { preview: Preview }) {
  const { hearthsHandedOver: handed, hearthsDeleted: deleted } = preview;
  if (handed === 0 && deleted === 0) return null;
  return (
    <p>
      {handed > 0 && (
        <>
          {plural(handed, 'Hearth your family created', 'Hearths your family created')} will pass to another
          member family, who becomes its coordinator.{' '}
        </>
      )}
      {deleted > 0 && (
        <>
          {plural(deleted, 'Hearth your family created', 'Hearths your family created')} has no other active
          family, so {deleted === 1 ? 'it' : 'they'} will be deleted.
        </>
      )}
    </p>
  );
}

function DialogActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-sm">{children}</div>;
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[6px] border border-border-subtle px-md py-sm font-sans text-sm text-text-secondary transition hover:border-border-medium"
    >
      Cancel
    </button>
  );
}
