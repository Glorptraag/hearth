import Anthropic from '@anthropic-ai/sdk';
import { getJurisdiction } from '@/config/jurisdictions';
import { db } from '@/lib/db';
import {
  hearths,
  hearthMemberships,
  hearthSessions,
  sessionReflections,
  sessionEvidence,
  families,
  learners,
  aiPipelineLogs,
} from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const SYSTEM_PROMPT = `You are a thoughtful community learning facilitator writing a term narrative for a homeschool co-op group. Your job is to tell the story of this group's learning journey over the term.

OUTPUT RULES:
- Write 2-3 paragraphs maximum
- Use <em> tags around key phrases you want emphasised (e.g. <em>eight sessions</em>, <em>interconnection</em>)
- Reference children by FIRST NAME only — never surnames
- Highlight emergent themes: what patterns are appearing across sessions?
- Celebrate growth and memorable moments the families have shared
- Be warm but honest and observational — not saccharine or generic
- Write as a perceptive facilitator who knows these families, not as an AI
- Philosophy-neutral: no pedagogical jargon (no "Charlotte Mason", "Montessori", "unschooling", etc.)
- Ground your narrative in the specific details provided — names, places, activities, reflections
- If reflections mention challenges or pivots, honour those honestly
- Open with a sentence that anchors the reader in the group's scale and rhythm (e.g. "This term, ten children from four families...")`;

interface NarrativeContext {
  hearth: {
    id: string;
    name: string;
    description: string | null;
    createdByFamilyId: string;
    settings: Record<string, unknown> | null;
  };
  sessions: {
    id: string;
    title: string;
    date: string;
    description: string | null;
    sharedRecord: string | null;
  }[];
  reflections: {
    reflectionText: string;
    familyName: string;
  }[];
  members: {
    familyId: string;
    familyName: string;
    childrenNames: string[];
  }[];
  evidenceCount: number;
}

async function assembleNarrativeContext(hearthId: string): Promise<NarrativeContext> {
  const [hearthRow, memberships, sessions, reflections, evidence] = await Promise.all([
    db.select().from(hearths).where(eq(hearths.id, hearthId)).then((r) => r[0]),
    db
      .select({
        familyId: hearthMemberships.familyId,
        status: hearthMemberships.status,
      })
      .from(hearthMemberships)
      .where(and(eq(hearthMemberships.hearthId, hearthId), eq(hearthMemberships.status, 'active'))),
    db
      .select({
        id: hearthSessions.id,
        title: hearthSessions.title,
        date: hearthSessions.date,
        description: hearthSessions.description,
        sharedRecord: hearthSessions.sharedRecord,
        status: hearthSessions.status,
      })
      .from(hearthSessions)
      .where(and(eq(hearthSessions.hearthId, hearthId), eq(hearthSessions.status, 'completed'))),
    db
      .select({
        reflectionText: sessionReflections.reflectionText,
        familyId: sessionReflections.familyId,
        sessionId: sessionReflections.sessionId,
      })
      .from(sessionReflections),
    db
      .select({ id: sessionEvidence.id, sessionId: sessionEvidence.sessionId })
      .from(sessionEvidence),
  ]);

  if (!hearthRow) throw new Error(`Hearth ${hearthId} not found`);

  const sessionIds = sessions.map((s) => s.id);
  const hearthReflections = sessionIds.length > 0
    ? reflections.filter((r) => sessionIds.includes(r.sessionId))
    : [];
  const hearthEvidence = sessionIds.length > 0
    ? evidence.filter((e) => sessionIds.includes(e.sessionId))
    : [];

  const familyIds = memberships.map((m) => m.familyId);

  const [familyRows, learnerRows] = familyIds.length > 0
    ? await Promise.all([
        db.select({ id: families.id, familyName: families.familyName }).from(families).where(inArray(families.id, familyIds)),
        db.select({ id: learners.id, familyId: learners.familyId, name: learners.name }).from(learners).where(inArray(learners.familyId, familyIds)),
      ])
    : [[], []];

  const familyMap = new Map(familyRows.map((f) => [f.id, f.familyName]));

  const members = familyIds.map((fid) => ({
    familyId: fid,
    familyName: familyMap.get(fid) ?? 'Unknown',
    childrenNames: learnerRows.filter((l) => l.familyId === fid).map((l) => l.name),
  }));

  const reflectionsWithNames = hearthReflections.map((r) => ({
    reflectionText: r.reflectionText,
    familyName: familyMap.get(r.familyId) ?? 'A family',
  }));

  return {
    hearth: {
      id: hearthRow.id,
      name: hearthRow.name,
      description: hearthRow.description,
      createdByFamilyId: hearthRow.createdByFamilyId,
      settings: (hearthRow.settings ?? {}) as Record<string, unknown>,
    },
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      date: s.date,
      description: s.description,
      sharedRecord: s.sharedRecord,
    })),
    reflections: reflectionsWithNames,
    members,
    evidenceCount: hearthEvidence.length,
  };
}

