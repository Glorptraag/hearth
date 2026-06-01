import { describe, it, expect } from 'vitest';
import {
  packPublishSchema,
  workbenchContentFlags,
  workbenchIdResolutionFlags,
} from './validation';
import { transformPack, transformModuleForFullCreate } from './sanity-transform';
import { createEmptyActivity, createEmptyApproach, createEmptyModule, createEmptyPack, createEmptyWorkbench, createEmptyWorkbenchPack } from './factories';
import type { ActivityDraft, PackDraft, WorkbenchDraft } from './types';

function makeWb(overrides: Partial<WorkbenchDraft> = {}): WorkbenchDraft {
  return {
    ...createEmptyWorkbench(),
    handOffFraming: 'Pop in any time. The bench is yours now.',
    parentOffGuidance:
      'Step away once the child settles. Do not check on them. They are learning to stay with their own work.',
    whatTheBenchInvites:
      'A laid-out set of root cards inviting comparison and arrangement, with space to lay them out.',
    evidenceTrail: 'Cards left arranged on the mat reveal the comparisons the child made.',
    materialAssetIds: ['asset.wb_roots.aqua_root_cards.v1'],
    workbenchId: 'wb_roots_discovery',
    ...overrides,
  };
}

function makeActivity(overrides: Partial<ActivityDraft> = {}): ActivityDraft {
  return {
    ...createEmptyActivity('Sample Activity'),
    instructionsText: 'Lay out the cards together and read their roots aloud.',
    ...overrides,
  };
}

function makePack(opts: { withWorkbenches?: boolean; activityWb?: WorkbenchDraft | null } = {}): PackDraft {
  const pack = createEmptyPack('Sample Pack');
  pack.description = 'Sample pack for tests';
  if (opts.withWorkbenches) {
    pack.workbenches = [
      { ...createEmptyWorkbenchPack('wb_roots_discovery'), name: 'Roots & Discovery' },
    ];
  }
  const activity = makeActivity();
  if (opts.activityWb !== null && opts.activityWb !== undefined) {
    activity.workbench = opts.activityWb;
  } else if (opts.activityWb === null) {
    delete activity.workbench;
  }
  const approach = createEmptyApproach('Approach A');
  approach.modality = 'kinesthetic';
  approach.activities = [activity];
  const mod = createEmptyModule('Module 1');
  mod.targetUnderstanding = 'Children compare roots';
  mod.approaches = [approach];
  pack.modules = [mod];
  return pack;
}

describe('packPublishSchema — workbench fields', () => {
  it('accepts a pack with no workbenches and an activity with no workbench (both optional)', () => {
    const pack = makePack({ activityWb: null });
    const result = packPublishSchema.safeParse(pack);
    expect(result.success).toBe(true);
  });

  it('accepts a pack with workbenches[] and an activity with workbench{}', () => {
    const pack = makePack({ withWorkbenches: true, activityWb: makeWb() });
    const result = packPublishSchema.safeParse(pack);
    expect(result.success).toBe(true);
  });

  it('rejects a workbench with empty materialAssetIds', () => {
    const wb = makeWb({ materialAssetIds: [] });
    const pack = makePack({ withWorkbenches: true, activityWb: wb });
    const result = packPublishSchema.safeParse(pack);
    expect(result.success).toBe(false);
  });

  it('rejects a workbench missing required fields', () => {
    const wb = { ...makeWb(), workbenchId: '' };
    const pack = makePack({ withWorkbenches: true, activityWb: wb });
    const result = packPublishSchema.safeParse(pack);
    expect(result.success).toBe(false);
  });
});

describe('packPublishSchema — stripePriceId is conditional on availability', () => {
  it('accepts an included pack with no Stripe price (architecture §7 — no freemium UI)', () => {
    const pack = makePack({ activityWb: null });
    pack.availability = 'included';
    pack.stripePriceId = '';
    const result = packPublishSchema.safeParse(pack);
    expect(result.success).toBe(true);
  });

  it('rejects a premium pack with no Stripe price', () => {
    const pack = makePack({ activityWb: null });
    pack.availability = 'premium';
    pack.stripePriceId = '';
    const result = packPublishSchema.safeParse(pack);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join('.') === 'stripePriceId')).toBe(true);
    }
  });

  it('accepts a premium pack that carries a Stripe price', () => {
    const pack = makePack({ activityWb: null });
    pack.availability = 'premium';
    pack.stripePriceId = 'price_123';
    const result = packPublishSchema.safeParse(pack);
    expect(result.success).toBe(true);
  });
});

