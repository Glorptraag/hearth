'use client';

import { useUser, SignOutButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/invitations': 'Invitations',
  '/admin/content': 'Content Studio',
  '/admin/content/qa': 'Content QA',
  '/admin/families': 'Families',
  '/admin/analytics': 'Analytics',
  '/admin/snapshots': 'Snapshots',
};

function getBreadcrumb(pathname: string): string {
  for (const [prefix, label] of Object.entries(BREADCRUMB_MAP).sort(
    (a, b) => b[0].length - a[0].length
  )) {
    if (pathname.startsWith(prefix)) return label;
  }
  return 'Admin';
}

interface AdminTopbarProps {
  onMenuToggle: () => void;
}

export default function AdminTopbar({ onMenuToggle }: AdminTopbarProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const breadcrumb = getBreadcrumb(pathname);
  const email = user?.emailAddresses[0]?.emailAddress ?? '';

  return (
    <header className="flex h-[48px] items-center justify-between border-b border-border-subtle bg-surface-panel px-lg">
      <div className="flex items-center gap-sm">
        <button
          onClick={onMenuToggle}
          className="lg:hidden rounded-md p-xs text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors duration-200"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-sans text-[0.8rem] font-semibold text-text-primary">
          {breadcrumb}
        </span>
      </div>

      <div className="flex items-center gap-lg">
        <Link
          href="/"
          className="font-sans text-[0.75rem] font-medium text-text-muted hover:text-text-secondary transition-colors duration-200"
        >
          Exit to family view
        </Link>

        <span className="hidden sm:inline font-sans text-[0.75rem] text-text-muted">
          {email}
        </span>

        <SignOutButton>
          <button className="rounded-md px-sm py-xs font-sans text-[0.75rem] font-medium text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all duration-200 border border-transparent hover:border-border-subtle">
            Logout
          </button>
        </SignOutButton>
      </div>
    </header>
  );
}
