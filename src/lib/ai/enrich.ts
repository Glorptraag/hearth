import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import {
  learningEntries,
  learners,
  familySettings,
} from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { aiPipelineLogs } from '@/lib/db/schema';
import { buildPedagogyContextWithSources, type PedagogySource } from './pedagogy-context';
import { rebuildSnapshot } from './snapshot-rebuild';
import { TemplateNudgeProvider } from '@/lib/logger/coaching/nudge-provider';
import type { SnapshotSignals, ProfileNudge } from '@/lib/logger/coaching/types';
import { familyIntelligenceSnapshots } from '@/lib/db/schema';
import {
  validateDlos,
  persistDloLinks,
  gateLearnersByNamedSignals,
  persistDeclaredOpportunities,
  corroborateDloOpportunities,
  type DloEnrichmentItem,
  type DeclaredTarget,
} from './dlo-persistence';
import { getValidDlos } from './dlo-cache';
import { trackServer } from '@/lib/analytics/posthog-server';
import { VALID_THREAD_IDS, normalizeThreadId } from './thread-aggregation';
import { sanityServerClient } from '@/lib/sanity/client';
import { AC9_CODE_PATTERN } from '@/lib/curriculum/ac9';
import type { SnapshotData } from '@/types/snapshot';
import type { LoggerContext } from '@/types/logger-context';
import { deriveSituationalSignals } from '@/lib/pedagogy/situational-signals';

// Haiku 4.5 frequently wraps JSON output in ```json … ``` fences even when
// the system prompt asks for raw JSON. Tracker #34 root cause: JSON.parse
// choked on the leading backticks, both attempts failed, status went to
// 'failed' with zero enrichment landing. Strip fences (and any stray text
// outside the first/last brace) before parsing.
function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return candidate;
  }
  return candidate.slice(firstBrace, lastBrace + 1);
}

// Candidate-thread cap for DLO descriptor injection (WS-3). 10 threads × 3
// tier descriptors ≈ 2k tokens — the budget guardrail from the plan.
const MAX_CANDIDATE_THREADS = 10;

export const SYSTEM_PROMPT = `You are Hearth's learning entry enrichment engine. Return ONLY valid JSON matching the schema below. No preamble, no markdown, no explanation. Do NOT wrap the JSON in code fences (no \`\`\`json … \`\`\`). The first character of your response must be { and the last must be }.

OUTPUT SCHEMA:
{
  "subjects_detected": ["string"],
  "capability_threads": [
    { "thread_id": "string", "confidence": 0.0-1.0 }
  ],
  "curriculum_descriptors": [
    { "code": "string", "confidence": 0.0-1.0 }
  ],
  "per_child_signals": {
    "[child_name]": {
      "engagement_score": 0.0-1.0,
      "complexity_level": "emerging|developing|demonstrating",
      "notable": "string or null"
    }
  },
  "insight_suggestions": ["string"],
  "confidence": 0.0-1.0,
  "quality_indicators": {
    "description_richness": "thin|adequate|rich",
    "evidence_present": true/false,
    "multi_subject": true/false
  },
  "journey_observation": null | {
    "text": "string",
    "trigger": "cross_domain|independence|metacognition|transfer"
  },
  "discrete_learning_objectives": [
    { "dlo_id": "string", "tier": "emerging|developing|demonstrating", "confidence": 0.0-1.0, "rationale": "string" }
  ],
  "work_sample": {
    "flag": true/false,
    "quality": 0.0-1.0,
    "rationale": "string"
  }
}

VALID SUBJECTS: Mathematics, English, Science, HASS, The Arts, Technologies, HPE, Languages

CAPABILITY THREAD TAXONOMY (map to these IDs only):
L1|Oral Communication  L2|Phonological Awareness  L3|Reading Comprehension
L4|Vocabulary & Word Knowledge  L5|Written Expression  L6|Spelling & Grammar
L7|Narrative & Retelling  L8|Persuasion & Argument  L9|Literary Appreciation
M1|Number Sense  M2|Operations  M3|Fractional Thinking  M4|Algebraic Thinking
M5|Measurement  M6|Spatial Reasoning  M7|Data & Statistics  M8|Probability
M9|Mathematical Modelling  S1|Scientific Inquiry  S2|Biological Sciences
S3|Chemical Sciences  S4|Physical Sciences  S5|Scientific Observation
S6|Earth & Space  H1|Historical Understanding  H2|Source Analysis
H3|Geographical Understanding  H4|Civics & Citizenship  H5|Economics & Business
H6|Cultural Understanding  P1|Gross Motor  P2|Fine Motor  P3|Body Awareness
P4|Team & Sport  P5|Aquatics  PS1|Empathy  PS2|Social Skills
PS3|Self-Regulation  PS4|Identity  PS5|Responsibility  PS6|Resilience
PS7|Safety  C1|Visual Art  C2|Music  C3|Drama  C4|Dance  C5|Media Arts
C6|Design & Construction  C7|Arts Appreciation  EF1|Sustained Attention
EF2|Working Memory  EF3|Cognitive Flexibility  EF4|Planning & Organisation
EF5|Critical Thinking  EF6|Collaboration  EF7|Metacognition  EF8|Transfer

RULES:
- Return ONLY valid JSON. No markdown fencing, no preamble.
- confidence field required on every mapping (0.0-1.0)
- Only use thread IDs from the taxonomy above. Never invent IDs.
- Only use real AC V9 descriptor codes (format: AC9[Subject][Year][Strand][Number]). If unsure, omit.
- Per-child signals are required if multiple children participated.
- insight_suggestions: 1-3 short sentences a parent would find encouraging and specific. When pedagogy reference material is provided, ground suggestions in that material and cite sources naturally (e.g. "This aligns with Charlotte Mason's principle of..."). When contraindications are present, avoid suggesting flagged practices.
- If entry text is very thin (<20 words), return minimal mappings with low confidence.
- discrete_learning_objectives: Map this observation to AT MOST 3 specific DLO ids (e.g. "dlo.M1.emerging"). The dlo_id MUST be one Hearth has authored — never invent ids. Omit any DLO with confidence < 0.4. Tier reflects the evidence in THIS entry alone: 'emerging' (first noticing), 'developing' (practising with support), 'demonstrating' (independent fluency). Return [] when no DLO clearly applies.
- work_sample: Set flag=true ONLY when this entry would make a strong piece of evidence in a Home Education Unit report — i.e. it shows a discrete learning outcome clearly, has rich description and/or attached evidence, and would be defensible to a regulator. Quality is 0.0-1.0 across five factors: (1) richness of description, (2) presence of evidence URLs/photos, (3) clarity of the learning shown, (4) specificity of capability/subject mapping, (5) how independently the child engaged. Default to flag=false with a low quality score for thin entries; flag=true should fire on roughly 1 in 5 entries, not every save. Rationale: one short sentence explaining the score for parent review.
- journey_observation: Include ONLY when you detect a genuinely meaningful pattern — cross-domain connection (learning from one area applied to another), independence marker (child self-directed, initiated, or persisted without adult prompting), metacognition (child reflecting on their own learning process), or transfer of learning (applying prior knowledge to a new context). Aim for roughly 1 per 5 entries — do NOT include for every entry. When included: 1-2 warm, interpretive sentences written from the facilitator's perspective. Set to null when not warranted.`;

