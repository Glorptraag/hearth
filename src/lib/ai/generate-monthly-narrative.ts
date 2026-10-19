import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';

export interface MonthlyNarrativeInput {
  childName: string;
  entryCount: number;
  subjects: string[];
  threadNames: string[];
  topActivities: string[];
  badgesEarned: string[];
}

/**
 * Stable fingerprint of everything the narrative prompt is built from, scoped
 * to a calendar month. The snapshot rebuild stores it beside the narrative so
 * a rebuild whose inputs haven't changed (a dashboard load, a DLO confirm, a
 * sibling's entry save, an admin rebuild) reuses the prior text instead of
 * spending a Haiku call per child. Order-insensitive on the set-like fields;
 * order-sensitive on topActivities, which is already most-recent-first.
 */
export function narrativeSignature(input: MonthlyNarrativeInput, monthKey: string): string {
  const canonical = JSON.stringify({
    m: monthKey,
    c: input.childName,
    n: input.entryCount,
    s: [...input.subjects].sort(),
    t: [...input.threadNames].sort(),
    a: input.topActivities,
    b: [...input.badgesEarned].sort(),
  });
  return createHash('sha1').update(canonical, 'utf8').digest('hex').slice(0, 16);
}

export async function generateMonthlyNarrative(
  input: MonthlyNarrativeInput
): Promise<string> {
  if (input.entryCount === 0) return '';

  const prompt = `Write a warm, 2-3 sentence monthly learning summary for a homeschool parent about their child.

Child: ${input.childName}
Entries logged this month: ${input.entryCount}
Subjects covered: ${input.subjects.join(', ') || 'none specified'}
Capability threads growing: ${input.threadNames.slice(0, 5).join(', ') || 'none yet'}
Recent activities: ${input.topActivities.slice(0, 4).join(', ') || 'various'}
Badges earned: ${input.badgesEarned.join(', ') || 'none this month'}

Rules:
- Write in second person ("${input.childName} has been...")
- Warm, affirming tone — celebrate what happened
- Mention 1-2 specific subjects or threads by name
- Keep it under 60 words
- No bullet points, just flowing prose
- Philosophy-neutral (no pedagogical jargon)`;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
  } catch (err) {
    console.error('[generate-monthly-narrative] AI error:', err);
    return '';
  }
}
