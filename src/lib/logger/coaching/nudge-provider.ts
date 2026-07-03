// Template-based NudgeProvider — v1 default.
// Picks the primary child's first quiet thread from snapshotSignals, looks up
// the static template from thread-nudges.ts, substitutes {name}, and returns
// { text, thread_id }. Returns null when no quiet thread qualifies.
// Same interface shape as coaching providers so an LLM variant can replace it later.

import type { NudgeProvider, NudgeInput, ProfileNudge } from './types';
import { THREAD_NUDGES } from '../thread-nudges';
import { isSuppressedThread } from '@/lib/capability-alpha-suppression';

export class TemplateNudgeProvider implements NudgeProvider {
  async getNudge(input: NudgeInput): Promise<ProfileNudge | null> {
    const childSignals = input.snapshotSignals.perChild[input.primaryLearnerId];
    if (!childSignals || childSignals.quiet.length === 0) return null;

    // Pick the first quiet thread that has a template. Alpha-suppressed
    // threads are skipped — never nudge a parent toward a hidden thread.
    const threadId = childSignals.quiet.find((t) => !isSuppressedThread(t) && THREAD_NUDGES[t]);
    if (!threadId) return null;

    const template = THREAD_NUDGES[threadId];
    const text = template.text.replace(/\{name\}/g, input.primaryLearnerName);

    return { text, thread_id: threadId };
  }
}
