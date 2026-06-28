import type { ClientReadKey } from './read-allowlist';

/**
 * Browser helper: run an allowlisted GROQ read through the authed server proxy
 * (`POST /api/sanity/read`).
 *
 * Client components can't see dotted-id ("dark") docs via the tokenless
 * `sanityClient` in production, so any read that dereferences a dark type goes
 * through here instead. Returns `null` on any failure (network, auth, unknown
 * key, server error), matching the tolerant `.catch(() => …)` behaviour the
 * direct client reads already relied on — callers degrade gracefully.
 *
 * The `key` is typed to the allowlist, so callers can't request an unregistered
 * query, and only the KEY (never raw GROQ) crosses the wire. The `read-allowlist`
 * import is type-only, so its query strings never enter the client bundle.
 */
export async function clientSanityRead<T>(
  key: ClientReadKey,
  params?: Record<string, unknown>,
): Promise<T | null> {
  try {
    const res = await fetch('/api/sanity/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, params }),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
