import type { DocType, FieldRule, CrossFieldRule, QAIssue, CompletenessResult, SanityDoc } from './types';

// ─── Known value sets ───
// Mirror the option lists in the Sanity schemas and the /api/modules/publish Zod
// enums. KNOWN_MODALITIES is the approach set (approaches allow 'exploratory';
// activities do not). Keep in sync if those lists change.

const KNOWN_MODALITIES = ['kinesthetic', 'visual', 'auditory', 'narrative', 'social', 'exploratory'];
const KNOWN_SETTINGS = ['indoor', 'outdoor', 'either'];
const KNOWN_ENERGY_LEVELS = ['calm', 'moderate', 'active'];
const KNOWN_STATUSES = ['draft', 'published'];

// ─── Helpers ───

function get(obj: unknown, path: string): unknown {
  return path.split('.').reduce((o: Record<string, unknown> | undefined, k) => {
    if (o && typeof o === 'object' && k in o) return o[k] as Record<string, unknown> | undefined;
    return undefined;
  }, obj as Record<string, unknown> | undefined);
}

function portableTextLength(value: unknown): number {
  if (!value || !Array.isArray(value)) return 0;
  return value
    .filter((b: Record<string, unknown>) => b._type === 'block' && Array.isArray(b.children))
    .flatMap((b: Record<string, unknown>) => b.children as Record<string, unknown>[])
    .map((c: Record<string, unknown>) => (typeof c.text === 'string' ? c.text : ''))
    .join('').length;
}

function textLength(value: unknown): number {
  if (typeof value === 'string') return value.length;
  if (Array.isArray(value)) return portableTextLength(value);
  return 0;
}

function isEmptyArray(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0;
}

// ─── Completeness rules ───

