/**
 * Native → web sign-in handoff (docs/hearth-native-ios-plan-v2.md §4, N1).
 *
 * The iOS app holds a Clerk session; the WKWebView that hosts web features
 * has its own cookie jar. When a hosted page lands on /sign-in, the app calls
 * POST /api/native/web-session with its bearer token, receives a URL to
 * /native/handoff carrying a single-use Clerk sign-in ticket, and loads it.
 * The handoff page redeems the ticket and continues to `next`.
 *
 * `next` is attacker-influenced (it originates from a URL), so it is only ever
 * accepted as a same-origin relative path. The Swift side applies the same
 * rule (`WebNavigationPolicy.safeRelativePath`); keep the two in step.
 */

export const HANDOFF_PATH = '/native/handoff';

/** Clerk sign-in tickets are single use; a minute covers a slow webview load. */
export const HANDOFF_TICKET_TTL_SECONDS = 60;

const MAX_NEXT_LENGTH = 2048;

/**
 * Returns `candidate` when it is a safe same-origin path to continue to after
 * the handoff, else null. Rejects protocol-relative (`//host`), absolute and
 * backslash forms (browsers normalise `/\host` to `//host`), control
 * characters, and the auth pages themselves, which would loop.
 */
export function safeNextPath(candidate: unknown): string | null {
  if (typeof candidate !== 'string') return null;
  if (candidate.length === 0 || candidate.length > MAX_NEXT_LENGTH) return null;
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return null;
  if (candidate.includes('\\')) return null;
  if (/[\u0000-\u001F\u007F]/.test(candidate)) return null;

  const path = candidate.split(/[?#]/, 1)[0];
  if (path.startsWith(HANDOFF_PATH) || path.startsWith('/sign-in') || path.startsWith('/sign-up')) {
    return null;
  }
  return candidate;
}

export function buildHandoffUrl(ticket: string, next: string): string {
  const params = new URLSearchParams({ ticket, next });
  return `${HANDOFF_PATH}?${params.toString()}`;
}

/** The slice of Clerk v7's signal-based `SignInFuture` the handoff needs. */
export interface TicketSignIn {
  readonly status: string | null;
  ticket(params: { ticket: string }): Promise<{ error: unknown }>;
  finalize(): Promise<{ error: unknown }>;
}

/**
 * Redeems a handoff ticket and navigates on. Returns false when the parent
 * has to sign in by hand (missing, expired or already-used ticket).
 */
export async function redeemHandoff({
  ticket,
  next,
  isSignedIn,
  signIn,
  navigate,
}: {
  ticket: string | null;
  next: string;
  isSignedIn: boolean;
  signIn: TicketSignIn | null;
  navigate: (to: string) => void;
}): Promise<boolean> {
  // A live web session already exists (e.g. the page was reloaded after a
  // successful redemption); the ticket is spent, so just continue.
  if (isSignedIn) {
    navigate(next);
    return true;
  }
  if (!ticket || !signIn) return false;

  const redeemed = await signIn.ticket({ ticket });
  if (redeemed.error || signIn.status !== 'complete') return false;

  const finalized = await signIn.finalize();
  if (finalized.error) return false;

  navigate(next);
  return true;
}
