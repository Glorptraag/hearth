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
  for (const approach of mod.approaches) {
    if (!approach || typeof approach !== 'object') {
      throw new RunnerFormatError('Module contains an invalid approach.', mod._id);
    }
    if (!Array.isArray(approach.activities) || approach.activities.length === 0) {
      throw new RunnerFormatError(
        `Approach "${approach.title ?? 'untitled'}" has no activities.`,
        mod._id,
      );
    }
    for (const activity of approach.activities) {
      if (!activity?.title) {
        throw new RunnerFormatError('An activity is missing a title.', mod._id);
      }
    }
  }
  return mod as RunnerModule;
}
