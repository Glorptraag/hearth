import Link from 'next/link';
import { CaretRight } from '@/components/icons';

const ROUTES = [
  { href: '/dev-preview/dashboard', label: 'Dashboard', emoji: '🏠', desc: 'Family hub with greeting, learner row, moments, stats' },
  { href: '/dev-preview/our-story', label: 'Our Story Hub', emoji: '📖', desc: 'Per-child story hub with portfolio/capabilities/report nav' },
  { href: '/dev-preview/planner', label: 'Weekly Planner', emoji: '📅', desc: 'Week view with planned sessions' },
  { href: '/dev-preview/explore/activities', label: 'My Library', emoji: '📚', desc: 'Family\'s saved modules from marketplace' },
  { href: '/dev-preview/explore/marketplace', label: 'Marketplace', emoji: '🛒', desc: 'Browse packs (Sanity-powered when available)' },
  { href: '/dev-preview/notifications', label: 'Notifications', emoji: '🔔', desc: 'Notification centre with tier grouping' },
  { href: '/dev-preview/settings', label: 'Settings', emoji: '⚙️', desc: 'Family profile, pedagogy, compliance, children' },
  { href: '/dev-preview/log', label: 'Logger', emoji: '✏️', desc: 'Placeholder — requires API' },
];

export default function DevPreviewIndex() {
  return (
    <div className="mx-auto max-w-2xl px-md py-xl">
      <div className="mb-xl">
        <h1 className="font-serif text-2xl font-semibold text-text-primary">
          Dev Preview
        </h1>
        <p className="mt-xs font-sans text-sm text-text-secondary">
          All screens with mock data. No Clerk auth or Neon DB required.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-sm">
        {ROUTES.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="group relative overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-lg shadow-card transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:-translate-y-[2px] hover:border-border-medium hover:shadow-hover"
          >
            <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,var(--ember),transparent)] opacity-0 transition-opacity duration-[var(--motion-gentle)] group-hover:opacity-100" />
            <div className="flex items-center gap-md">
              <span className="text-2xl">{route.emoji}</span>
              <div className="flex-1">
                <h2 className="font-serif text-base font-semibold text-text-primary">
                  {route.label}
                </h2>
                <p className="font-sans text-xs text-text-secondary">{route.desc}</p>
              </div>
              <span className="inline-flex text-ember" aria-hidden="true"><CaretRight size={14} /></span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
