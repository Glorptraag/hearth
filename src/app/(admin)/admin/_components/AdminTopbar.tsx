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

export default function AdminTopbar() {
  const { user } = useUser();
  const pathname = usePathname();
  const breadcrumb = getBreadcrumb(pathname);
  const email = user?.emailAddresses[0]?.emailAddress ?? '';

  return (
    <header className="flex h-[48px] items-center justify-between border-b border-border-subtle bg-surface-panel px-lg">
      <div className="flex items-center gap-sm">
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

        <span className="font-sans text-[0.75rem] text-text-muted">
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
