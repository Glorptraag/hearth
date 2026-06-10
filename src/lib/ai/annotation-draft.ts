import Anthropic from '@anthropic-ai/sdk';

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

export type AnnotationDraft = {
  observations: string;
  needsStrengths: string;
  adjustment: string;
  planning: string;
};

export type AnnotationDraftInput = {
  learnerName: string;
  entryTitle: string;
  entryDescription: string | null;
  entryDateISO: string;
  subjects: string[];
  subjectArea: string;
  termHalf: 'early' | 'late';
  /** Family's regulator, e.g. "Home Education Unit (HEU)" — from src/config/jurisdictions.ts */
  regulatoryLabel: string;
  subsequentEntries?: Array<{
    title: string;
    dateISO: string;
    description: string | null;
  }>;
};

export const annotationSystem = (
  regulatoryLabel: string,
) => `You are drafting a homeschool parent's ${regulatoryLabel} work-sample annotation in the parent's voice. Output ONLY valid JSON matching the schema below — no preamble, no markdown fences. The first character must be { and the last must be }.

OUTPUT SCHEMA:
{
  "observations": "string — 80-150 words. What the parent noticed in the child's work. Specific, concrete, references the child by name.",
  "needsStrengths": "string — 60-120 words. What strengths emerged, what the child found challenging or interesting. Plain language.",
  "adjustment": "string — 60-120 words. What the parent did differently or how they responded to what they observed. If subsequent entries are given, ground in what actually happened next.",
  "planning": "string — 60-120 words. What the parent might do next to build on this. Tentative, exploratory tone."
}

Rules:
- Second person from the parent's perspective ("I noticed…", "We tried…").
- Use the child's name at least once in observations.
- Draw concrete details from the entry description — do not invent activities, materials, or outcomes.
- Plain language. Australian Curriculum descriptors are NOT for this annotation.
- Each field must be a single paragraph of prose — no bullets, no headers.
- If the entry description is thin, write what can be honestly inferred and keep fields shorter rather than fabricate.`;

export async function generateAnnotationDraft(
  input: AnnotationDraftInput,
): Promise<AnnotationDraft | null> {
  const followUpBlock = (input.subsequentEntries ?? [])
    .slice(0, 4)
    .map((e) => `- ${e.dateISO}: ${e.title}${e.description ? ` — ${e.description.slice(0, 240)}` : ''}`)
    .join('\n');

  const userPrompt = `Child: ${input.learnerName}
Subject area: ${input.subjectArea}
Term half: ${input.termHalf === 'early' ? 'Term 1–2 (early)' : 'Term 3–4 (late)'}

ENTRY (the work sample):
Title: ${input.entryTitle}
Date: ${input.entryDateISO}
Subjects: ${input.subjects.join(', ') || '(unspecified)'}
Description: ${input.entryDescription ?? '(no description recorded)'}

${followUpBlock ? `WHAT HAPPENED NEXT (use to ground adjustment/planning):\n${followUpBlock}\n` : ''}
Draft the four annotation fields.`;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      system: annotationSystem(input.regulatoryLabel),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    const parsed = JSON.parse(extractJson(text)) as Partial<AnnotationDraft>;
    if (
      typeof parsed.observations !== 'string' ||
      typeof parsed.needsStrengths !== 'string' ||
      typeof parsed.adjustment !== 'string' ||
      typeof parsed.planning !== 'string'
    ) {
      return null;
    }
    return {
      observations: parsed.observations.trim(),
      needsStrengths: parsed.needsStrengths.trim(),
      adjustment: parsed.adjustment.trim(),
      planning: parsed.planning.trim(),
    };
  } catch (err) {
    console.error('[annotation-draft] AI error:', err);
    return null;
  }
}

export type ProgressionInput = {
  learnerName: string;
  subjectLabel: string;
  early: {
    title: string;
    dateISO: string;
    description: string | null;
    observations?: string | null;
  };
  late: {
    title: string;
    dateISO: string;
    description: string | null;
    observations?: string | null;
  };
};

export async function generateProgressionSummary(input: ProgressionInput): Promise<string | null> {
  const prompt = `Write 1–2 plain sentences describing the growth between two ${input.subjectLabel} work samples for ${input.learnerName}. Ground every claim in the specifics given — do not invent skills.

EARLY SAMPLE (${input.early.dateISO})
Title: ${input.early.title}
Description: ${input.early.description ?? '(no description)'}
${input.early.observations ? `Parent observed: ${input.early.observations.slice(0, 400)}` : ''}

LATE SAMPLE (${input.late.dateISO})
Title: ${input.late.title}
Description: ${input.late.description ?? '(no description)'}
${input.late.observations ? `Parent observed: ${input.late.observations.slice(0, 400)}` : ''}

Rules:
- 1–2 sentences, max 50 words total.
- Use the child's name once.
- Concrete (cite what changed) — no vague phrases like "showed growth" without specifics.
- If the two samples don't actually show progression, say what shifted in focus or approach instead.
- Plain prose, no markdown, no quotes around the output.`;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    return text.replace(/^["']|["']$/g, '').trim() || null;
  } catch (err) {
    console.error('[progression-summary] AI error:', err);
    return null;
  }
}
