import type {
  Module as RunnerModule,
  Approach as RunnerApproach,
  Activity as RunnerActivity,
} from '@/app/(auth)/module/[id]/_components/types';

export type { RunnerModule, RunnerApproach, RunnerActivity };

export class RunnerFormatError extends Error {
  constructor(
    message: string,
    public readonly moduleId: string | null,
  ) {
    super(message);
    this.name = 'RunnerFormatError';
  }
}

/**
 * Validates a Sanity module document and returns it typed for the
 * Module Experience runner. Per module-builder spec §6.3, this is the
 * seam between builder output and runner input. Today the shape already
 * matches so this is largely a validator; future transforms (e.g.
 * pedagogy overlay pre-application) can live here.
 */
export function toRunnerFormat(raw: unknown): RunnerModule {
  if (!raw || typeof raw !== 'object') {
    throw new RunnerFormatError('Module data is missing.', null);
  }
  const mod = raw as Partial<RunnerModule>;
  if (!mod._id || typeof mod._id !== 'string') {
    throw new RunnerFormatError('Module is missing an _id.', null);
  }
  if (!mod.title || typeof mod.title !== 'string') {
    throw new RunnerFormatError('Module is missing a title.', mod._id);
  }
  if (!Array.isArray(mod.approaches) || mod.approaches.length === 0) {
    throw new RunnerFormatError(
      'This module has no approaches yet. It needs at least one approach with one activity before it can run.',
      mod._id,
    );
  }
  // Tolerate one broken link in the chain. The GROQ status-gate
  // (`approaches[@->status == "published"]->{ activities[@->status == "published"]-> }`)
  // already drops draft approaches and draft activities, but it CANNOT drop a
  // *published* approach whose activities are all still draft — that survives as
  // an approach with an empty `activities` array. A dangling/deleted approach
  // ref is likewise filtered to nothing. Drop those non-runnable approaches
  // instead of failing the whole module: a sibling approach that IS fully
  // published must still run. The runner is approach-pick based, so a parent
  // simply never sees the unfinished alternative. Only when NOTHING is runnable
  // do we surface the same "not ready" error as a genuinely empty module.
  const runnableApproaches = mod.approaches.filter((approach) => {
    const activities =
      approach && typeof approach === 'object' ? approach.activities : undefined;
    return Array.isArray(activities) && activities.length > 0;
  });
  if (runnableApproaches.length === 0) {
    throw new RunnerFormatError(
      'This module has no approaches yet. It needs at least one approach with one activity before it can run.',
      mod._id,
    );
  }
  // A titleless activity is malformed content (title is schema- and Zod-required),
  // not a draft-gating hole — surface it loudly rather than degrading silently.
  for (const approach of runnableApproaches) {
    for (const activity of approach.activities ?? []) {
      if (!activity?.title) {
        throw new RunnerFormatError('An activity is missing a title.', mod._id);
      }
    }
  }
  return { ...mod, approaches: runnableApproaches } as RunnerModule;
}