export type EnrichmentResult = {
  subjects_detected: string[];
  capability_threads: { thread_id: string; confidence: number }[];
  curriculum_descriptors: { code: string; confidence: number }[];
  per_child_signals: Record<string, {
    engagement_score: number;
    complexity_level: 'emerging' | 'developing' | 'demonstrating';
    notable: string | null;
  }>;
  insight_suggestions: string[];
  confidence: number;
  quality_indicators: {
    description_richness: 'thin' | 'adequate' | 'rich';
    evidence_present: boolean;
    multi_subject: boolean;
  };
  journey_observation: {
    text: string;
    trigger: 'cross_domain' | 'independence' | 'metacognition' | 'transfer';
  } | null;
  discrete_learning_objectives?: DloEnrichmentItem[];
  work_sample?: {
    flag: boolean;
    quality: number;
    rationale?: string | null;
  } | null;
  pedagogy_sources?: PedagogySource[];
  // Post-save profile nudge, surfaced by the client after enrichment completes.
  // Explicit null means "nudge provider ran but no quiet thread qualified."
  profile_nudge?: ProfileNudge | null;
};

interface EnrichmentContext {
  entryId: string;
  familyId: string;
}

async function assembleContext(entryId: string, familyId: string) {
  const [entry, settings, recentEntries, snapshotRow] = await Promise.all([
    db.query.learningEntries.findFirst({
      where: eq(learningEntries.id, entryId),
    }),
    db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, familyId),
    }),
    db
      .select()
      .from(learningEntries)
      .where(and(eq(learningEntries.familyId, familyId), eq(learningEntries.status, 'complete')))
      .orderBy(desc(learningEntries.createdAt))
      .limit(6),
    // The family snapshot is the full per-child aggregate (every thread the
    // child has ever lit, with recency + volume). Read once here and shared
    // with the profile-nudge step so enrichment does a single snapshot read.
    db.query.familyIntelligenceSnapshots.findFirst({
      where: eq(familyIntelligenceSnapshots.familyId, familyId),
    }),
  ]);

  if (!entry) throw new Error(`Entry ${entryId} not found`);

  const entryLearnerIds = entry.learnerIds ?? [];
  const childRecords = entryLearnerIds.length > 0
    ? await db.select().from(learners).where(inArray(learners.id, entryLearnerIds))
    : [];

  const snapshotData = (snapshotRow?.snapshotData ?? null) as SnapshotData | null;

  // Active threads per child. Primary source is the snapshot's per-child
  // active_threads — the whole history, ordered most-recently-evidenced first
  // (ties by volume) so the candidate-DLO cap and the pedagogy retrieval boost
  // see the threads most likely to recur in a new entry. Before this, the
  // profile was derived from the six most recent FAMILY-wide entries, so in a
  // multi-child family a child with forty logged moments could read "none
  // yet" and get no candidate descriptors at all. The recent-entry derivation
  // is kept as a union so threads from saves the snapshot hasn't incorporated
  // yet (rebuild is fire-and-forget) are never lost.
  const activeThreads: Record<string, string[]> = {};
  for (const child of childRecords) {
    const ordered = new Set<string>(snapshotActiveThreadIds(snapshotData, child.id));
    const childEntries = recentEntries.filter((e) => e.learnerIds?.includes(child.id));
    for (const e of childEntries) {
      const enrichment = e.aiEnrichment as EnrichmentResult | null;
      for (const t of enrichment?.capability_threads ?? []) {
        if (VALID_THREAD_IDS.has(t.thread_id)) ordered.add(t.thread_id);
      }
    }
    activeThreads[child.name] = [...ordered];
  }

  const recent = recentEntries
    .filter((e) => e.id !== entryId)
    .slice(0, 5);

  // Candidate threads for descriptor injection (WS-3):
  //   = threads declared by entry.sourceActivityIds (resolved via Sanity GROQ,
  //     same as thread-links.ts — NOT reading entry.threadLinks which is
  //     fire-and-forget concurrent and may be empty at enrich time)
  //   ∪ the child's active threads (already assembled above)
  //   capped at 10 (descriptor injection budget ~2k tokens).
  const activityIds = (entry.sourceActivityIds ?? []) as string[];
  const declaredThreadIds: string[] = [];
  // WS-6: author-declared (thread, tier) targets, for DLO opportunity writes.
  const declaredTargets: DeclaredTarget[] = [];
  const seenTargets = new Set<string>();
  if (activityIds.length > 0) {
    try {
      const activities = await sanityServerClient.fetch<
        Array<{
          capabilityThreads?: Array<{ _id: string }>;
          capabilityTargets?: Array<{ tier?: string | null; thread?: { _id: string } | null }>;
        }>
      >(
        `*[_type == "activity" && _id in $ids && status == "published"]{
          capabilityThreads[]->{ _id },
          capabilityTargets[]{ tier, thread->{ _id } }
        }`,
        { ids: activityIds },
      );
      const seen = new Set<string>();
      for (const act of activities ?? []) {
        for (const t of act.capabilityThreads ?? []) {
          // normalizeThreadId strips the "capabilityThread." _id prefix and
          // validates against the canonical 57-thread set (same as thread-links).
          const bare = t?._id ? normalizeThreadId(t._id) : null;
          if (bare && !seen.has(bare)) {
            seen.add(bare);
            declaredThreadIds.push(bare);
          }
        }
        for (const target of act.capabilityTargets ?? []) {
          const bare = target?.thread?._id ? normalizeThreadId(target.thread._id) : null;
          const tier = target?.tier;
          if (!bare || (tier !== 'emerging' && tier !== 'developing' && tier !== 'demonstrating')) continue;
          // A target's thread is also a candidate thread for descriptor injection.
          if (!seen.has(bare)) {
            seen.add(bare);
            declaredThreadIds.push(bare);
          }
          const targetKey = `${bare}.${tier}`;
          if (!seenTargets.has(targetKey)) {
            seenTargets.add(targetKey);
            declaredTargets.push({ threadId: bare, tier });
          }
        }
      }
    } catch {
      // Best-effort; enrich must not fail if Sanity is slow
    }
  }

  const activeThreadSet = new Set<string>(
    Object.values(activeThreads).flat().filter((id) => VALID_THREAD_IDS.has(id)),
  );
  const merged = new Set<string>([...declaredThreadIds, ...activeThreadSet]);
  const candidateThreadIds = [...merged].slice(0, MAX_CANDIDATE_THREADS);

  return { entry, settings, childRecords, activeThreads, recentEntries: recent, candidateThreadIds, declaredTargets, snapshotData };
}

