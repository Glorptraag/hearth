import { HandoffClient } from './HandoffClient';
import { safeNextPath } from '@/lib/platform/handoff';

/**
 * Native → web sign-in handoff (docs/hearth-native-ios-plan-v2.md §4, N1).
 *
 * Loaded only by the iOS app's WKWebView, with a single-use ticket minted by
 * POST /api/native/web-session. Public in src/proxy.ts: the webview arrives
 * here signed out, which is the whole point.
 */
export const metadata = {
  title: 'Signing in — Hearth',
  robots: { index: false, follow: false },
};

export default async function NativeHandoffPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string | string[]; next?: string | string[] }>;
}) {
  const params = await searchParams;
  const ticket = typeof params.ticket === 'string' && params.ticket.length > 0 ? params.ticket : null;
  const next = safeNextPath(params.next) ?? '/dashboard';

  return <HandoffClient ticket={ticket} next={next} />;
}