export const completenessRules: Record<DocType, FieldRule[]> = {
  pack: [
    {
      field: 'title',
      required: true,
      weakIf: (v) => !v || String(v).length < 5,
      description: 'Pack title must be at least 5 characters',
    },
    {
      field: 'slug.current',
      required: true,
      description: 'Pack must have a slug',
    },
    {
      field: 'description',
      required: true,
      weakIf: (v) => textLength(v) < 50,
      description: 'Pack description must be at least 50 characters',
    },
    {
      field: 'richTextIntro',
      required: true,
      weakIf: (v) => textLength(v) < 200,
      description: 'Pack rich text intro must be at least 200 characters',
    },
    {
      field: 'modules',
      required: true,
      weakIf: (v) => isEmptyArray(v),
      description: 'Pack must have at least one module',
    },
    {
      field: 'moduleCount',
      required: true,
      description: 'Pack moduleCount must match modules.length (checked via count drift)',
    },
    {
      field: 'totalActivities',
      required: true,
      description: 'Pack totalActivities must match actual activity count (checked via count drift)',
    },
    {
      field: 'pricingId',
      required: true,
      weakIf: (v) => !v || String(v).trim() === '',
      description: 'Pack must have a Stripe Price ID (pricingId or stripePriceId)',
    },
    {
      field: 'status',
      required: true,
      weakIf: (v) => !KNOWN_STATUSES.includes(v as string),
      description: 'Pack status must be draft or published',
    },
  ],

  module: [
    {
      field: 'title',
      required: true,
      weakIf: (v) => !v || String(v).trim() === '',
      description: 'Module title must not be empty',
    },
    {
      field: 'slug.current',
      required: true,
      description: 'Module must have a slug',
    },
    {
      field: 'description',
      required: true,
      weakIf: (v) => textLength(v) < 50,
      description: 'Module description must be at least 50 characters',
    },
    {
      field: 'targetUnderstanding',
      required: true,
      weakIf: (v) => textLength(v) < 30,
      description: 'Module targetUnderstanding must be at least 30 characters',
    },
    {
      field: 'understandingIndicators',
      required: true,
      weakIf: (v) => {
        const obj = v as Record<string, unknown> | null | undefined;
        return !obj?.emerging || !obj?.developing || !obj?.demonstrating;
      },
      description: 'Module must have all three understanding indicators: emerging, developing, demonstrating',
    },
    {
      field: 'approaches',
      required: true,
      weakIf: (v) => isEmptyArray(v),
      description: 'Module must have at least one approach',
    },
    {
      field: 'capabilityThreads',
      required: true,
      weakIf: (v) => isEmptyArray(v),
      description: 'Module must have at least one capability thread',
    },
    {
      field: 'pack',
      required: true,
      weakIf: (v) => {
        const ref = v as Record<string, unknown> | null | undefined;
        return !ref?._ref && !ref?.current;
      },
      description: 'Module must reference a pack (unless standalone)',
    },
  ],

  approach: [
    {
      field: 'title',
      required: true,
      weakIf: (v) => !v || String(v).trim() === '',
      description: 'Approach title must not be empty',
    },
    {
      field: 'slug.current',
      required: true,
      description: 'Approach must have a slug',
    },
    {
      field: 'description',
      required: true,
      weakIf: (v) => textLength(v) < 30,
      description: 'Approach description must be at least 30 characters',
    },
    {
      field: 'modality',
      required: true,
      weakIf: (v) => !v || !KNOWN_MODALITIES.includes(v as string),
      description: `Approach modality must be one of: ${KNOWN_MODALITIES.join(', ')}`,
    },
    {
      field: 'activities',
      required: true,
      weakIf: (v) => isEmptyArray(v),
      description: 'Approach must have at least one activity',
    },
    {
      field: 'module',
      required: true,
      weakIf: (v) => {
        const ref = v as Record<string, unknown> | null | undefined;
        return !ref?._ref && !ref?.current;
      },
      description: 'Approach must reference a module',
    },
  ],

  activity: [
    {
      field: 'title',
      required: true,
      weakIf: (v) => !v || String(v).trim() === '',
      description: 'Activity title must not be empty',
    },
    {
      field: 'slug.current',
      required: true,
      description: 'Activity must have a slug',
    },
    {
      field: 'instructions',
      required: true,
      weakIf: (v) => textLength(v) < 100,
      description: 'Activity instructions must be at least 100 characters',
    },
    {
      field: 'materials',
      required: true,
      weakIf: (v) => isEmptyArray(v),
      description: 'Activity must list at least one material',
    },
    {
      field: 'facilitatorGuidance.before',
      required: true,
      weakIf: (v) => textLength(v) < 30,
      description: 'Facilitator guidance "before" must be at least 30 characters',
    },
    {
      field: 'facilitatorGuidance.during',
      required: true,
      weakIf: (v) => textLength(v) < 30,
      description: 'Facilitator guidance "during" must be at least 30 characters',
    },
    {
      field: 'facilitatorGuidance.challenges',
      required: false,
      description: 'Facilitator guidance "challenges" is optional but recommended',
    },
    {
      field: 'sessionMetadata.duration',
      required: true,
      weakIf: (v) => typeof v !== 'number' && (typeof v !== 'object' || v === null),
      description: 'Activity session duration must be a number or range object',
    },
    {
      field: 'sessionMetadata.setting',
      required: true,
      weakIf: (v) => !v || !KNOWN_SETTINGS.includes(v as string),
      description: `Activity setting must be one of: ${KNOWN_SETTINGS.join(', ')}`,
    },
    {
      field: 'sessionMetadata.energyLevel',
      required: true,
      weakIf: (v) => !v || !KNOWN_ENERGY_LEVELS.includes(v as string),
      description: `Activity energy level must be one of: ${KNOWN_ENERGY_LEVELS.join(', ')}`,
    },
    {
      field: 'capabilityThreads',
      required: true,
      weakIf: (v) => isEmptyArray(v),
      description: 'Activity must have at least one capability thread',
    },
    {
      field: 'subjects',
      required: true,
      weakIf: (v) => isEmptyArray(v),
      description: 'Activity must have at least one subject',
    },
    {
      field: 'approach',
      required: true,
      weakIf: (v) => {
        const ref = v as Record<string, unknown> | null | undefined;
        return !ref?._ref && !ref?.current;
      },
      description: 'Activity must reference an approach',
    },
  ],

  badge: [
    {
      field: 'title',
      required: true,
      weakIf: (v) => !v || String(v).trim() === '',
      description: 'Badge title must not be empty',
    },
    {
      field: 'slug.current',
      required: true,
      description: 'Badge must have a slug',
    },
    {
      field: 'description',
      required: true,
      weakIf: (v) => textLength(v) < 30,
      description: 'Badge description must be at least 30 characters',
    },
    {
      field: 'criteria',
      required: true,
      weakIf: (v) => !v || (typeof v === 'string' && v.trim() === '') || isEmptyArray(v),
      description: 'Badge must have criteria defined',
    },
    {
      field: 'connectedThreads',
      required: true,
      weakIf: (v) => isEmptyArray(v),
      description: 'Badge must be connected to at least one capability thread',
    },
    {
      field: 'pack',
      required: true,
      weakIf: (v) => {
        const ref = v as Record<string, unknown> | null | undefined;
        return !ref?._ref && !ref?.current;
      },
      description: 'Badge must reference a pack',
    },
  ],
};

// ─── Cross-field rules (verdict depends on more than one field) ───
//
// Soft, non-blocking signals that a single FieldRule can't express. They never
// touch the completeness score and (at `warning` severity) only move a pack to
// READY_WITH_WARNINGS — QA reports, it does not gate publish (Studio + the
// Sanity schema guardrails do that).