/** Exported for eval harness and unit tests — assembleContext stays private. */
export type AssembledEnrichContext = Awaited<ReturnType<typeof assembleContext>>;

const ACTIVITY_LABELS: Record<string, string> = {
  nature: 'Nature study', cooking: 'Kitchen science', reading: 'Reading', art: 'Creative arts',
  physical: 'Physical', social: 'Social', structured: 'Lesson', freeplay: 'Free play',
};
const LOCATION_LABELS: Record<string, string> = {
  home: 'at home', outdoors: 'outdoors', community: 'in the community', online: 'online',
};

/**
 * The parent's structured notes as a prompt block, or '' when the entry has
 * none (rows saved before logger_context existed, or a parent who typed only).
 * Exported for the prompt tests.
 */
export function formatStructuredNotes(ctx: LoggerContext | null | undefined): string {
  if (!ctx) return '';
  const facts: string[] = [];
  if (ctx.activityType) facts.push(`activity: ${ACTIVITY_LABELS[ctx.activityType] ?? ctx.activityType}`);
  if (ctx.location) facts.push(`where: ${LOCATION_LABELS[ctx.location] ?? ctx.location}`);
  if (ctx.duration) facts.push(`duration: ${ctx.duration}`);
  const chips = (ctx.observations ?? []).filter((o) => typeof o === 'string' && o.trim());
  if (facts.length === 0 && chips.length === 0) return '';
  const lines = ['', "Parent's structured notes (tapped, not typed):"];
  if (facts.length > 0) lines.push(`- ${facts.join(' · ')}`);
  if (chips.length > 0) lines.push(`- Parent observed: ${chips.join(', ')}`);
  return lines.join('\n') + '\n';
}

