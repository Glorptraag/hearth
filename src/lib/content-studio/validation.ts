import { z } from 'zod';

// Canonical curriculum subject enum. Must match the modules publish route and the
// app's SUBJECT_META map. Validating against it here stops drifted values (e.g. the
// non-canonical "health-pe") from being written to Sanity via the editorial path.
const subjectEnum = z.enum([
  'english', 'mathematics', 'science', 'hass', 'arts', 'technologies', 'hpe', 'languages',
]);

const workbenchSchema = z.object({
  handOffFraming: z.string().min(1, 'Workbench hand-off framing required'),
  parentOffGuidance: z.string().min(1, 'Workbench parent-off guidance required'),
  whatTheBenchInvites: z.string().min(1, 'Workbench affordance description required').max(400),
  evidenceTrail: z.string().min(1, 'Workbench evidence trail required').max(300),
  materialAssetIds: z.array(z.string()).min(1, 'Workbench needs at least 1 material asset').max(8),
  childFacingSetupNotes: z.string().max(300).optional(),
  workbenchId: z.string().min(1, 'Workbench ID required'),
  capabilityThreadsSecondaryIds: z.array(z.string()).max(4).optional(),
});

const workbenchPackSchema = z.object({
  _key: z.string(),
  id: z.string().min(1, 'Pack workbench id required'),
  name: z.string().min(1, 'Pack workbench name required'),
  consolidatesPaths: z.array(z.string()),
  physicalForm: z.string(),
});

const materialSchema = z.object({
  _key: z.string(),
  name: z.string().min(1, 'Material name required'),
  required: z.boolean(),
  alternative: z.string().optional(),
});

const activitySchema = z.object({
  _key: z.string(),
  title: z.string().min(1, 'Activity title required'),
  instructionsText: z.string().min(1, 'Instructions required'),
  summary: z.string().optional(),
  facilitatorGuidance: z.object({
    before: z.string().optional(),
    during: z.string().optional(),
    challenges: z.string().optional(),
  }),
  materials: z.array(materialSchema),
  duration: z.object({ min: z.number(), max: z.number() }),
  ageRange: z.object({ min: z.number(), max: z.number() }),
  setting: z.enum(['indoor', 'outdoor', 'either']),
  energyLevel: z.enum(['calm', 'moderate', 'active']),
  modality: z.enum(['kinesthetic', 'visual', 'auditory', 'narrative', 'social']),
  observationPrompts: z.array(z.string()),
  reflectionPrompts: z.array(z.string()),
  capabilityThreadIds: z.array(z.string()),
  enabledBadgeKeys: z.array(z.string()),
  deliveryChannel: z.string(),
  workbench: workbenchSchema.optional(),
  status: z.enum(['draft', 'published']),
});

const approachSchema = z.object({
  _key: z.string(),
  title: z.string().min(1, 'Approach title required'),
  modality: z.string(),
  description: z.string(),
  activities: z.array(activitySchema).min(1, 'At least one activity per approach'),
  status: z.enum(['draft', 'published']),
});

const moduleSchema = z.object({
  _key: z.string(),
  title: z.string().min(1, 'Module title required'),
  targetUnderstanding: z.string().min(1, 'Target understanding required'),
  understandingIndicators: z.object({
    emerging: z.string(),
    developing: z.string(),
    demonstrating: z.string(),
  }),
  subjects: z.array(subjectEnum),
  ageRange: z.object({ min: z.number(), max: z.number() }),
  duration: z.object({ min: z.number(), max: z.number() }),
  capabilityThreadIds: z.array(z.string()),
  badgeKeys: z.array(z.string()),
  approaches: z.array(approachSchema).min(1, 'At least one approach per module'),
  standalone: z.boolean(),
  status: z.enum(['draft', 'published']),
});

const badgeSchema = z.object({
  _key: z.string(),
  title: z.string().min(1, 'Badge title required'),
  emoji: z.string().min(1, 'Badge emoji required'),
  description: z.string().min(1, 'Badge description required'),
  criteriaSummary: z.string().min(1, 'Criteria summary required'),
  capabilityThreadIds: z.array(z.string()),
  observationThreshold: z.number().min(1),
  status: z.enum(['draft', 'published']),
});

export const packPublishSchema = z
  .object({
    title: z.string().min(1, 'Pack title required'),
    description: z.string().min(1, 'Pack description required'),
    intro: z.object({
      title: z.string(),
      body: z.string(),
      keyPoints: z.array(z.string()),
      furtherReading: z.array(z.object({ _key: z.string(), title: z.string(), url: z.string() })),
    }),
    subjects: z.array(subjectEnum),
    ageRange: z.object({ min: z.number(), max: z.number() }),
    termWeeks: z.number(),
    worldview: z.string(),
    availability: z.string(),
    // Membership-included packs carry no transactional UI (architecture §7 — no
    // freemium language), so they need no Stripe price. Only premium packs do —
    // enforced by the refine below rather than a blanket required-string.
    stripePriceId: z.string().optional(),
    creator: z.string(),
    version: z.string(),
    modules: z.array(moduleSchema).min(1, 'At least one module per pack'),
    badges: z.array(badgeSchema),
    workbenches: z.array(workbenchPackSchema).optional(),
    status: z.string(),
  })
  .superRefine((pack, ctx) => {
    if (pack.availability === 'premium' && !pack.stripePriceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stripePriceId'],
        message: 'Premium packs require a Stripe price ID',
      });
    }
  });

