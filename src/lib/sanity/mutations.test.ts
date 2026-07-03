/**
 * createFullModule — transactional module-tree publish.
 *
 * Pins the atomicity contract: the whole module → approach → activity tree is
 * committed as ONE Sanity transaction with pre-assigned ids and intact
 * cross-references (no post-create patches), so a mid-flight failure can no
 * longer orphan a module shell with dangling refs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { txState } = vi.hoisted(() => {
  const txState = {
    docs: [] as Array<Record<string, unknown>>,
    commit: vi.fn(async () => ({ transactionId: 'tx-1' })),
    transaction: vi.fn(),
  };
  txState.transaction.mockImplementation(() => {
    const tx = {
      createOrReplace: vi.fn((doc: Record<string, unknown>) => {
        txState.docs.push(doc);
        return tx;
      }),
      commit: txState.commit,
    };
    return tx;
  });
  return { txState };
});

vi.mock('@/lib/sanity/client', () => ({
  sanityClient: { fetch: vi.fn(async () => []), getDocument: vi.fn(async () => undefined) },
  sanityWriteClient: {
    transaction: txState.transaction,
    create: vi.fn(async (d: unknown) => d),
    createOrReplace: vi.fn(async (d: unknown) => d),
    patch: vi.fn(() => ({ set: vi.fn(() => ({ commit: vi.fn(async () => ({})) })) })),
    delete: vi.fn(async () => ({})),
  },
  sanityServerClient: { fetch: vi.fn(async () => []) },
}));

import { createFullModule } from './mutations';

const fullInput = () => ({
  title: 'Weather Station',
  targetUnderstanding: 'Weather can be observed and measured',
  subjects: ['science' as const],
  status: 'published' as const,
  authorFamilyId: 'fam-1',
  approaches: [
    {
      title: 'Hands-on',
      modality: 'kinesthetic' as const,
      activities: [
        { title: 'Build a rain gauge', instructions: 'Cut the bottle…' },
        { title: 'Read the gauge', instructions: 'Check daily…' },
      ],
    },
    {
      title: 'Story-first',
      modality: 'narrative' as const,
      activities: [{ title: 'Cloud tales', instructions: 'Read together…' }],
    },
  ],
});

beforeEach(() => {
  txState.docs.length = 0;
  txState.transaction.mockClear();
  txState.commit.mockClear();
});

describe('createFullModule', () => {
  it('commits the entire tree in a single transaction with intact cross-refs', async () => {
    const result = await createFullModule(fullInput());

    expect(txState.transaction).toHaveBeenCalledTimes(1);
    expect(txState.commit).toHaveBeenCalledTimes(1);
    // 1 module + 2 approaches + 3 activities, all staged before the commit.
    expect(txState.docs).toHaveLength(6);

    const moduleDoc = txState.docs.find((d) => d._type === 'module')!;
    const approachDocs = txState.docs.filter((d) => d._type === 'approach');
    const activityDocs = txState.docs.filter((d) => d._type === 'activity');
    expect(approachDocs).toHaveLength(2);
    expect(activityDocs).toHaveLength(3);

    // module.approaches references the approach docs staged in the same tx.
    const approachRefIds = (moduleDoc.approaches as Array<{ _ref: string }>).map((r) => r._ref);
    expect(approachRefIds.sort()).toEqual(approachDocs.map((d) => d._id as string).sort());

    // Each approach back-refs the module and forward-refs its own activities.
    for (const app of approachDocs) {
      expect((app.module as { _ref: string })._ref).toBe(moduleDoc._id);
      const actRefs = (app.activities as Array<{ _ref: string }>).map((r) => r._ref);
      for (const actId of actRefs) {
        const act = activityDocs.find((d) => d._id === actId)!;
        expect(act).toBeDefined();
        expect((act.approach as { _ref: string })._ref).toBe(app._id);
      }
    }

    // Return shape the publish route consumes.
    expect(result.module._id).toBe(moduleDoc._id);
    expect(result.approaches).toHaveLength(2);
    expect(result.approaches[0].activityIds).toHaveLength(2);
    expect(result.approaches[1].activityIds).toHaveLength(1);
  });

  it('generated ids are single-segment (no dots — dotted ids are dark to public reads)', async () => {
    await createFullModule(fullInput());
    for (const doc of txState.docs) {
      expect(String(doc._id)).not.toContain('.');
    }
  });

  it('propagates a commit failure (nothing half-written by construction)', async () => {
    txState.commit.mockRejectedValueOnce(new Error('quota exceeded'));
    await expect(createFullModule(fullInput())).rejects.toThrow('quota exceeded');
    expect(txState.commit).toHaveBeenCalledTimes(1);
  });
});
