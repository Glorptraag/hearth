import { describe, it, expect } from 'vitest';
import { describeIssues, humaniseField } from './PublishDialog';
import { packPublishSchema } from '@/lib/content-studio/validation';
import {
  createEmptyPack,
  createEmptyModule,
  createEmptyApproach,
  createEmptyActivity,
} from '@/lib/content-studio/factories';

// Build a pack tree from empty factories. Empty drafts are deliberately
// incomplete, so packPublishSchema reports the same blocking issues the
// editorial author would hit on publish — which is exactly what the dry-run
// panel renders.
function emptyPackTree() {
  const pack = createEmptyPack('Term Foundations');
  const mod = createEmptyModule('Listening Walks');
  const approach = createEmptyApproach('Quiet Observation');
  approach.activities.push(createEmptyActivity('Dawn Chorus'));
  mod.approaches.push(approach);
  pack.modules.push(mod);
  return pack;
}

describe('humaniseField', () => {
  it('splits camelCase into a readable label', () => {
    expect(humaniseField('targetUnderstanding')).toBe('Target understanding');
    expect(humaniseField('instructionsText')).toBe('Instructions text');
  });

  it('returns an empty string for an empty field', () => {
    expect(humaniseField('')).toBe('');
  });
});

describe('describeIssues', () => {
  it('resolves array indices to their document titles in the breadcrumb', () => {
    const pack = emptyPackTree();
    const parsed = packPublishSchema.safeParse(pack);
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const readable = describeIssues(pack, parsed.error.issues);

    // A deep activity-level issue should carry the full module › approach › activity trail.
    const activityIssue = readable.find((r) => r.location.includes('Activity "Dawn Chorus"'));
    expect(activityIssue).toBeDefined();
    expect(activityIssue!.location).toContain('Module "Listening Walks"');
    expect(activityIssue!.location).toContain('Approach "Quiet Observation"');
  });

  it('labels top-level pack fields as "Pack"', () => {
    // A pack missing its description but otherwise shaped: empty title/description
    // are top-level issues with no array segment in the path.
    const pack = emptyPackTree();
    const parsed = packPublishSchema.safeParse(pack);
    if (parsed.success) throw new Error('expected validation to fail');

    const readable = describeIssues(pack, parsed.error.issues);
    const packLevel = readable.find((r) => r.location === 'Pack');
    expect(packLevel).toBeDefined();
  });

  it('falls back to a positional label when a sibling has no title', () => {
    const pack = createEmptyPack('Untitled bits');
    const mod = createEmptyModule(''); // no title → positional fallback
    mod.approaches.push(createEmptyApproach('A'));
    mod.approaches[0].activities.push(createEmptyActivity('Act'));
    pack.modules.push(mod);

    const parsed = packPublishSchema.safeParse(pack);
    if (parsed.success) throw new Error('expected validation to fail');

    const readable = describeIssues(pack, parsed.error.issues);
    expect(readable.some((r) => r.location.includes('Module #1'))).toBe(true);
  });
});
