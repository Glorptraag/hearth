import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import {
  learningEntries,
  learners,
  familySettings,
} from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { aiPipelineLogs } from '@/lib/db/schema';
import { buildPedagogyContext } from './pedagogy-context';

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

const SYSTEM_PROMPT = `You are Hearth's learning entry enrichment engine. Return ONLY valid JSON matching the schema below. No preamble, no markdown, no explanation.

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

async function buildUserPrompt(ctx: Awaited<ReturnType<typeof assembleContext>>): Promise<string> {
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
  const pedagogySection = await buildPedagogyContext({
    entryTitle: entry.title ?? '',
    entryDescription: entry.description ?? '',
    framework: pedagogy,
    childAges,
    capabilityThreads: activeThreadList,
  });

  return `FAMILY CONTEXT:
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

Engagement selections: ${engagementLine || '(none)'}`;
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

export async function enrichEntry({ entryId, familyId }: EnrichmentContext): Promise<void> {
  const startTime = Date.now();
  let retried = false;

  try {
    const ctx = await assembleContext(entryId, familyId);
    const userPrompt = await buildUserPrompt(ctx);
    const childNames = ctx.childRecords.map((c) => c.name);

    const client = new Anthropic();

    const callLLM = async (): Promise<EnrichmentResult> => {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

      const parsed = JSON.parse(text) as EnrichmentResult;
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

    await db
      .update(learningEntries)
      .set({
        aiEnrichment: validated,
        updatedAt: new Date(),
      })
      .where(eq(learningEntries.id, entryId));
  } catch (error) {
    console.error('[enrichEntry] Failed:', error);
    // Entry already saved — enrichment failure is non-blocking
  }
}
