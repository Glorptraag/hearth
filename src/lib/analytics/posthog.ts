/**
 * Hearth analytics — thin wrapper over posthog-js.
 *
 * Privacy posture (decision D, 19 Apr 2026):
 *  - Family identifier is SHA-256 hashed before it ever leaves the browser.
 *  - No learner names, no entry content, no emails, no free-form text
 *    is ever attached to an event.
 *  - PostHog autocapture is OFF — we only send events we explicitly track().
 *  - Self-hosted PostHog instance (decision E). Host + key come from env;
 *    if unset, every call no-ops silently so dev environments stay quiet.
 */

import posthog from 'posthog-js';

const PH_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const enabled = Boolean(PH_KEY && PH_HOST);

let initialised = false;

/**
 * Events fired before init are buffered here and flushed on init. This matters
 * on `(public)` pages (e.g. onboarding): React runs a child page's effects
 * BEFORE its ancestor PostHogProvider's effect calls initAnalytics(), so a
 * mount-time track() would otherwise hit the uninitialised early-return and
 * drop silently. Capped so a misconfigured env can't grow it unbounded.
 */
const MAX_PENDING_EVENTS = 50;
type PendingEvent = { event: HearthEvent; properties?: Record<string, string | number | boolean> };
const pendingEvents: PendingEvent[] = [];

export function initAnalytics() {
  if (!enabled || initialised || typeof window === 'undefined') return;
  posthog.init(PH_KEY!, {
    api_host: PH_HOST!,
    autocapture: false,
    capture_pageview: false, // we'll capture only the events we care about
    capture_pageleave: false,
    disable_session_recording: true,
    persistence: 'localStorage+cookie',
    loaded: (p) => {
      // Opt out of surveys and feature-flag polling by default; can be
      // enabled per-user later if we need them.
      p.set_config({ disable_surveys: true });
    },
  });
  initialised = true;
  // Flush anything captured before init (see pendingEvents).
  if (pendingEvents.length > 0) {
    const queued = pendingEvents.splice(0);
    for (const { event, properties } of queued) {
      try {
        posthog.capture(event, sanitise(properties));
      } catch {
        // capture failure is non-fatal
      }
    }
  }
}

/**
 * Identify the signed-in user to PostHog by a SHA-256 hash of their ID.
 * Accepts any stable string identifier; we pass the Clerk user ID so
 * client-only and server-fired events on the same person merge.
 */
export async function identifyUser(id: string) {
  if (!enabled || !initialised) return;
  try {
    const hashed = await hashForAnalytics(id);
    posthog.identify(hashed);
  } catch {
    // identification failure is non-fatal
  }
}

/**
 * Tag the current PostHog person with their family group, so two
 * co-facilitators on the same household roll up into one analytic
 * unit for funnels and retention. Pair with `identifyUser`; PostHog
 * applies the group to all subsequent events from this client.
 */
export async function identifyFamily(familyId: string) {
  if (!enabled || !initialised) return;
  try {
    const hashed = await hashForAnalytics(familyId);
    posthog.group('family', hashed);
  } catch {
    // grouping failure is non-fatal
  }
}

export function resetIdentity() {
  if (!enabled || !initialised) return;
  posthog.reset();
}

/**
 * Alpha pilot event allowlist. Add to this set rather than calling track()
 * with arbitrary strings so we keep the schema tidy.
 */
export type HearthEvent =
  | 'entry_created'
  | 'entry_enriched'
  | 'entry_enrich_retried'
  | 'enrichment_viewed'
  | 'module_added_to_library'
  | 'planner_entry_created'
  | 'module_session_started'
  | 'module_session_resumed'
  | 'module_session_logged'
  | 'badge_awarded'
  | 'badge_deferred'
  | 'report_exported'
  | 'portfolio_exported'
  | 'logger_completed_50pct'
  | 'onboarding_started'
  | 'pedagogy_set'
  | 'pack_purchased'
  | 'dlo.enrichment.completed'
  | 'dlo.tier_mismatch'
  | 'dlo.attribution.unnamed_multichild'
  | 'feedback_submitted'
  | 'recommendations_scored'
  | 'recommendation_accepted'
  | 'constellation_honesty_notice'
  | 'browse_sort_changed'
  | 'library_item_soft_deleted'
  | 'library_item_restored';

export function track(event: HearthEvent, properties?: Record<string, string | number | boolean>) {
  if (!enabled) return;
  if (!initialised) {
    // Buffer until init (a mount-time event on a public page can fire before
    // the provider's initAnalytics). Drop oldest-first if the cap is hit.
    if (pendingEvents.length < MAX_PENDING_EVENTS) pendingEvents.push({ event, properties });
    return;
  }
  try {
    posthog.capture(event, sanitise(properties));
  } catch {
    // capture failure is non-fatal
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Hash an arbitrary string ID to 128 bits of SHA-256 hex. Exported so
 * call-site code (e.g. the Logger) can hash entry IDs for funnel join keys.
 * Same algorithm as the server-side twin in posthog-server.ts.
 */
export async function hashForAnalytics(id: string): Promise<string> {
  const buf = new TextEncoder().encode(id);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

/**
 * Reject any property whose value looks like free-form parent/learner text.
 * We only want enum-like strings, booleans, or numbers on events.
 */
function sanitise(
  props?: Record<string, string | number | boolean>
): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === 'boolean' || typeof v === 'number') {
      out[k] = v;
      continue;
    }
    if (typeof v === 'string' && v.length <= 40 && !/\s{2,}/.test(v)) {
      // short, single-phrase strings only — categoricals, not sentences
      out[k] = v;
    }
  }
  return out;
}
