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

const VALID_THREAD_IDS = new Set([
  'L1','L2','L3','L4','L5','L6','L7','L8','L9',
  'M1','M2','M3','M4','M5','M6','M7','M8','M9',
  'S1','S2','S3','S4','S5','S6','S7',
  'H1','H2','H3','H4','H5','H6',
  'P1','P2','P3','P4','P5',
  'PS1','PS2','PS3','PS4','PS5','PS6','PS7',
  'C1','C2','C3','C4','C5','C6','C7',
  'EF1','EF2','EF3','EF4','EF5','EF6','EF7','EF8',
]);

const AC9_CODE_PATTERN = /^AC9[A-Z]{1,4}\d{1,2}[A-Z]{1,3}\d{2}$/;

const SYSTEM_PROMPT = `You are Hearth's learning entry enrichment engine. Return ONLY valid JSON matching the schema below. No preamble, no markdown, no explanation. Do NOT wrap the JSON in code fences (no \`\`\`json … \`\`\`). The first character of your response must be { and the last must be }.

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
  const [entry, settings, recentEntries] = await Promise.all([
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
  ]);

  if (!entry) throw new Error(`Entry ${entryId} not found`);

  const entryLearnerIds = entry.learnerIds ?? [];
  const childRecords = entryLearnerIds.length > 0
    ? await db.select().from(learners).where(inArray(learners.id, entryLearnerIds))
    : [];

  // Derive active threads from previous entries' aiEnrichment
  const activeThreads: Record<string, string[]> = {};
  for (const child of childRecords) {
    const childEntries = recentEntries.filter((e) => e.learnerIds?.includes(child.id));
    const threadIds = new Set<string>();
    for (const e of childEntries) {
      const enrichment = e.aiEnrichment as EnrichmentResult | null;
      for (const t of enrichment?.capability_threads ?? []) {
        threadIds.add(t.thread_id);
      }
    }
    activeThreads[child.name] = [...threadIds];
  }

  const recent = recentEntries
    .filter((e) => e.id !== entryId)
    .slice(0, 5);

  return { entry, settings, childRecords, activeThreads, recentEntries: recent };
}

async function buildUserPrompt(ctx: Awaited<ReturnType<typeof assembleContext>>): Promise<{ prompt: string; pedagogySources: PedagogySource[] }> {
  const { entry, settings, childRecords, activeThreads, recentEntries } = ctx;
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

  // Build pedagogy context (retrieval + formatting, gated by PEDAGOGY_KB_ENABLED)
  const { prompt: pedagogySection, sources: pedagogySources } = await buildPedagogyContextWithSources({
    entryTitle: entry.title ?? '',
    entryDescription: entry.description ?? '',
    framework: pedagogy,
    childAges,
    capabilityThreads: activeThreadList,
  });

  const prompt = `FAMILY CONTEXT:
Children on this entry: ${childrenLine}
Active threads:
${threadsLine}

${pedagogySection}

RECENT ENTRIES (context):
${recentLine || '(none yet)'}

ENTRY TO ENRICH:
Title: ${entry.title}
Description: ${entry.description ?? '(none)'}

Per-child observations:
${discoveriesLine || '(none)'}
${observationDetailsBlock}
Engagement selections: ${engagementLine || '(none)'}`;

  return { prompt, pedagogySources };
}

const nudgeProvider = new TemplateNudgeProvider();

// Load the family's current snapshot and project it into the SnapshotSignals
// shape the nudge provider expects (perChild keyed by learner_id). Returns null
// if no snapshot exists yet (new family) — callers should treat that as "no
// nudge this entry."
async function loadSnapshotSignals(familyId: string): Promise<SnapshotSignals | null> {
  const snap = await db.query.familyIntelligenceSnapshots.findFirst({
    where: eq(familyIntelligenceSnapshots.familyId, familyId),
  });
  const data = snap?.snapshotData as { children?: Record<string, unknown> } | null;
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
): Promise<void> {
  try {
    if (childRecords.length === 0) {
      validated.profile_nudge = null;
      return;
    }
    const signals = await loadSnapshotSignals(familyId);
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

    const callLLM = async (): Promise<EnrichmentResult> => {
      tape(retried ? 'anthropic-call-retry' : 'anthropic-call-start');
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
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
    await attachProfileNudge(validated, familyId, ctx.childRecords);

    tape('validation-done');
    await db
      .update(learningEntries)
      .set({
        aiEnrichment: { ...validated, status: 'enriched' as const },
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
    max_tokens: 1024,
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

  await db
    .update(learningEntries)
    .set({
      aiEnrichment: { ...validated, status: 'enriched' as const },
      updatedAt: new Date(),
    })
    .where(eq(learningEntries.id, entryId));

  // Rebuild snapshot since Sonnet may produce different thread mappings
  await rebuildSnapshot(familyId, 'entry_saved');

  console.log(`[sonnetFallback] entry=${entryId} confidence=${validated.confidence} latency=${Date.now() - startTime}ms`);
}
