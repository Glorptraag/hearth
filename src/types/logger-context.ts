/**
 * Structured capture context the Logger collects alongside the free-text
 * description: the activity-type chip, the observation chips (Engagement /
 * Social / Thinking / Emotional), where it happened and roughly how long.
 *
 * Until this landed, every one of these was dropped at save time — only the
 * activity type survived, and only as a derived `subjects[]`. The enrichment
 * prompt never saw "Persisted through difficulty" or "Taught someone", and
 * pedagogy retrieval had nothing to match its situational tags against.
 * Persisted as `learning_entries.logger_context` (jsonb, nullable; absent on
 * rows saved before it existed).
 */
export interface LoggerContext {
  /** Activity-type chip key (`nature`, `cooking`, `reading`, …) or null. */
  activityType?: string | null;
  /** Observation chip labels exactly as shown (`'Deeply focused'`, …). */
  observations?: string[];
  /** Where-it-happened chip key (`home`, `outdoors`, `community`, `online`). */
  location?: string | null;
  /** Duration chip label (`'~5 min'`, `'~15 min'`, `'~30 min'`, `'1 hr+'`). */
  duration?: string | null;
}