export const crossFieldRules: Partial<Record<DocType, CrossFieldRule[]>> = {
  activity: [
    {
      // WS-6 / D1: `capabilityTargets` ({thread, tier}) is the authoring standard;
      // `capabilityThreads` is the legacy fallback kept during migration. An
      // activity that declares NEITHER offers the constellation nothing — flag it
      // so a published-without-targets activity stops being silent. Field is set to
      // capabilityTargets so the dashboard groups it under the new standard.
      field: 'capabilityTargets',
      severity: 'warning',
      description: "activity declares no capability targets (won't contribute to the constellation)",
      flagIf: (doc) => isEmptyArray(doc.capabilityThreads) && isEmptyArray(doc.capabilityTargets),
    },
    {
      // A commonsTexts entry only renders when its `text` reference resolves to a
      // PUBLISHED commonsText. Entries carrying the off-schema `textId` STRING (an
      // external writer passed the raw input through without commonsTextRef(), so
      // there is no `text` ref at all), or whose `text` points at a draft/missing
      // doc, are SILENTLY dropped by the runtime
      // `commonsTexts[@.text->status == "published"]` filter — the activity then
      // shows no read-aloud text, with no error. Flag it. `textPublished` is
      // projected per entry by fetchPackTree (true only for a resolvable published
      // target).
      field: 'commonsTexts',
      severity: 'error',
      description:
        "activity has commonsText entries that won't render (missing `text` reference, or target is unpublished/missing)",
      flagIf: (doc) => {
        const entries = doc.commonsTexts;
        if (!Array.isArray(entries) || entries.length === 0) return false;
        return entries.some(
          (e) => !e || (e as Record<string, unknown>).textPublished !== true,
        );
      },
    },
  ],
};

// ─── Document checker ───

function resolveActivityField(doc: SanityDoc, field: string): unknown {
  // Activity fields can be nested under sessionMetadata OR at top level.
  // Sanity: sessionMetadata.duration/setting/energyLevel
  // Draft format: duration/setting/energyLevel directly
  if (field.startsWith('sessionMetadata.')) {
    const subField = field.slice('sessionMetadata.'.length);
    const meta = doc.sessionMetadata as Record<string, unknown> | undefined;
    const fromMeta = meta?.[subField];
    if (fromMeta !== undefined) return fromMeta;
    return doc[subField];
  }
  if (field === 'pricingId') {
    return doc.pricingId ?? doc.stripePriceId;
  }
  if (field === 'subjects') {
    const s = doc.subjects;
    if (!isEmptyArray(s)) return s;
    return doc.subjectAreas;
  }
  if (field === 'instructions') {
    const inst = doc.instructions;
    if (inst !== undefined) return inst;
    return doc.instructionsText;
  }
  return get(doc, field);
}

export function checkDocument(doc: SanityDoc, docType: DocType): CompletenessResult {
  const rules = completenessRules[docType];
  const docId: string = doc?._id ?? doc?._key ?? 'unknown';
  const errors: QAIssue[] = [];
  const warnings: QAIssue[] = [];

  let requiredTotal = 0;
  let requiredPassing = 0;

  for (const rule of rules) {
    const rawValue = resolveActivityField(doc, rule.field);
    const path = rule.field.split('.');
    const isPresent = rawValue !== undefined && rawValue !== null;
    const isWeak = isPresent && rule.weakIf ? rule.weakIf(rawValue) : false;
    const isMissing = !isPresent;

    if (rule.required) {
      requiredTotal++;
      if (!isMissing && !isWeak) {
        requiredPassing++;
      } else if (isMissing) {
        errors.push({
          docType,
          docId,
          field: rule.field,
          severity: 'error',
          message: `Missing required field: ${rule.description}`,
          path,
        });
      } else {
        // present but weak
        warnings.push({
          docType,
          docId,
          field: rule.field,
          severity: 'warning',
          message: `Weak field value: ${rule.description}`,
          path,
        });
        // Weak required fields count as partial — do not increment requiredPassing
      }
    } else {
      // Optional field: only warn if present and weak
      if (isPresent && isWeak) {
        warnings.push({
          docType,
          docId,
          field: rule.field,
          severity: 'warning',
          message: `Optional field has weak value: ${rule.description}`,
          path,
        });
      }
    }
  }

  // Cross-field rules: soft, non-blocking, and excluded from the completeness math.
  for (const rule of crossFieldRules[docType] ?? []) {
    if (!rule.flagIf(doc)) continue;
    const issue: QAIssue = {
      docType,
      docId,
      field: rule.field,
      severity: rule.severity,
      message: rule.description,
      path: rule.field.split('.'),
    };
    (rule.severity === 'error' ? errors : warnings).push(issue);
  }

  const completeness = requiredTotal === 0 ? 100 : Math.round((requiredPassing / requiredTotal) * 100);

  return { completeness, errors, warnings };
}