/**
 * Thread ids a child has lit, from the family snapshot, most-recently-
 * evidenced first (then by observation volume). Pure; exported for tests.
 * Returns [] when there is no snapshot or no block for this learner.
 */
export function snapshotActiveThreadIds(snapshotData: SnapshotData | null | undefined, learnerId: string): string[] {
  const rows = snapshotData?.children?.[learnerId]?.active_threads;
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return [...rows]
    .filter((t) => t && typeof t.thread_id === 'string' && VALID_THREAD_IDS.has(t.thread_id))
    .sort((a, b) => {
      const byRecency = (b.last_evidence_date ?? '').localeCompare(a.last_evidence_date ?? '');
      if (byRecency !== 0) return byRecency;
      return (b.observation_count ?? 0) - (a.observation_count ?? 0);
    })
    .map((t) => t.thread_id);
}

export async function buildUserPrompt(ctx: AssembledEnrichContext): Promise<{ prompt: string; pedagogySources: PedagogySource[] }> {
  const { entry, settings, childRecords, activeThreads, recentEntries, candidateThreadIds } = ctx;
  const pedagogy = settings?.pedagogyPreference ?? 'eclectic';

  const childrenLine = childRecords
    .map((c) => {
      const dob = c.dateOfBirth ? new Date(c.dateOfBirth) : null;
      const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      return `${c.name}${age !== null ? ` (age ${age})` : ''}`;
    })
    .join(', ');

  const childAges = childRecords
    .map((c) => {
      const dob = c.dateOfBirth ? new Date(c.dateOfBirth) : null;
      return dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    })
    .filter((a): a is number => a !== null);

  const threadsLine = childRecords
    .map((c) => `${c.name}: ${(activeThreads[c.name] ?? []).join(', ') || 'none yet'}`)
    .join('\n');

  const activeThreadList = childRecords.flatMap((c) => activeThreads[c.name] ?? []);

  const recentLine = recentEntries
    .map((e) => `- ${e.title}: ${(e.description ?? '').slice(0, 80)}`)
    .join('\n');

  const discoveries = entry.discoveriesPerLearner as Record<string, string> | null;
  const discoveriesLine = discoveries
    ? Object.entries(discoveries)
        .map(([id, text]) => {
          const child = childRecords.find((c) => c.id === id);
          return `${child?.name ?? id}: ${text}`;
        })
        .join('\n')
    : '';

  // Structured observation details from Guided Mode — chipId → { detail, durationMin? }.
  // Format as a readable block so Haiku can cite specifics. Missing/empty on old
  // (Quick Mode) entries, in which case we omit the block entirely.
  const observationDetailsRaw = entry.observationDetails as
    | Record<string, { detail?: string; durationMin?: number }>
    | null
    | undefined;
  const observationDetailsBlock = observationDetailsRaw && Object.keys(observationDetailsRaw).length > 0
    ? `\nObservation details (from Guided Mode chip unfolds):\n${Object.entries(observationDetailsRaw)
        .map(([chip, v]) => {
          const detail = (v?.detail ?? '').trim();
          const duration = v?.durationMin ? ` (${v.durationMin} min)` : '';
          return detail ? `- ${chip}${duration}: ${detail}` : null;
        })
        .filter(Boolean)
        .join('\n')}\n`
    : '';

  const engagementData = entry.engagementPerLearner as Record<string, number> | null;
  const engagementLine = engagementData
    ? Object.entries(engagementData)
        .map(([id, val]) => {
          const child = childRecords.find((c) => c.id === id);
          return `${child?.name ?? id}=${val}`;
        })
        .join(', ')
    : '';

  // The Logger's structured capture context (chips / activity / where / how
  // long). Null on rows saved before logger_context existed.
  const loggerContext = (entry.loggerContext ?? null) as LoggerContext | null;
  const situational = deriveSituationalSignals({
    context: loggerContext,
    engagement: engagementData,
    childAges,
  });

  // Build pedagogy context (retrieval + formatting, gated by PEDAGOGY_KB_ENABLED).
  // Threads: author-declared / candidate threads first, then the children's
  // active threads — deduped and validated inside buildPedagogyContextWithSources.
  const { prompt: pedagogySection, sources: pedagogySources } = await buildPedagogyContextWithSources({
    entryTitle: entry.title ?? '',
    entryDescription: entry.description ?? '',
    framework: pedagogy,
    childAges,
    capabilityThreads: [...(candidateThreadIds ?? []), ...activeThreadList],
    discoveries: discoveries ? Object.values(discoveries) : [],
    situationalSignals: situational.signals,
    activityType: situational.activityType,
  });

  // Structured notes block — what the parent tapped, not just what they
  // typed. "Persisted through difficulty" or "Taught someone" is exactly the
  // evidence the DLO tiering and the journey_observation rules ask for, and
  // until this landed none of it reached the model.
  const structuredNotesBlock = formatStructuredNotes(loggerContext);

  // Build DLO descriptor block for candidate threads (WS-3).
  // Injected into the USER prompt so the system prompt stays byte-identical
  // (cache-control: ephemeral on system prompt preserves the prompt cache).
  // Each candidate thread contributes its 3 tier descriptors (~150 tokens).
  // assembleContext already caps candidateThreadIds; the slice here is a
  // defensive guard so any caller of buildUserPrompt stays inside the budget.
  let dloDescriptorBlock = '';
  if ((candidateThreadIds ?? []).length > 0) {
    try {
      const { descriptorById } = await getValidDlos();
      const lines: string[] = [];
      for (const threadId of (candidateThreadIds ?? []).slice(0, MAX_CANDIDATE_THREADS)) {
        const tiers = ['emerging', 'developing', 'demonstrating'] as const;
        const tierLines = tiers
          .map((t) => {
            const dloId = `dlo.${threadId}.${t}`;
            const desc = descriptorById.get(dloId);
            return desc ? `  ${dloId}: ${desc}` : null;
          })
          .filter(Boolean);
        if (tierLines.length > 0) {
          lines.push(`${threadId}:\n${tierLines.join('\n')}`);
        }
      }
      if (lines.length > 0) {
        dloDescriptorBlock = `\nCANDIDATE DLO DESCRIPTORS (for discrete_learning_objectives mapping):
Map to DLO ids from this list when they clearly apply. Ground your rationale in the descriptor text.
DLO ids not in this list may still be used if the evidence strongly supports them, but prefer candidates.
${lines.join('\n')}\n`;
      }
    } catch {
      // Best-effort; enrich must not fail if descriptor fetch fails
    }
  }

  const prompt = `FAMILY CONTEXT:
Children on this entry: ${childrenLine}
Active threads:
${threadsLine}

${pedagogySection}
${dloDescriptorBlock}
RECENT ENTRIES (context):
${recentLine || '(none yet)'}

ENTRY TO ENRICH:
Title: ${entry.title}
Description: ${entry.description ?? '(none)'}

Per-child observations:
${discoveriesLine || '(none)'}
${observationDetailsBlock}${structuredNotesBlock}
Engagement selections: ${engagementLine || '(none)'}`;

  return { prompt, pedagogySources };
}

