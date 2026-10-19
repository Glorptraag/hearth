'use client';

import Link from 'next/link';
import { confirmCopy } from './confirmCopy';

export type ConfirmExitRowProps = {
  onLogAnother: () => void;
};

export function ConfirmExitRow({ onLogAnother }: ConfirmExitRowProps) {
  return (
    <div className="flex flex-col-reverse gap-sm pt-sm sm:flex-row sm:justify-end">
      <Link
        href="/dashboard"
        className="hearth-press inline-flex min-h-[44px] items-center justify-center rounded-md border border-border-subtle bg-transparent px-md py-sm font-sans text-sm font-semibold text-text-secondary hover:border-border-medium hover:text-text-primary"
      >
        {confirmCopy.done}
      </Link>
      <button
        type="button"
        onClick={onLogAnother}
        className="hearth-press inline-flex min-h-[44px] items-center justify-center rounded-md bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse shadow-ember hover:bg-ember-hover"
      >
        {confirmCopy.logAnother}
      </button>
    </div>
  );
}
