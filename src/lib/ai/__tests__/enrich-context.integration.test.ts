/**
 * INTEGRATION: enrichEntry assembles a child's active-thread profile from the
 * family snapshot, not from the six most recent family-wide entries.
 *
 * Before this landed, a child with a long history in a multi-child family
 * could read "none yet" in the Haiku prompt (the six-entry window was shared
 * across siblings), so no candidate DLO descriptors were injected and the
 * pedagogy retrieval saw no threads to boost. This pins that the prompt now
 * lists the snapshot's threads (most recent first) plus any thread from a
 * recent save the snapshot hasn't incorporated yet, and that candidate DLO
 * descriptors follow.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry, createSnapshot } from '@/test/db-factories';
import { enrichEntry } from '../enrich';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../../../vitest.setup';

const { createMock } = vi.hoisted(() => {
  const FULL_ENRICHMENT = {
    subjects_detected: ['Mathematics'],
    capability_threads: [{ thread_id: 'M1', confidence: 0.8 }],
    curriculum_descriptors: [],
    per_child_signals: { Emma: { engagement_score: 0.8, complexity_level: 'developing', notable: null } },
    insight_suggestions: ['Nice counting.'],
    confidence: 0.85,
    quality_indicators: { description_richness: 'adequate', evidence_present: false, multi_subject: false },
    journey_observation: null,
    discrete_learning_objectives: [],
    work_sample: { flag: false, quality: 0.3, rationale: null },
  };
  const createMock = vi.fn(async () => ({
    id: 'msg_ctx', type: 'message', role: 'assistant',
    content: [{ type: 'text', text: JSON.stringify(FULL_ENRICHMENT) }],
    model: 'claude-haiku-4-5-20251001', stop_reason: 'end_turn',
    usage: { input_tokens: 10, output_tokens: 10 },
  }));
  return { createMock };
});

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic { messages = { create: createMock }; }
  return { default: MockAnthropic, Anthropic: MockAnthropic };
});

vi.mock('../dlo-cache', () => ({
  getValidDlos: vi.fn(async () => ({
    ids: new Set(['dlo.L3.emerging', 'dlo.L3.developing', 'dlo.L3.demonstrating', 'dlo.M1.emerging']),
    tierById: new Map([
      ['dlo.L3.emerging', 'emerging'], ['dlo.L3.developing', 'developing'], ['dlo.L3.demonstrating', 'demonstrating'],
      ['dlo.M1.emerging', 'emerging'],
    ]),
    descriptorById: new Map([
      ['dlo.L3.emerging', 'Points to pictures that match text.'],
      ['dlo.L3.developing', 'Predicts what happens next from clues.'],
      ['dlo.L3.demonstrating', 'Compares ideas across texts.'],
      ['dlo.M1.emerging', 'Counts with one-to-one correspondence.'],
    ]),
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('PEDAGOGY_KB_ENABLED', 'false');
});

function promptSentToHaiku(): string {
  const call = createMock.mock.calls[0] as unknown as [{ messages: Array<{ content: string }> }];
  return call[0].messages[0].content;
}

describe('INTEGRATION: enrichEntry context — snapshot-backed active threads', () => {
  it('lists the snapshot threads most-recent-first, then recent-save threads, and injects their descriptors', async () => {
    const family = await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const emma = await createLearner(db, { familyId: family.id, name: 'Emma' });
    const sibling = await createLearner(db, { familyId: family.id, name: 'Otto' });

    // Emma's full profile lives in the snapshot: M1 is high-volume but older,
    // L3 is thin but recent.
    await createSnapshot(db, {
      familyId: family.id,
      snapshotData: {
        children: {
          [emma.id]: {
            active_threads: [
              { thread_id: 'M1', thread_name: 'Number Sense', observation_count: 12, last_evidence_date: '2026-09-01', suggested_tier: 'developing' },
              { thread_id: 'L3', thread_name: 'Reading Comprehension', observation_count: 2, last_evidence_date: '2026-10-01', suggested_tier: 'emerging' },
            ],
          },
        },
      },
    });

    // Six recent entries all belong to the sibling — the old derivation would
    // have read Emma's profile as "none yet". The factory pins createdAt to a
    // fixed epoch, so give each row an explicit, increasing createdAt: the
    // recency window orders by it.
    const base = Date.parse('2026-10-01T00:00:00Z');
    for (let i = 0; i < 6; i++) {
      await createEntry(db, {
        familyId: family.id, learnerIds: [sibling.id], status: 'complete', createdAt: new Date(base + i * 60_000),
        title: `Otto ${i}`, aiEnrichment: { status: 'enriched', capability_threads: [{ thread_id: 'P1', confidence: 0.9 }] },
      });
    }
    // One recent Emma save the snapshot hasn't incorporated yet (fire-and-forget rebuild).
    await createEntry(db, {
      familyId: family.id, learnerIds: [emma.id], status: 'complete', createdAt: new Date(base + 10 * 60_000),
      title: 'Sketching leaves', aiEnrichment: { status: 'enriched', capability_threads: [{ thread_id: 'S5', confidence: 0.9 }] },
    });

    const entry = await createEntry(db, {
      familyId: family.id, learnerIds: [emma.id], status: 'complete', createdAt: new Date(base + 11 * 60_000),
      title: 'Counting shells', description: 'Emma sorted shells into piles of five and counted them.',
    });

    await enrichEntry({ entryId: entry.id, familyId: family.id });

    expect(createMock).toHaveBeenCalledTimes(1);
    const prompt = promptSentToHaiku();
    expect(prompt).toContain('Emma: L3, M1, S5');
    expect(prompt).toContain('CANDIDATE DLO DESCRIPTORS');
    expect(prompt).toContain('dlo.L3.developing: Predicts what happens next from clues.');
    expect(prompt).toContain('dlo.M1.emerging: Counts with one-to-one correspondence.');
  });

  it('falls back to recent-entry derivation when the family has no snapshot yet', async () => {
    const family = await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const emma = await createLearner(db, { familyId: family.id, name: 'Emma' });
    await createEntry(db, {
      familyId: family.id, learnerIds: [emma.id], status: 'complete',
      title: 'Story time', aiEnrichment: { status: 'enriched', capability_threads: [{ thread_id: 'L7', confidence: 0.9 }] },
    });
    const entry = await createEntry(db, {
      familyId: family.id, learnerIds: [emma.id], status: 'complete',
      title: 'Retelling', description: 'Emma retold the story of the three bears with voices.',
    });

    await enrichEntry({ entryId: entry.id, familyId: family.id });
    expect(promptSentToHaiku()).toContain('Emma: L7');
  });
});