const nudgeProvider = new TemplateNudgeProvider();

// Load the family's current snapshot and project it into the SnapshotSignals
// shape the nudge provider expects (perChild keyed by learner_id). Returns null
// if no snapshot exists yet (new family) — callers should treat that as "no
// nudge this entry."
async function loadSnapshotSignals(
  familyId: string,
  preloaded?: SnapshotData | null,
): Promise<SnapshotSignals | null> {
  const data = preloaded !== undefined
    ? (preloaded as { children?: Record<string, unknown> } | null)
    : ((await db.query.familyIntelligenceSnapshots.findFirst({
        where: eq(familyIntelligenceSnapshots.familyId, familyId),
      }))?.snapshotData as { children?: Record<string, unknown> } | null);
  const children = data?.children;
  if (!children || typeof children !== 'object') return null;

  const perChild: Record<string, { quiet: string[]; active: string[] }> = {};
  for (const [learnerId, raw] of Object.entries(children)) {
    const c = raw as {
      active_threads?: Array<{ thread_id?: string } | string>;
      gap_analysis?: { suggested_focus_threads?: Array<{ thread_id?: string } | string> };
    };
    const active = (c.active_threads ?? [])
      .map((t) => (typeof t === 'string' ? t : t?.thread_id))
      .filter((t): t is string => !!t);
    const quiet = (c.gap_analysis?.suggested_focus_threads ?? [])
      .map((t) => (typeof t === 'string' ? t : t?.thread_id))
      .filter((t): t is string => !!t);
    perChild[learnerId] = { quiet, active };
  }
  return { perChild };
}

// Attach a profile_nudge to the enrichment result in-place. Never throws —
// any failure degrades to null so enrichment persists normally.
async function attachProfileNudge(
  validated: EnrichmentResult,
  familyId: string,
  childRecords: { id: string; name: string }[],
  preloadedSnapshot?: SnapshotData | null,
): Promise<void> {
  try {
    if (childRecords.length === 0) {
      validated.profile_nudge = null;
      return;
    }
    const signals = await loadSnapshotSignals(familyId, preloadedSnapshot);
    if (!signals) {
      validated.profile_nudge = null;
      return;
    }
    const primary = childRecords[0];
    const nudge = await nudgeProvider.getNudge({
      familyId,
      primaryLearnerId: primary.id,
      primaryLearnerName: primary.name,
      snapshotSignals: signals,
    });
    validated.profile_nudge = nudge;
  } catch (err) {
    console.error('[enrichEntry] profile_nudge failed:', err);
    validated.profile_nudge = null;
  }
}