// ─── Soft validation flags (addendum §5) ─────────────────────────────────────
// These are content-pattern heuristics. They surface likely contract violations
// to a reviewer rather than hard-rejecting. The publish endpoint runs them and
// returns flags alongside a successful 200/201 — favour over-flagging.

export interface WorkbenchFlag {
  rule: string;
  severity: 'warning';
  location: string;
  message: string;
}

const RESTRICTIVE_LANGUAGE_RE = /\b(do not|don'?t|doesn'?t|shouldn'?t|avoid|refrain|never)\b/i;
const DURATION_LANGUAGE_RE = /\b(\d+\s*(minute|min|hour|hr|second|sec)s?|spend|for at least|until they)\b/i;
const COMPLETION_LANGUAGE_RE = /\b(finish(es|ed|ing)?|complete[ds]?|completes|completing|wrap up|conclude[ds]?|make sure they|they should|all of (them|the))\b/i;

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

interface WorkbenchInputForFlags {
  handOffFraming: string;
  parentOffGuidance: string;
  whatTheBenchInvites: string;
}

export function workbenchContentFlags(
  wb: WorkbenchInputForFlags,
  location: string,
): WorkbenchFlag[] {
  const flags: WorkbenchFlag[] = [];

  if (!RESTRICTIVE_LANGUAGE_RE.test(wb.parentOffGuidance)) {
    flags.push({
      rule: 'parentOffGuidance.requires-restrictive-language',
      severity: 'warning',
      location: `${location}.parentOffGuidance`,
      message:
        'Parent-off guidance should include explicit "do not" / "don\'t" language. Soft language fails the contract.',
    });
  }

  const combinedWords = wordCount(wb.handOffFraming) + wordCount(wb.parentOffGuidance);
  if (combinedWords > 200) {
    flags.push({
      rule: 'handOffFraming+parentOffGuidance.word-cap',
      severity: 'warning',
      location: `${location}.handOffFraming+parentOffGuidance`,
      message: `Combined word count is ${combinedWords}; the brief is overdoing parent-facing copy (cap ~200).`,
    });
  }

  if (DURATION_LANGUAGE_RE.test(wb.whatTheBenchInvites)) {
    flags.push({
      rule: 'whatTheBenchInvites.no-duration-language',
      severity: 'warning',
      location: `${location}.whatTheBenchInvites`,
      message: 'Bench invitation contains duration language; the bench has no time target.',
    });
  }

  if (COMPLETION_LANGUAGE_RE.test(wb.whatTheBenchInvites)) {
    flags.push({
      rule: 'whatTheBenchInvites.no-completion-language',
      severity: 'warning',
      location: `${location}.whatTheBenchInvites`,
      message: 'Bench invitation contains completion language; the bench has no completion requirement.',
    });
  }

  if (COMPLETION_LANGUAGE_RE.test(wb.handOffFraming)) {
    flags.push({
      rule: 'handOffFraming.no-completion-language',
      severity: 'warning',
      location: `${location}.handOffFraming`,
      message: 'Hand-off framing contains completion language; soften to invitation, not instruction.',
    });
  }

  return flags;
}

export interface WorkbenchIdResolutionInput {
  declaredIds: Set<string>;
  modules: { title: string; approaches: { title: string; activities: { title: string; workbench?: { workbenchId: string } }[] }[] }[];
}

export function workbenchIdResolutionFlags(input: WorkbenchIdResolutionInput): WorkbenchFlag[] {
  const flags: WorkbenchFlag[] = [];
  for (const m of input.modules) {
    for (const a of m.approaches) {
      for (const act of a.activities) {
        if (!act.workbench) continue;
        if (!input.declaredIds.has(act.workbench.workbenchId)) {
          flags.push({
            rule: 'workbenchId.unresolved',
            severity: 'warning',
            location: `module[${m.title}].approach[${a.title}].activity[${act.title}].workbench.workbenchId`,
            message: `workbenchId "${act.workbench.workbenchId}" is not declared in pack.workbenches[].id.`,
          });
        }
      }
    }
  }
  return flags;
}

export const standaloneModulePublishSchema = moduleSchema;
export const standaloneActivityPublishSchema = activitySchema;

export type PackValidationError = z.ZodError;
