import Link from 'next/link';
import { WifiSlash, NotePencil } from '@/components/icons';

/**
 * Offline fallback.
 *
 * The service worker precaches this route at install and serves it for any
 * navigation that fails while the device has no connection. It is therefore
 * the first — and possibly only — screen an App Review tester sees when they
 * put the device in airplane mode, which is a standard step in the Guideline
 * 4.2 minimum-functionality check. See docs/hearth-native-app-plan-v1.md.
 *
 * Two hard constraints:
 *   1. No network at render. No Clerk, no Postgres, no Sanity. The root layout
 *      skips ClerkThemeProvider for this path (see src/app/layout.tsx), and
 *      `/offline` is listed as a public route in src/proxy.ts so Clerk's
 *      middleware does not 307 it to /sign-in during precache.
 *   2. It must read as Hearth, not as a browser error. The point is to tell a
 *      parent what still works, not to apologise.
 */
export const metadata = {
  title: 'Offline — Hearth',
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-lg">
      <div className="w-full max-w-[420px] rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
        <div
          className="mx-auto mb-lg flex h-[56px] w-[56px] items-center justify-center rounded-full bg-surface-raised"
          aria-hidden="true"
        >
          <WifiSlash size={26} className="text-text-secondary" />
        </div>

        <h1 className="heading mb-sm text-2xl text-text-primary">
          You&rsquo;re offline
        </h1>

        <p className="body-serif mb-lg text-base leading-relaxed text-text-secondary">
          Hearth can&rsquo;t reach the internet right now. Your saved work is
          safe, and anything you log will sync as soon as you&rsquo;re back.
        </p>

        <Link
          href="/log"
          className="hearth-press inline-flex w-full items-center justify-center gap-sm rounded-md bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse shadow-ember hover:bg-ember-hover"
        >
          <NotePencil size={18} weight="regular" />
          Log a moment anyway
        </Link>

        <p className="mt-md font-sans text-xs text-text-muted">
          Entries you write offline are queued on this device and sent
          automatically once you reconnect.
        </p>
      </div>
    </main>
  );
}
