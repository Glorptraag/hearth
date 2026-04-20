import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0, // disabled — privacy default
    replaysOnErrorSampleRate: 0,

    // Scrub likely-PII before sending to Sentry.
    // Hearth's founding privacy posture: no learner names, no entry text,
    // no emails, no free-form parent writing leaves the app.
    beforeSend(event) {
      return scrubEvent(event) as typeof event;
    },

    beforeSendTransaction(event) {
      return scrubEvent(event) as typeof event;
    },
  });
}

const PII_KEYS = new Set([
  'email',
  'name',
  'learnerName',
  'learner_name',
  'childName',
  'child_name',
  'description',
  'title',
  'discoveryText',
  'discovery',
  'entryText',
  'tagline',
  'notes',
  'facilitatorNotes',
]);

type SentryEventLike = {
  user?: { email?: string | null; username?: string | null; ip_address?: string | null };
  request?: { data?: unknown };
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
};

function scrubEvent<T extends SentryEventLike>(event: T): T {
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }
  if (event.request?.data) {
    event.request.data = scrubObject(event.request.data);
  }
  if (event.extra) {
    event.extra = scrubObject(event.extra) as Record<string, unknown>;
  }
  if (event.contexts) {
    const ctx = event.contexts as Record<string, unknown>;
    for (const key of Object.keys(ctx)) {
      ctx[key] = scrubObject(ctx[key]);
    }
  }
  return event;
}

function scrubObject(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(scrubObject);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (PII_KEYS.has(k)) {
      out[k] = '[redacted]';
    } else {
      out[k] = scrubObject(v);
    }
  }
  return out;
}
