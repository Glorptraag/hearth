/**
 * Where a Logger visit came from — "working from" an opportunity, or nothing.
 *
 * Parsed once from the URL. Drives the source banner, any pre-fill, and the
 * provenance fields on the saved entry. Pure so every deep link the app emits
 * can be pinned under test:
 *   /log?scaffold=<sessionId>&hearthId=<id>                 (hearth session)
 *   /log?source=project_stage&projectId=<id>&stageNumber=<n> (project stage)
 *   /log?source=check-in&learner=<id>&thread=<threadId>      (constellation check-in)
 *   /log, /log?resume=<entryId>                              (plain; draft restore is automatic)
 */
import { THREAD_NAMES } from '@/lib/capability-threads';
import { isSuppressedThread } from '@/lib/capability-alpha-suppression';

export type NoticeSource =
  | { kind: 'logger' }
  | { kind: 'hearth_session'; sessionId: string; hearthId: string | null }
  | { kind: 'project_stage'; projectId: string; stageNumber: number | null }
  | { kind: 'check_in'; learnerId: string | null; threadId: string | null };

/** Anything with `.get()` — `URLSearchParams` or Next's `ReadonlyURLSearchParams`. */
export type ParamsLike = { get(name: string): string | null } | null | undefined;

function nonEmpty(value: string | null): string | null {
  const v = value?.trim() ?? '';
  return v.length > 0 ? v : null;
}

export function parseNoticeSource(params: ParamsLike): NoticeSource {
  if (!params) return { kind: 'logger' };

  const scaffold = nonEmpty(params.get('scaffold'));
  if (scaffold) {
    return { kind: 'hearth_session', sessionId: scaffold, hearthId: nonEmpty(params.get('hearthId')) };
  }

  const source = params.get('source');

  if (source === 'project_stage') {
    const projectId = nonEmpty(params.get('projectId'));
    if (!projectId) return { kind: 'logger' };
    const parsed = Number.parseInt(params.get('stageNumber') ?? '', 10);
    return { kind: 'project_stage', projectId, stageNumber: Number.isNaN(parsed) ? null : parsed };
  }

  if (source === 'check-in') {
    const rawThread = nonEmpty(params.get('thread'));
    const threadId =
      rawThread && THREAD_NAMES[rawThread] && !isSuppressedThread(rawThread) ? rawThread : null;
    return { kind: 'check_in', learnerId: nonEmpty(params.get('learner')), threadId };
  }

  return { kind: 'logger' };
}
