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
}

export async function identifyFamily(familyId: string) {
  if (!enabled || !initialised) return;
  try {
    const hashed = await hashId(familyId);
    posthog.identify(hashed);
  } catch {
    // identification failure is non-fatal
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
  | 'module_added_to_library'
  | 'badge_awarded'
  | 'badge_deferred'
  | 'report_exported'
  | 'logger_completed_50pct'
  | 'pedagogy_set';

export function track(event: HearthEvent, properties?: Record<string, string | number | boolean>) {
  if (!enabled || !initialised) return;
  try {
    posthog.capture(event, sanitise(properties));
  } catch {
    // capture failure is non-fatal
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

async function hashId(id: string): Promise<string> {
  const buf = new TextEncoder().encode(id);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32); // 128 bits of entropy is plenty for distinct family identity
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
