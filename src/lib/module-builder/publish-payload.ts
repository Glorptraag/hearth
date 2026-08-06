import type { SharedEditData } from './types';

/**
 * Builder → POST /api/modules/publish payload mapping.
 *
 * The publish route validates subjects against the lowercase AC keys, so the
 * builder's display tags must be mapped here — sending 'English' (or a
 * non-AC tag like 'Nature Study') 400s the whole publish. Tags without an AC
 * key stay on the draft but are omitted from the published module.
 */
const SUBJECT_TO_PUBLISH_KEY: Record<string, string> = {
  'English': 'english',
  'Mathematics': 'mathematics',
  'Science': 'science',
  'HASS': 'hass',
  'Arts': 'arts',
  'Technologies': 'technologies',
  'HPE': 'hpe',
  'Languages': 'languages',
};

export function toPublishSubjects(subjects: string[]): string[] | undefined {
  const mapped = subjects
    .map((s) => SUBJECT_TO_PUBLISH_KEY[s] ?? SUBJECT_TO_PUBLISH_KEY[s.trim()])
    .filter((s): s is string => Boolean(s));
  const unique = [...new Set(mapped)];
  return unique.length > 0 ? unique : undefined;
}

const DURATION_TO_MINUTES: Record<string, number> = {
  '15 min': 15,
  '30 min': 30,
  '45 min': 45,
  '1 hour': 60,
  '1.5 hours': 90,
  '2 hours': 120,
  'Half day': 180,
};

/** Publish duration is minutes; '1 hour' must not become 1. */
export function durationToMinutes(raw: string): number | null {
  if (!raw.trim()) return null;
  const known = DURATION_TO_MINUTES[raw.trim()];
  if (known) return known;
  const hours = raw.match(/(\d+(?:\.\d+)?)\s*h/i);
  if (hours) return Math.round(parseFloat(hours[1]) * 60);
  const mins = raw.match(/(\d+)\s*min/i);
  if (mins) return parseInt(mins[1]);
  return null;
}

export function parseAgeRange(raw: string): [number | null, number | null] {
  const m = raw.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return [parseInt(m[1]), parseInt(m[2])];
  const single = raw.match(/(\d+)/);
  if (single) { const n = parseInt(single[1]); return [n, n]; }
  return [null, null];
}

/**
 * What still blocks publishing, as human-readable labels. Empty array = publishable.
 * These mirror the publish route's hard requirements (title, targetUnderstanding,
 * ≥1 activity) so the user finds out before the request, not from a silent 400.
 */
export function publishBlockers(data: SharedEditData): string[] {
  const missing: string[] = [];
  if (!data.title.trim()) missing.push('a module title');
  if (!data.targetUnderstanding.trim()) missing.push('what they’ll understand');
  if (data.steps.length === 0) missing.push('at least one step');
  return missing;
}

export interface ModulePublishPayload {
  title: string;
  targetUnderstanding: string;
  subjects?: string[];
  ageRange?: { min: number; max: number };
  duration?: { min: number; max: number };
  capabilityThreadIds?: string[];
  status: 'published';
  createdVia: SharedEditData['pathway'];
  approaches: Array<{
    title: string;
    activities: Array<{
      title: string;
      instructions: string;
      observationPrompts?: string[];
      materials?: Array<{ name: string; required: boolean }>;
      setting: 'indoor' | 'outdoor' | 'either';
    }>;
  }>;
}

export type BuildPublishPayloadResult =
  | { ok: true; payload: ModulePublishPayload }
  | { ok: false; missing: string[] };

export function buildModulePublishPayload(data: SharedEditData): BuildPublishPayloadResult {
  const missing = publishBlockers(data);
  if (missing.length > 0) return { ok: false, missing };

  const [ageMin, ageMax] = parseAgeRange(data.ageRange);
  const minutes = durationToMinutes(data.duration);
  const threadIds = [...new Set(data.capabilities.map((c) => c.threadId).filter(Boolean))];

  return {
    ok: true,
    payload: {
      title: data.title,
      targetUnderstanding: data.targetUnderstanding,
      subjects: toPublishSubjects(data.subjects),
      ageRange: ageMin && ageMax ? { min: ageMin, max: ageMax } : undefined,
      duration: minutes ? { min: minutes, max: minutes } : undefined,
      capabilityThreadIds: threadIds.length > 0 ? threadIds : undefined,
      status: 'published',
      createdVia: data.pathway,
      approaches: [{
        title: 'How to explore this',
        activities: data.steps.map((step) => ({
          title: step.title || 'Activity',
          instructions: step.instructions || step.title,
          observationPrompts: step.observationHint ? [step.observationHint] : undefined,
          materials: data.materials.length > 0
            ? data.materials.map((m) => ({ name: m, required: true }))
            : undefined,
          setting: data.setting === 'indoor' || data.setting === 'outdoor' ? data.setting : 'either',
        })),
      }],
    },
  };
}
