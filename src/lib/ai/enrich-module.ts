import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { aiPipelineLogs, moduleDrafts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

const PATHWAY_GUIDANCE: Record<string, string> = {
  material: `PATHWAY: Material-first. The parent started with a resource (book, kit, object) and is building a module around it.
- targetUnderstanding should describe what the child will understand through interacting with this material.
- steps should begin with introducing/exploring the material, then progress to deeper engagement.
- watchFor should focus on how the child engages with the physical resource.
- pivot should suggest alternative ways to interact with the same material.`,
  process: `PATHWAY: Process-first. The parent started with an activity or process (baking, building, experimenting) and is wrapping a module around it.
- targetUnderstanding should describe the conceptual learning embedded in the process.
- steps should follow the natural sequence of the process itself.
- watchFor should focus on moments of discovery during the hands-on work.
- pivot should suggest simplifying or extending the process.`,
  inquiry: `PATHWAY: Inquiry-first. The parent started with a question the child asked or a curiosity they noticed.
- targetUnderstanding should honour the original question and frame what exploring it reveals.
- steps should follow an inquiry arc: wonder → investigate → synthesise → share.
- watchFor should focus on deepening questions and moments of insight.
- pivot should suggest alternative angles on the same question.`,
  retrospective: `PATHWAY: Retrospective. The parent is capturing learning that already happened organically.
- targetUnderstanding should articulate what the child actually learned (past tense framing is fine).
- steps should reconstruct the natural sequence that occurred.
- watchFor should highlight evidence of learning the parent may not have noticed in the moment.
- pivot is less relevant here — suggest how to extend or revisit the topic.`,
  goal: `PATHWAY: Goal-first. The parent has a specific curriculum outcome or skill target in mind.
- targetUnderstanding should connect the goal to a child-meaningful framing.
- steps should scaffold toward the goal with concrete activities.
- watchFor should focus on progress indicators toward the target.
- pivot should suggest alternative routes to the same goal.`,
};

const SYSTEM_PROMPT = `You are Hearth's module enrichment engine. Given a module draft from a parent's pathway entry, infer any missing educational fields. Return ONLY valid JSON matching the schema below. No preamble, no markdown, no explanation.

OUTPUT SCHEMA:
{
  "targetUnderstanding": "string — one sentence describing the key understanding this module develops",
  "watchFor": "string — observable moments that indicate learning is happening",
  "pivot": "string — what to do if the activity isn't landing",
  "capabilities": [
    { "threadId": "string (e.g. M1, S2, L3)", "confidence": "explicit|inferred" }
  ],
  "steps": [
    {
      "title": "string — step name",
      "instructions": "string — what to do",
      "observationHint": "string — what to watch for during this step"
    }
  ],
  "suggestedSubjects": ["string — lowercase subject keys: english, mathematics, science, hass, arts, technologies, hpe, languages"]
}

RULES:
- Only infer fields the parent left blank. Do not override fields they filled in.
- Capability thread IDs must be from the valid set (L1-L9, M1-M9, S1-S7, H1-H6, P1-P5, PS1-PS7, C1-C7, EF1-EF8).
- For targetUnderstanding, write from the child's perspective: "How X works" not "The student will learn X".
- Steps should be practical and parent-friendly, not academic.
- Keep language warm and observational, not prescriptive.
- Return 2-5 steps maximum.
- Return 1-3 capability threads maximum.
- CRITICAL: Tailor your inference to the pathway the parent used to create this module. Each pathway implies a different starting point and pedagogical intent.`;

interface ModuleDraftData {
  pathway: string;
  title: string;
  targetUnderstanding?: string;
  watchFor?: string;
  pivot?: string;
  steps?: Array<{ title: string; instructions: string; observationHint: string }>;
  subjects?: string[];
  capabilities?: Array<{ threadId: string; confidence: string }>;
  duration?: string;
  setting?: string;
  provenance?: Record<string, unknown>;
}

interface EnrichmentResult {
  targetUnderstanding?: string;
  watchFor?: string;
  pivot?: string;
  capabilities?: Array<{ threadId: string; confidence: 'explicit' | 'inferred' }>;
  steps?: Array<{ title: string; instructions: string; observationHint: string }>;
  suggestedSubjects?: string[];
}

export async function enrichModuleDraft(
  draftId: string,
  familyId: string
): Promise<EnrichmentResult | null> {
  const startTime = Date.now();

  try {
    const draft = await db.query.moduleDrafts.findFirst({
      where: eq(moduleDrafts.id, draftId),
    });
    if (!draft) return null;

    const data = draft.draftData as ModuleDraftData;

    // Determine which fields need inference
    const needsUnderstanding = !data.targetUnderstanding?.trim();
    const needsWatchFor = !data.watchFor?.trim();
    const needsPivot = !data.pivot?.trim();
    const needsSteps = !data.steps?.length;
    const needsCapabilities = !data.capabilities?.length;

    // If nothing needs inference, skip the API call
    if (!needsUnderstanding && !needsWatchFor && !needsPivot && !needsSteps && !needsCapabilities) {
      return null;
    }

    // Build context prompt
    const pathwayHint = PATHWAY_GUIDANCE[data.pathway] ?? '';

    const provenanceContext = data.provenance
      ? `\nPathway provenance: ${JSON.stringify(data.provenance)}`
      : '';

    const existingSteps = data.steps?.length
      ? `\nExisting steps (DO NOT replace): ${JSON.stringify(data.steps)}`
      : '';

    const userPrompt = `${pathwayHint ? pathwayHint + '\n\n' : ''}Module draft from "${data.pathway}" pathway:
Title: ${data.title}
Subjects: ${data.subjects?.join(', ') || 'not specified'}
Duration: ${data.duration || 'not specified'}
Setting: ${data.setting || 'not specified'}
${data.targetUnderstanding ? `Target Understanding (already set): ${data.targetUnderstanding}` : 'Target Understanding: NEEDS INFERENCE'}
${data.watchFor ? `Watch For (already set): ${data.watchFor}` : 'Watch For: NEEDS INFERENCE'}
${data.pivot ? `Pivot (already set): ${data.pivot}` : 'Pivot: NEEDS INFERENCE'}
${data.capabilities?.length ? `Capabilities (already set): ${JSON.stringify(data.capabilities)}` : 'Capabilities: NEEDS INFERENCE'}
${existingSteps || 'Steps: NEEDS INFERENCE'}${provenanceContext}

Only return values for fields marked "NEEDS INFERENCE". Return null for fields already set.`;

    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const latencyMs = Date.now() - startTime;

    // Log to pipeline
    await db.insert(aiPipelineLogs).values({
      familyId,
      modelUsed: 'claude-haiku-4-5-20251001',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs,
      confidence: '0.85',
    });

    // Parse result
    let result: EnrichmentResult;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('[enrichModule] Failed to parse AI response:', text.slice(0, 200));
      return null;
    }

    // Validate capability thread IDs
    if (result.capabilities) {
      result.capabilities = result.capabilities.filter(
        (c) => VALID_THREAD_IDS.has(c.threadId)
      );
    }

    // Merge inferred values back into draft
    const mergedData = { ...data };
    if (needsUnderstanding && result.targetUnderstanding) {
      mergedData.targetUnderstanding = result.targetUnderstanding;
    }
    if (needsWatchFor && result.watchFor) {
      mergedData.watchFor = result.watchFor;
    }
    if (needsPivot && result.pivot) {
      mergedData.pivot = result.pivot;
    }
    if (needsSteps && result.steps?.length) {
      mergedData.steps = result.steps.map((s, i) => ({
        ...s,
        id: `ai-step-${i}`,
      })) as ModuleDraftData['steps'];
    }
    if (needsCapabilities && result.capabilities?.length) {
      mergedData.capabilities = result.capabilities;
    }

    // Update the draft with enriched data
    await db
      .update(moduleDrafts)
      .set({
        draftData: mergedData,
        updatedAt: new Date(),
      })
      .where(eq(moduleDrafts.id, draftId));

    console.log(`[enrichModule] draft=${draftId} latency=${latencyMs}ms inferred=${[
      needsUnderstanding && 'understanding',
      needsWatchFor && 'watchFor',
      needsPivot && 'pivot',
      needsSteps && 'steps',
      needsCapabilities && 'capabilities',
    ].filter(Boolean).join(',')}`);

    return result;
  } catch (error) {
    console.error('[enrichModule] Failed:', error);
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(error, { tags: { pipeline: 'enrich-module' } });
    return null;
  }
}