describe('workbenchIdResolutionFlags', () => {
  it('flags an activity workbenchId not declared on the pack', () => {
    const flags = workbenchIdResolutionFlags({
      declaredIds: new Set(['wb_roots_discovery']),
      modules: [
        {
          title: 'M',
          approaches: [
            {
              title: 'A',
              activities: [
                { title: 'Act', workbench: { workbenchId: 'wb_undeclared' } },
              ],
            },
          ],
        },
      ],
    });
    expect(flags).toHaveLength(1);
    expect(flags[0]!.rule).toBe('workbenchId.unresolved');
  });

  it('does not flag when the id resolves', () => {
    const flags = workbenchIdResolutionFlags({
      declaredIds: new Set(['wb_roots_discovery']),
      modules: [
        {
          title: 'M',
          approaches: [
            {
              title: 'A',
              activities: [
                { title: 'Act', workbench: { workbenchId: 'wb_roots_discovery' } },
              ],
            },
          ],
        },
      ],
    });
    expect(flags).toHaveLength(0);
  });
});

describe('workbenchContentFlags — addendum §5', () => {
  it('flags parent-off guidance lacking restrictive language', () => {
    const flags = workbenchContentFlags(
      {
        handOffFraming: 'You can pop in.',
        parentOffGuidance: 'Step back when the child settles in for solo work.',
        whatTheBenchInvites: 'A set of root cards arranged for comparison.',
      },
      'loc',
    );
    expect(flags.some((f) => f.rule === 'parentOffGuidance.requires-restrictive-language')).toBe(true);
  });

  it('does not flag parent-off guidance with explicit "do not" language', () => {
    const flags = workbenchContentFlags(
      {
        handOffFraming: 'You can pop in.',
        parentOffGuidance: 'Step back. Do not check on them while they are at the bench.',
        whatTheBenchInvites: 'Root cards laid out for comparison.',
      },
      'loc',
    );
    expect(flags.some((f) => f.rule === 'parentOffGuidance.requires-restrictive-language')).toBe(false);
  });

  it('flags duration language in whatTheBenchInvites', () => {
    const flags = workbenchContentFlags(
      {
        handOffFraming: 'Pop in any time.',
        parentOffGuidance: "Don't check on them.",
        whatTheBenchInvites: 'A bench inviting work for at least 20 minutes of comparison.',
      },
      'loc',
    );
    expect(flags.some((f) => f.rule === 'whatTheBenchInvites.no-duration-language')).toBe(true);
  });

  it('flags completion language in whatTheBenchInvites', () => {
    const flags = workbenchContentFlags(
      {
        handOffFraming: 'Pop in any time.',
        parentOffGuidance: "Don't check on them.",
        whatTheBenchInvites: 'Make sure they finish all the cards laid out.',
      },
      'loc',
    );
    expect(flags.some((f) => f.rule === 'whatTheBenchInvites.no-completion-language')).toBe(true);
  });

  it('flags combined word count over 200', () => {
    const long = Array(110).fill('word').join(' ');
    const flags = workbenchContentFlags(
      {
        handOffFraming: long,
        parentOffGuidance: 'Do not interrupt. ' + long,
        whatTheBenchInvites: 'Cards.',
      },
      'loc',
    );
    expect(flags.some((f) => f.rule === 'handOffFraming+parentOffGuidance.word-cap')).toBe(true);
  });
});

describe('sanity-transform — workbench mapping', () => {
  it('passes workbench through transformModuleForFullCreate', () => {
    const wb = makeWb();
    const activity = makeActivity({ workbench: wb });
    const approach = createEmptyApproach('A');
    approach.modality = 'kinesthetic';
    approach.activities = [activity];
    const mod = createEmptyModule('M');
    mod.targetUnderstanding = 'X';
    mod.approaches = [approach];
    const result = transformModuleForFullCreate(mod);
    expect(result.approaches[0]!.activities[0]!.workbench).toBeDefined();
    expect(result.approaches[0]!.activities[0]!.workbench!.workbenchId).toBe('wb_roots_discovery');
    expect(result.approaches[0]!.activities[0]!.workbench!.materialAssetIds).toEqual([
      'asset.wb_roots.aqua_root_cards.v1',
    ]);
  });

  it('omits workbench from transform when activity has none', () => {
    const activity = makeActivity();
    const approach = createEmptyApproach('A');
    approach.modality = 'kinesthetic';
    approach.activities = [activity];
    const mod = createEmptyModule('M');
    mod.targetUnderstanding = 'X';
    mod.approaches = [approach];
    const result = transformModuleForFullCreate(mod);
    expect(result.approaches[0]!.activities[0]!.workbench).toBeUndefined();
  });

  it('passes pack workbenches[] through transformPack', () => {
    const pack = makePack({ withWorkbenches: true, activityWb: null });
    const result = transformPack(pack, [], []);
    expect(result.workbenches).toBeDefined();
    expect(result.workbenches![0]!.id).toBe('wb_roots_discovery');
  });

  it('omits workbenches when pack has none', () => {
    const pack = makePack({ activityWb: null });
    const result = transformPack(pack, [], []);
    expect(result.workbenches).toBeUndefined();
  });
});
