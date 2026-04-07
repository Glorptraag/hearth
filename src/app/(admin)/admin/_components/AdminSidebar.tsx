'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  emoji: string;
  exact?: boolean;
  indent?: boolean;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', emoji: '🏠', exact: true },
  { href: '/admin/invitations', label: 'Invitations', emoji: '✉️' },
  { href: '/admin/content', label: 'Content', emoji: '📚' },
  { href: '/admin/content/qa', label: 'Content QA', emoji: '✅', indent: true },
  { href: '/admin/families', label: 'Families', emoji: '👥' },
  { href: '/admin/analytics', label: 'Analytics', emoji: '📊' },
  { href: '/admin/snapshots', label: 'Snapshots', emoji: '⚡' },
  { href: '/admin/audit-log', label: 'Audit Log', emoji: '📋' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean): boolean {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed inset-y-0 left-0 z-40 flex w-[200px] flex-col border-r border-border-subtle bg-surface-panel">
      {/* Brand */}
      <div className="flex items-center gap-sm px-lg py-md border-b border-border-subtle">
        <div className="flex h-[28px] w-[28px] items-center justify-center rounded-md bg-ember shadow-[0_2px_8px_rgba(217,123,58,0.3)]">
          <span className="text-sm" aria-hidden="true">🔥</span>
        </div>
        <span className="font-serif text-lg font-bold text-text-primary tracking-[-0.02em]">
          Hearth
        </span>
        <span className="ml-auto rounded-[6px] bg-surface-raised px-1.5 py-px font-sans text-[0.6rem] font-semibold text-text-muted uppercase tracking-wider">
          Admin
        </span>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-sm py-md">
        {NAV_ITEMS.map((item) => {
          const active = !item.disabled && isActive(item.href, item.exact);
          const indent = item.indent;

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className={`mb-xs flex items-center gap-sm rounded-md px-md py-sm font-sans text-[0.8rem] font-medium text-text-muted/50 cursor-not-allowed ${indent ? 'ml-lg' : ''}`}
                title="Coming soon"
              >
                <span className="text-base opacity-50" aria-hidden="true">{item.emoji}</span>
                {item.label}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-xs flex items-center gap-sm rounded-md px-md py-sm font-sans text-[0.8rem] font-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] border ${indent ? 'ml-lg' : ''} ${
                active
                  ? 'border-border-medium bg-surface-raised text-ember'
                  : 'border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary'
              }`}
            >
              <span className="text-base" aria-hidden="true">{item.emoji}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