const VALID_JOURNEY_TRIGGERS = new Set(['cross_domain', 'independence', 'metacognition', 'transfer']);

function validateEnrichment(raw: EnrichmentResult, childNames: string[]): EnrichmentResult {
  const rawJourney = raw.journey_observation;
  const journey_observation =
    rawJourney &&
    typeof rawJourney.text === 'string' &&
    rawJourney.text.length > 10 &&
    VALID_JOURNEY_TRIGGERS.has(rawJourney.trigger)
      ? { text: rawJourney.text, trigger: rawJourney.trigger }
      : null;

  // Clamp + coerce the work-sample envelope. Treat missing/malformed as null
  // (entries from older Haiku responses) rather than fabricating a default.
  const rawWS = raw.work_sample;
  const work_sample =
    rawWS && typeof rawWS === 'object' && typeof rawWS.quality === 'number'
      ? {
          flag: Boolean(rawWS.flag),
          quality: Math.max(0, Math.min(1, rawWS.quality)),
          rationale:
            typeof rawWS.rationale === 'string' && rawWS.rationale.length > 0
              ? rawWS.rationale.slice(0, 240)
              : null,
        }
      : null;

  return {
    ...raw,
    capability_threads: (raw.capability_threads ?? []).filter(
      (t) => VALID_THREAD_IDS.has(t.thread_id) && t.confidence >= 0 && t.confidence <= 1
    ),
    curriculum_descriptors: (raw.curriculum_descriptors ?? []).filter(
      (d) => AC9_CODE_PATTERN.test(d.code) && d.confidence >= 0 && d.confidence <= 1
    ),
    per_child_signals: Object.fromEntries(
      Object.entries(raw.per_child_signals ?? {}).filter(([name]) =>
        childNames.some((cn) => cn.toLowerCase() === name.toLowerCase())
      )
    ),
    confidence: Math.max(0, Math.min(1, raw.confidence ?? 0)),
    subjects_detected: raw.subjects_detected ?? [],
    insight_suggestions: (raw.insight_suggestions ?? []).slice(0, 3),
    quality_indicators: raw.quality_indicators ?? {
      description_richness: 'thin',
      evidence_present: false,
      multi_subject: false,
    },
    journey_observation,
    work_sample,
  };
}

// Tracker #34 was diagnosed by a per-step console.log "tape" inside this
// function. Now that the pipeline is healthy we keep the tape but gate it
// on ENRICH_TAPE=1 so prod logs stay readable. The error path always logs
// the final step + message regardless, so the next regression is still
// pinpointable from Vercel logs alone.
const TAPE_ENABLED = process.env.ENRICH_TAPE === '1';

