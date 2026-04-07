'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/use-theme';

const NAV_ITEMS = [
  { href: '/dev-preview/dashboard', label: 'Home', emoji: '🏠' },
  { href: '/dev-preview/our-story', label: 'Story', emoji: '📖' },
  { href: '/dev-preview/log', label: 'Log', emoji: '✏️', primary: true },
  { href: '/dev-preview/planner', label: 'Plan', emoji: '📅' },
  { href: '/dev-preview/explore/activities', label: 'Explore', emoji: '🔍' },
  { href: '/dev-preview/settings', label: 'Settings', emoji: '⚙️' },
];

function isActive(pathname: string, href: string): boolean {
  if (href.endsWith('/dashboard')) return pathname.endsWith('/dashboard');
  if (href.endsWith('/our-story')) return pathname.includes('/our-story');
  if (href.endsWith('/log')) return pathname.endsWith('/log');
  if (href.endsWith('/planner')) return pathname.includes('/planner');
  if (href.includes('/explore')) return pathname.includes('/explore');
  if (href.endsWith('/settings')) return pathname.endsWith('/settings');
  return false;
}

export default function DevPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const gathering = theme === 'gathering';

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-body">
        <p className="font-sans text-text-muted">Dev preview is not available in production.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface-body">
      {/* Dev banner */}
      <div className="bg-ember/20 border-b border-ember/30 px-md py-xs text-center">
        <span className="font-sans text-xs font-semibold text-ember">
          DEV PREVIEW — No auth, mock data
        </span>
      </div>

      {/* Top header */}
      <header className="flex items-center justify-between border-b border-border-subtle bg-surface-panel px-md py-sm">
        <span className="font-serif text-lg font-semibold text-text-primary tracking-[-0.02em]">
          Hearth
        </span>
        <div className="flex items-center gap-md">
          <button
            onClick={toggleTheme}
            className="font-sans text-xs font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
            aria-label={gathering ? 'Switch to dark mode' : 'Switch to gathering mode'}
          >
            {gathering ? '🌙' : '☀️'}
          </button>
          <span className="font-sans text-sm text-text-secondary">
            Douglas Family
          </span>
          <Link
            href="/dev-preview/notifications"
            className="relative flex h-[36px] w-[36px] items-center justify-center rounded-md text-text-muted transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-ember-glow hover:text-text-primary"
            aria-label="Notifications"
          >
            <span className="text-lg" aria-hidden="true">🔔</span>
            <span className="absolute right-[2px] top-[2px] flex h-[16px] w-[16px] items-center justify-center rounded-full bg-ember font-sans text-[10px] font-bold text-text-inverse">
              4
            </span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-[72px]">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border-subtle bg-surface-panel px-xs py-sm">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-xs font-sans text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                item.primary
                  ? active
                    ? 'text-ember'
                    : 'text-ember/80'
                  : active
                    ? 'text-ember'
                    : 'text-text-muted'
              }`}
            >
              <span
                className={`text-xl ${
                  item.primary
                    ? 'flex h-[44px] w-[44px] items-center justify-center rounded-full bg-ember text-lg shadow-[0_4px_16px_rgba(217,123,58,0.3),var(--shadow-glow)]'
                    : ''
                }`}
                aria-hidden="true"
              >
                {item.emoji}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