function buildUserPrompt(ctx: NarrativeContext): string {
  const allChildren = ctx.members.flatMap((m) => m.childrenNames);
  const familyCount = ctx.members.length;
  const childCount = allChildren.length;

  const sessionsBlock = ctx.sessions
    .map((s) => {
      const summary = (s.sharedRecord ?? s.description ?? '').slice(0, 200);
      return `- ${s.title} (${s.date}): ${summary || '(no notes)'}`;
    })
    .join('\n');

  const reflectionsBlock = ctx.reflections
    .map((r) => `- ${r.familyName}: "${r.reflectionText}"`)
    .join('\n');

  return `GROUP: ${ctx.hearth.name}
${ctx.hearth.description ? `Description: ${ctx.hearth.description}` : ''}

STATS:
- ${ctx.sessions.length} completed sessions
- ${familyCount} families
- ${childCount} children
- ${ctx.evidenceCount} photos/evidence shared

CHILDREN'S FIRST NAMES: ${allChildren.join(', ') || '(none recorded)'}

SESSIONS:
${sessionsBlock || '(none)'}

REFLECTIONS FROM FAMILIES:
${reflectionsBlock || '(none)'}

Write a warm narrative about this group's learning journey this term. Ground it in the specific details above.`;
}

function getCurrentTermLabel(state?: string | null): string {
  const config = getJurisdiction(state ?? null);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const t1End = config.yearLevelCutoffMonth - 2;
  const t2End = config.yearLevelCutoffMonth;
  const t3End = config.yearLevelCutoffMonth + 3;
  if (month <= t1End) return `Term 1, ${year}`;
  if (month <= t2End) return `Term 2, ${year}`;
  if (month <= t3End) return `Term 3, ${year}`;
  return `Term 4, ${year}`;
}

export function isNarrativeStale(settings: Record<string, unknown>): boolean {
  const narrative = settings?.narrative as { generatedAt?: string } | undefined;
  if (!narrative?.generatedAt) return true;
  const age = Date.now() - new Date(narrative.generatedAt).getTime();
  return age > 7 * 24 * 60 * 60 * 1000; // 7 days
}

export async function generateTermNarrative(hearthId: string): Promise<string | null> {
  const startTime = Date.now();

  try {
    const context = await assembleNarrativeContext(hearthId);

    if (context.sessions.length < 2 || context.reflections.length < 1) {
      return null;
    }

    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: buildUserPrompt(context) }],
    });

    const narrative = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    await db.insert(aiPipelineLogs).values({
      familyId: context.hearth.createdByFamilyId,
      modelUsed: 'claude-haiku-4-5-20251001',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs: Date.now() - startTime,
      confidence: '0.8',
      retryTriggered: false,
    });

    const currentSettings = (context.hearth.settings ?? {}) as Record<string, unknown>;
    await db
      .update(hearths)
      .set({
        settings: {
          ...currentSettings,
          narrative: {
            text: narrative,
            generatedAt: new Date().toISOString(),
            termLabel: getCurrentTermLabel(),
          },
        },
        updatedAt: new Date(),
      })
      .where(eq(hearths.id, hearthId));

    return narrative;
  } catch (error) {
    console.error('[hearth-narrative] Generation failed:', error);
    return null;
  }
}
