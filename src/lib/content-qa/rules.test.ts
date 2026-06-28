import { describe, it, expect } from 'vitest';
import { checkDocument, crossFieldRules } from './rules';
import type { SanityDoc, QAIssue } from './types';

const NO_TARGETS_MESSAGE = "activity declares no capability targets (won't contribute to the constellation)";

/** A reference object as Sanity returns it. */
function ref(id: string) {
  return { _key: id, _ref: id };
}

/** A capabilityTargets entry: { thread, tier }. */
function target(threadId: string, tier = 'developing') {
  return { _key: threadId, tier, thread: { _ref: threadId } };
}

/** Minimal activity doc; pass overrides for the fields under test. */
function activity(overrides: Partial<SanityDoc> = {}): SanityDoc {
  return {
    _id: 'activity-1',
    _type: 'activity',
    title: 'Sort the leaves by shape',
    ...overrides,
  };
}

function hasNoTargetsFlag(warnings: QAIssue[]): boolean {
  return warnings.some((w) => w.field === 'capabilityTargets' && w.message === NO_TARGETS_MESSAGE);
}

describe("activity soft-flag: 'no capability targets'", () => {
  it('does NOT flag an activity that declares capabilityTargets', () => {
    const { warnings } = checkDocument(activity({ capabilityTargets: [target('M1')] }), 'activity');
    expect(hasNoTargetsFlag(warnings)).toBe(false);
  });

  it('does NOT flag an activity that still has legacy capabilityThreads (it contributes via the fallback)', () => {
    const { warnings } = checkDocument(activity({ capabilityThreads: [ref('M1')] }), 'activity');
    expect(hasNoTargetsFlag(warnings)).toBe(false);
  });

  it('does NOT flag an activity that has both threads and targets', () => {
    const { warnings } = checkDocument(
      activity({ capabilityThreads: [ref('M1')], capabilityTargets: [target('M1')] }),
      'activity',
    );
    expect(hasNoTargetsFlag(warnings)).toBe(false);
  });

  it('flags an activity with neither capabilityThreads nor capabilityTargets', () => {
    const { warnings } = checkDocument(activity(), 'activity');
    const flag = warnings.find((w) => w.field === 'capabilityTargets' && w.message === NO_TARGETS_MESSAGE);
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe('warning');
    expect(flag?.docType).toBe('activity');
    expect(flag?.path).toEqual(['capabilityTargets']);
  });

  it('treats empty arrays the same as missing (still flags)', () => {
    const { warnings } = checkDocument(
      activity({ capabilityThreads: [], capabilityTargets: [] }),
      'activity',
    );
    expect(hasNoTargetsFlag(warnings)).toBe(true);
  });

  it('is non-blocking: emits a warning, never an error', () => {
    const { errors, warnings } = checkDocument(activity(), 'activity');
    expect(hasNoTargetsFlag(warnings)).toBe(true);
    expect(errors.some((e) => e.field === 'capabilityTargets')).toBe(false);
  });

  it('does not change the completeness score (soft signal)', () => {
    // Same doc, with vs without targets — the cross-field flag must not move completeness.
    const base = activity({ capabilityThreads: [ref('M1')] });
    const withTargets = activity({ capabilityThreads: [ref('M1')], capabilityTargets: [target('M1')] });
    expect(checkDocument(base, 'activity').completeness).toBe(
      checkDocument(withTargets, 'activity').completeness,
    );
  });

  it('only applies to activities, not other doc types', () => {
    expect(crossFieldRules.activity).toBeDefined();
    expect(crossFieldRules.module).toBeUndefined();
    expect(crossFieldRules.pack).toBeUndefined();
  });
});

const COMMONS_MESSAGE =
  "activity has commonsText entries that won't render (missing `text` reference, or target is unpublished/missing)";

/** A commonsTexts entry as fetchPackTree projects it (resolution flag included). */
function commonsEntry(over: Partial<Record<string, unknown>> = {}) {
  return { _key: 'c1', role: 'core', textId: null, textPublished: true, ...over };
}

function commonsFlag(issues: QAIssue[]) {
  return issues.find((i) => i.field === 'commonsTexts' && i.message === COMMONS_MESSAGE);
}

describe("activity flag: 'commonsText won't render'", () => {
  it('does NOT flag an activity with no commonsTexts', () => {
    const { errors } = checkDocument(activity(), 'activity');
    expect(commonsFlag(errors)).toBeUndefined();
  });

  it('does NOT flag an activity whose entry resolves to a published text', () => {
    const { errors } = checkDocument(
      activity({ commonsTexts: [commonsEntry({ textPublished: true })] }),
      'activity',
    );
    expect(commonsFlag(errors)).toBeUndefined();
  });

  it('flags the off-schema `textId`-string shape (no `text` ref → textPublished falsy)', () => {
    const { errors } = checkDocument(
      activity({ commonsTexts: [commonsEntry({ textId: 'commons.scripture.joseph', textPublished: null })] }),
      'activity',
    );
    const flag = commonsFlag(errors);
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe('error');
    expect(flag?.docType).toBe('activity');
    expect(flag?.path).toEqual(['commonsTexts']);
  });

  it('flags a `text` ref whose target is unpublished/missing (textPublished false)', () => {
    const { errors } = checkDocument(
      activity({ commonsTexts: [commonsEntry({ textPublished: false })] }),
      'activity',
    );
    expect(commonsFlag(errors)).toBeDefined();
  });

  it('flags when ANY entry is bad even if others are fine', () => {
    const { errors } = checkDocument(
      activity({ commonsTexts: [commonsEntry({ textPublished: true }), commonsEntry({ _key: 'c2', textPublished: null })] }),
      'activity',
    );
    expect(commonsFlag(errors)).toBeDefined();
  });

  it('does not change the completeness score (cross-field signal)', () => {
    const good = activity({ commonsTexts: [commonsEntry({ textPublished: true })] });
    const bad = activity({ commonsTexts: [commonsEntry({ textPublished: null })] });
    expect(checkDocument(good, 'activity').completeness).toBe(
      checkDocument(bad, 'activity').completeness,
    );
  });
});