export async function enrichEntry({ entryId, familyId }: EnrichmentContext): Promise<void> {
  const startTime = Date.now();
  let retried = false;
  let lastStep = 'enrichEntry-entered';
  const tape = (step: string) => {
    lastStep = step;
    if (TAPE_ENABLED) {
      console.log(`[enrich-tape] entryId=${entryId} step=${step} ts=${Date.now() - startTime}ms`);
    }
  };

  tape('enrichEntry-entered');
  try {
    const ctx = await assembleContext(entryId, familyId);
    tape('context-assembled');
    const { prompt: userPrompt, pedagogySources } = await buildUserPrompt(ctx);
    tape('prompt-built');
    const childNames = ctx.childRecords.map((c) => c.name);

    const client = new Anthropic();

    // Sonnet fallback per AI Intelligence Layer spec §3.4 is implemented as an
    // async re-enrichment queued after a successful Haiku pass when
    // validated.confidence < 0.5 (see sonnetFallback() below and its call site).
    // It is intentionally fire-and-forget rather than an inline blocking retry
    // so entry save stays fast; revisit if pilot data shows the async path lags.
    const callLLM = async (): Promise<EnrichmentResult> => {
      tape(retried ? 'anthropic-call-retry' : 'anthropic-call-start');
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        // 1024 truncated rich/multi-child entries mid-JSON (per-child threads +
        // DLOs + signals exceed it), so JSON.parse threw and the entry failed
        // enrichment outright. 4096 gives headroom; calls still bill only the
        // tokens actually produced.
        max_tokens: 4096,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userPrompt }],
      });
      tape('anthropic-call-returned');

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

      const parsed = JSON.parse(extractJson(text)) as EnrichmentResult;
      tape('json-parsed');
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;

      await db.insert(aiPipelineLogs).values({
        familyId,
        entryId,
        modelUsed: 'claude-haiku-4-5-20251001',
        inputTokens,
        outputTokens,
        latencyMs: Date.now() - startTime,
        confidence: String(parsed.confidence ?? 0),
        retryTriggered: retried,
      });
      tape('pipeline-log-written');

      return parsed;
    };

    let result: EnrichmentResult;
    try {
      result = await callLLM();
    } catch {
      retried = true;
      result = await callLLM();
    }

    const validated = validateEnrichment(result, childNames);
    if (pedagogySources.length > 0) {
      validated.pedagogy_sources = pedagogySources;
    }
    await attachProfileNudge(validated, familyId, ctx.childRecords, ctx.snapshotData);

    const validatedDlos = await validateDlos(result.discrete_learning_objectives);
    validated.discrete_learning_objectives = validatedDlos;
    // D-OS2: gate DLO evidence to the learner(s) the enrichment named in
    // per_child_signals — never copy-to-all on a multi-child entry. A
    // single-learner entry is unambiguous and attributes that learner.
    const attributedLearnerIds = gateLearnersByNamedSignals({
      learners: ctx.childRecords,
      perChildSignals: validated.per_child_signals,
    });
    if (validatedDlos.length > 0 && attributedLearnerIds.length > 0) {
      try {
        // When the entry's activity author-declared capability targets, its
        // Haiku-inferred DLOs are author-grounded, not a blind guess — tag them
        // 'declared' so they count toward the declared/asserted demonstrating bar
        // (WS-4). Plain Logger entries (no declared targets) stay 'inferred'.
        // (Per-DLO tagging — only DLOs on a declared thread — is a follow-up;
        // it needs declaredThreadIds threaded out of assembleContext.)
        const inferredProvenance =
          (ctx.declaredTargets?.length ?? 0) > 0 ? ('declared' as const) : ('inferred' as const);
        await persistDloLinks({
          entryId,
          learnerIds: attributedLearnerIds,
          dlos: validatedDlos,
          observedAt: new Date(),
          provenance: inferredProvenance,
        });
        tape('dlo-links-persisted');
        // Fire-and-forget — analytics MUST NOT block enrichment.
        void trackServer(
          'dlo.enrichment.completed',
          familyId,
          {
            entry_id: entryId,
            dlo_count: validatedDlos.length,
            learner_count: attributedLearnerIds.length,
          },
          { familyId },
        );
        const mismatches = validatedDlos.filter((d) => d.claimed_tier != null);
        if (mismatches.length > 0) {
          void trackServer(
            'dlo.tier_mismatch',
            familyId,
            {
              entry_id: entryId,
              mismatch_count: mismatches.length,
            },
            { familyId },
          );
        }
      } catch (dloErr) {
        console.error('[enrichEntry] DLO persist failed:', dloErr);
      }
    } else if (validatedDlos.length > 0 && ctx.childRecords.length > 1) {
      // D-OS2 strict path: a multi-child entry produced DLOs but the
      // enrichment named nobody in per_child_signals, so we attribute to
      // nobody (never copy-to-all). Don't drop it silently — make it
      // observable so we can tell "rule working" from "enrichment regressed".
      tape('dlo-links-unattributed-multichild');
      console.warn(
        `[enrichEntry] DLOs produced but no named learner on multi-child entry — dropped per D-OS2. entryId=${entryId} dlo_count=${validatedDlos.length} learner_count=${ctx.childRecords.length}`,
      );
      void trackServer(
        'dlo.attribution.unnamed_multichild',
        familyId,
        {
          entry_id: entryId,
          dlo_count: validatedDlos.length,
          learner_count: ctx.childRecords.length,
        },
        { familyId },
      );
    }

    // Declarative DLO opportunities (WS-6 / D-OS1). A completed targeted activity
    // logs an OPPORTUNITY at the author-declared (thread, tier) — NOT observed
    // evidence. It only becomes evidence when corroborated by this entry's
    // per-child Haiku signal (an inferred DLO with the same id) or, later, a
    // parent tap. A bare completion never moves learner_dlo_status on its own,
    // which is what protects the WS-4 / C3 evidence bar.
    //
    // Opportunities are written for every learner who did the activity — they
    // aren't evidence, so this isn't the copy-to-all D-OS2 forbids. Promotion to
    // evidence is gated to the D-OS2 attributed set (the learners the enrichment
    // named), so an unnamed learner's opportunity stays pending until a parent
    // tap (P-8) corroborates it.
    const declaredTargets = ctx.declaredTargets ?? [];
    const oppLearnerIds = ctx.entry.learnerIds ?? [];
    if (declaredTargets.length > 0 && oppLearnerIds.length > 0) {
      try {
        await persistDeclaredOpportunities({
          entryId,
          learnerIds: oppLearnerIds,
          targets: declaredTargets,
          observedAt: new Date(),
        });
        // Tier-exact corroboration against Haiku's per-child signal, gated to the
        // D-OS2 attributed (named) learner set — never promote evidence for a
        // learner the enrichment didn't name.
        const promoted = attributedLearnerIds.length > 0
          ? await corroborateDloOpportunities({
              entryId,
              learnerIds: attributedLearnerIds,
              signals: validatedDlos.map((d) => ({ dlo_id: d.dlo_id, confidence: d.confidence })),
              observedAt: new Date(),
            })
          : 0;
        tape(`dlo-opportunities-persisted promoted=${promoted}`);
      } catch (oppErr) {
        console.error('[enrichEntry] DLO opportunity persist failed:', oppErr);
      }
    }

    tape('validation-done');
    // Persist the work-sample signal onto the row's columns so Portfolio /
    // Report candidate ranking can sort by quality without re-parsing JSONB.
    // workSampleCandidate stays in lockstep with work_sample.flag; manual parent
    // overrides via Portfolio still win (route handler writes the column directly).
    const wsUpdate: { workSampleCandidate?: boolean; workSampleQuality?: string | null } = {};
    if (validated.work_sample) {
      wsUpdate.workSampleCandidate = validated.work_sample.flag;
      wsUpdate.workSampleQuality = validated.work_sample.quality.toFixed(2);
    }
    await db
      .update(learningEntries)
      .set({
        aiEnrichment: { ...validated, status: 'enriched' as const },
        ...wsUpdate,
        updatedAt: new Date(),
      })
      .where(eq(learningEntries.id, entryId));
    tape('learning-entry-updated');

    // One-line summary log on the healthy path — keeps a paper trail
    // without 11 lines per save. ENRICH_TAPE=1 still streams the full tape.
    console.log(
      `[enrichEntry] ok entryId=${entryId} totalMs=${Date.now() - startTime} retried=${retried} confidence=${validated.confidence.toFixed(2)}`
    );

    // If low confidence, queue async Sonnet re-enrichment
    if (validated.confidence < 0.5) {
      sonnetFallback(entryId, familyId, userPrompt, childNames)
        .catch((err) => console.error('[enrichEntry] Sonnet fallback failed:', err));
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message.slice(0, 200) : String(error).slice(0, 200);
    // Error path always logs the last successful step so the next regression
    // is diagnosable from Vercel logs without flipping ENRICH_TAPE on.
    console.error(
      `[enrichEntry] FAIL entryId=${entryId} lastStep=${lastStep} totalMs=${Date.now() - startTime} msg=${errMsg}`
    );
    console.error('[enrichEntry] Failed:', error);
    // Mark the row as failed so the Logger post-save surface and Portfolio
    // can render an honest state (and the parent-initiated retry has a
    // signal to attach to). Best-effort — never re-throw from the writeback.
    try {
      await db
        .update(learningEntries)
        .set({
          aiEnrichment: {
            status: 'failed' as const,
            failedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message.slice(0, 200) : 'enrichment failed',
          },
          updatedAt: new Date(),
        })
        .where(eq(learningEntries.id, entryId));
    } catch (writeErr) {
      console.error('[enrichEntry] failed-status writeback errored:', writeErr);
    }
    // Entry already saved — enrichment failure is non-blocking, but we do
    // want to see it in Sentry so silent degradation doesn't hide behind
    // a healthy response.
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(error, {
      tags: { pipeline: 'enrich-entry' },
      extra: { entryId, familyId },
    });
  }
}

