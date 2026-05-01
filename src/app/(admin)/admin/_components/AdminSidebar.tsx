'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import {
  House,
  ClipboardText,
  Books,
  CheckCircle,
  UsersThree,
  ChartBar,
  Lightning,
  FileText,
} from '@/components/icons';
import type { ComponentType } from 'react';

type IconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

interface NavItem {
  href: string;
  label: string;
  Icon: IconC;
  exact?: boolean;
  indent?: boolean;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',              label: 'Dashboard',   Icon: House,         exact: true },
  { href: '/admin/invitations',  label: 'Invitations', Icon: ClipboardText },
  { href: '/admin/content',      label: 'Content',     Icon: Books },
  { href: '/admin/content/qa',   label: 'Content QA',  Icon: CheckCircle,   indent: true },
  { href: '/admin/families',     label: 'Families',    Icon: UsersThree },
  { href: '/admin/analytics',    label: 'Analytics',   Icon: ChartBar },
  { href: '/admin/snapshots',    label: 'Snapshots',   Icon: Lightning },
  { href: '/admin/audit-log',    label: 'Audit Log',   Icon: FileText },
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
        <Link href="/admin" className="inline-flex items-center" aria-label="Hearth admin — dashboard">
          <Wordmark
            iconHeight={28}
            textClassName="font-serif text-lg font-bold text-text-primary tracking-[-0.02em]"
          />
        </Link>
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
                <item.Icon size={16} aria-hidden="true" />
                {item.label}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-xs flex items-center gap-sm rounded-md px-md py-sm font-sans text-[0.8rem] font-medium transition-all duration-200 ease-[var(--ease-default)] border ${indent ? 'ml-lg' : ''} ${
                active
                  ? 'border-border-medium bg-surface-raised text-ember'
                  : 'border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary'
              }`}
            >
              <item.Icon size={16} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
