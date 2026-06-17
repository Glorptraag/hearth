import { describe, it, expect } from 'vitest';
import { toRunnerFormat, RunnerFormatError } from './to-runner-format';

// Minimal Sanity-module shape after MODULE_DETAIL_QUERY's status-gated derefs.
// The query drops draft approaches/activities; what reaches the runner can still
// contain a *published* approach with an empty `activities` array (all its
// activities are draft) — the "one break in the chain" case these tests pin.
function mod(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'module_1',
    title: 'Tide Pools',
    approaches: [
      { _id: 'a1', title: 'Hands-on', activities: [{ _id: 'act1', title: 'Observe' }] },
    ],
    ...overrides,
  };
}

describe('toRunnerFormat — input guards', () => {
  it('throws when the module is missing entirely', () => {
    expect(() => toRunnerFormat(null)).toThrow(RunnerFormatError);
    expect(() => toRunnerFormat(undefined)).toThrow(RunnerFormatError);
    expect(() => toRunnerFormat('nope')).toThrow(RunnerFormatError);
  });

  it('throws when _id is missing', () => {
    expect(() => toRunnerFormat(mod({ _id: undefined }))).toThrow(/missing an _id/i);
  });

  it('throws when title is missing', () => {
    expect(() => toRunnerFormat(mod({ title: undefined }))).toThrow(/missing a title/i);
  });

  it('throws "not ready" when there are no approaches at all', () => {
    expect(() => toRunnerFormat(mod({ approaches: [] }))).toThrow(/no approaches yet/i);
    expect(() => toRunnerFormat(mod({ approaches: undefined }))).toThrow(/no approaches yet/i);
  });

  it('happy path returns the module with its approaches intact', () => {
    const result = toRunnerFormat(mod());
    const approaches = result.approaches ?? [];
    expect(approaches).toHaveLength(1);
    expect(approaches[0]._id).toBe('a1');
  });
});

describe('toRunnerFormat — one break in the chain (draft/published gating holes)', () => {
  it('drops a published approach whose activities are all draft, keeping a runnable sibling', () => {
    // GROQ gated the draft activities out, leaving approach a2 with [].
    const result = toRunnerFormat(
      mod({
        approaches: [
          { _id: 'a1', title: 'Hands-on', activities: [{ _id: 'act1', title: 'Observe' }] },
          { _id: 'a2', title: 'Story-led', activities: [] },
        ],
      }),
    );
    // The whole module must NOT fail — the finished approach still runs.
    const approaches = result.approaches ?? [];
    expect(approaches).toHaveLength(1);
    expect(approaches[0]._id).toBe('a1');
  });

  it('drops a dangling/null approach ref but keeps the runnable one', () => {
    const result = toRunnerFormat(
      mod({
        approaches: [
          null,
          { _id: 'a1', title: 'Hands-on', activities: [{ _id: 'act1', title: 'Observe' }] },
        ],
      }),
    );
    const approaches = result.approaches ?? [];
    expect(approaches).toHaveLength(1);
    expect(approaches[0]._id).toBe('a1');
  });

  it('throws "not ready" only when EVERY approach is non-runnable', () => {
    expect(() =>
      toRunnerFormat(
        mod({
          approaches: [
            { _id: 'a1', title: 'Hands-on', activities: [] },
            { _id: 'a2', title: 'Story-led', activities: [] },
          ],
        }),
      ),
    ).toThrow(/no approaches yet/i);
  });

  it('surfaces a missing-title activity loudly (corruption, not a gating hole)', () => {
    expect(() =>
      toRunnerFormat(
        mod({
          approaches: [
            { _id: 'a1', title: 'Hands-on', activities: [{ _id: 'act1' }] },
          ],
        }),
      ),
    ).toThrow(/missing a title/i);
  });
});