// ─── Sonnet Fallback ───

async function sonnetFallback(
  entryId: string,
  familyId: string,
  userPrompt: string,
  childNames: string[],
): Promise<void> {
  const startTime = Date.now();
  const client = new Anthropic();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    // Match the primary call's headroom — see note there. Rich/multi-child
    // entries overrun 1024 output tokens and truncate the JSON.
    max_tokens: 4096,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const parsed = JSON.parse(extractJson(text)) as EnrichmentResult;
  const validated = validateEnrichment(parsed, childNames);

  // Preserve pedagogy_sources from the Haiku pass — retrieval happens once upstream.
  const existing = await db
    .select({ aiEnrichment: learningEntries.aiEnrichment })
    .from(learningEntries)
    .where(eq(learningEntries.id, entryId))
    .limit(1);
  const prior = existing[0]?.aiEnrichment as EnrichmentResult | null;
  const priorSources = prior?.pedagogy_sources;
  if (priorSources && priorSources.length > 0) {
    validated.pedagogy_sources = priorSources;
  }
  // Preserve profile_nudge from the Haiku pass — nudge derivation happens once upstream.
  if (prior && 'profile_nudge' in prior) {
    validated.profile_nudge = prior.profile_nudge ?? null;
  }

  await db.insert(aiPipelineLogs).values({
    familyId,
    entryId,
    modelUsed: 'claude-sonnet-4-20250514',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    latencyMs: Date.now() - startTime,
    confidence: String(validated.confidence ?? 0),
    retryTriggered: false,
  });

  const wsUpdate: { workSampleCandidate?: boolean; workSampleQuality?: string | null } = {};
  if (validated.work_sample) {
    wsUpdate.workSampleCandidate = validated.work_sample.flag;
    wsUpdate.workSampleQuality = validated.work_sample.quality.toFixed(2);
  }
  await db
    .update(learningEntries)
    .set({
      aiEnrichment: { ...validated, status: 'enriched' as const },
      ...wsUpdate,
      updatedAt: new Date(),
    })
    .where(eq(learningEntries.id, entryId));

  // Rebuild snapshot since Sonnet may produce different thread mappings
  await rebuildSnapshot(familyId, 'entry_saved');

  console.log(`[sonnetFallback] entry=${entryId} confidence=${validated.confidence} latency=${Date.now() - startTime}ms`);
}
