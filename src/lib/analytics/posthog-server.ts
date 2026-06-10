import { createHash } from 'node:crypto';
import type { HearthEvent } from './posthog';

/**
 * Server-side PostHog capture for events that originate in API routes
 * (e.g. `entry_enriched` after the async enrichment pipeline resolves).
 *
 * Uses the PostHog HTTP capture endpoint directly so we don't add a new
 * dependency. Same env vars + privacy posture as the client wrapper:
 *   - No-op unless both NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST
 *     are set.
 *   - Distinct ID is a SHA-256 hash (truncated to 128 bits) of whatever ID
 *     the caller passes. Pass the SAME ID the client wrapper uses
 *     (currently the Clerk user ID) so client + server events join in
 *     PostHog as one person.
 *   - Properties are sanitised the same way as the client: no free-form
 *     text, only enum-like strings, numbers, or booleans.
 *
 * Failures are swallowed — analytics MUST NOT block a real request.
 */

const PH_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const enabled = Boolean(PH_KEY && PH_HOST);

export async function trackServer(
  event: HearthEvent,
  distinctId: string,
  properties?: Record<string, string | number | boolean>,
  options?: { familyId?: string },
) {
  if (!enabled) return;
  try {
    const hashed = hashForAnalytics(distinctId);
    // Same group concept as the client wrapper — pass familyId here
    // so two Clerk users on the same household roll up in funnels.
    const groups = options?.familyId
      ? { family: hashForAnalytics(options.familyId) }
      : undefined;
    const body = {
      api_key: PH_KEY,
      event,
      distinct_id: hashed,
      properties: { ...sanitise(properties), $lib: 'hearth-server' },
      ...(groups ? { $groups: groups } : {}),
      timestamp: new Date().toISOString(),
    };
    await fetch(`${PH_HOST!.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Short timeout — don't keep the function warm waiting on PostHog.
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // capture failure is non-fatal
  }
}

/** Synchronous server-side twin of the client's hashForAnalytics. */
export function hashForAnalytics(id: string): string {
  return createHash('sha256').update(id).digest('hex').slice(0, 32);
}

function sanitise(
  props?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === 'boolean' || typeof v === 'number') {
      out[k] = v;
      continue;
    }
    if (typeof v === 'string' && v.length <= 40 && !/\s{2,}/.test(v)) {
      out[k] = v;
    }
  }
  return out;
}
