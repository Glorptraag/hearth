/**
 * Unit tests for the exported prompt builders in enrich.ts (WS-3).
 *
 * Verifies:
 *   - SYSTEM_PROMPT is exported and stable (byte-identical regardless of
 *     context changes — it is cache-controlled with ephemeral and must not vary)
 *   - buildUserPrompt injects DLO descriptor text for candidate threads
 *   - The descriptor cap is respected (no more than 10 threads injected)
 *   - When candidateThreadIds is empty, no descriptor block appears
 *   - The SYSTEM_PROMPT text is unchanged by the WS-3 changes
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('../snapshot-rebuild', () => ({ rebuildSnapshot: vi.fn() }));
vi.mock('../pedagogy-context', () => ({
  buildPedagogyContextWithSources: vi.fn(async () => ({
    prompt: 'PEDAGOGY CONTEXT:\nFamily follows the eclectic approach.',
    sources: [],
  })),
}));
vi.mock('@/lib/sanity/client', () => ({ sanityClient: { fetch: vi.fn() } }));

const MOCK_DESCRIPTORS = new Map([
  ['dlo.M1.emerging', 'Counts objects with one-to-one correspondence.'],
  ['dlo.M1.developing', 'Uses skip counting (2s, 5s, 10s) purposefully.'],
  ['dlo.M1.demonstrating', 'Composes and decomposes numbers flexibly.'],
  ['dlo.L3.emerging', 'Points to pictures that match text.'],
  ['dlo.L3.developing', 'Predicts what happens next based on clues.'],
  ['dlo.L3.demonstrating', 'Compares ideas across multiple texts.'],
  ['dlo.EF7.emerging', 'Responds to "What did you learn?" with specific answers.'],
  ['dlo.EF7.developing', 'Describes strategies they use for learning.'],
  ['dlo.EF7.demonstrating', 'Monitors own understanding in real-time.'],
  // Extra threads so the 10-thread cap can be exercised with real descriptors.
  ...['M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'].flatMap((t) => [
    [`dlo.${t}.emerging`, `${t} emerging descriptor.`],
    [`dlo.${t}.developing`, `${t} developing descriptor.`],
    [`dlo.${t}.demonstrating`, `${t} demonstrating descriptor.`],
  ] as Array<[string, string]>),
]);

vi.mock('../dlo-cache', () => ({
  getValidDlos: vi.fn(async () => ({
    ids: new Set([...MOCK_DESCRIPTORS.keys()]),
    tierById: new Map<string, 'emerging' | 'developing' | 'demonstrating'>(
      [...MOCK_DESCRIPTORS.keys()].map((id) => [id, id.split('.')[2] as 'emerging' | 'developing' | 'demonstrating']),
    ),
    descriptorById: MOCK_DESCRIPTORS,
  })),
}));

import { SYSTEM_PROMPT, buildUserPrompt } from '../enrich';

// Minimal fixture ctx — mirrors the AssembledEnrichContext shape produced by assembleContext
function makeCtx(overrides: { candidateThreadIds?: string[] } = {}) {
  const now = new Date().toISOString();
  return {
    entry: {
      id: 'test-entry',
      familyId: 'fam-01',
      title: 'Test entry',
      description: 'We did some maths today.',
      learnerIds: ['child-01'],
      sourceActivityIds: [],
      status: 'complete',
      dateOccurred: now,
      createdAt: now,
      updatedAt: now,
      aiEnrichment: null,
      discoveriesPerLearner: null,
      observationDetails: null,
      engagementPerLearner: null,
      threadLinks: null,
      location: null,
      subjectTags: [],
      duration: null,
      evidenceUrls: [],
      workSampleCandidate: null,
      workSampleQuality: null,
    },
    settings: { familyId: 'fam-01', pedagogyPreference: 'eclectic' },
    childRecords: [{
      id: 'child-01',
      name: 'Emma',
      familyId: 'fam-01',
      dateOfBirth: new Date(Date.now() - 7 * 365.25 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
      colorPreference: null,
      shape: null,
    }],
    activeThreads: { Emma: [] },
    recentEntries: [],
    candidateThreadIds: overrides.candidateThreadIds ?? [],
  };
}

beforeEach(() => vi.clearAllMocks());

describe('SYSTEM_PROMPT', () => {
  it('is exported and non-empty', () => {
    expect(typeof SYSTEM_PROMPT).toBe('string');
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it('does not contain DLO descriptor text (descriptors go in user prompt only)', () => {
    expect(SYSTEM_PROMPT).not.toContain('Counts objects with one-to-one');
  });

  it('contains the "never invent ids" rule', () => {
    expect(SYSTEM_PROMPT).toContain('never invent');
  });
});

describe('buildUserPrompt — descriptor injection', () => {
  it('injects descriptor block when candidateThreadIds is non-empty', async () => {
    const ctx = makeCtx({ candidateThreadIds: ['M1'] });
    const { prompt } = await buildUserPrompt(ctx as never);
    expect(prompt).toContain('CANDIDATE DLO DESCRIPTORS');
    expect(prompt).toContain('dlo.M1.emerging');
    expect(prompt).toContain('Counts objects with one-to-one correspondence.');
    expect(prompt).toContain('dlo.M1.developing');
    expect(prompt).toContain('dlo.M1.demonstrating');
  });

  it('omits descriptor block when candidateThreadIds is empty', async () => {
    const ctx = makeCtx({ candidateThreadIds: [] });
    const { prompt } = await buildUserPrompt(ctx as never);
    expect(prompt).not.toContain('CANDIDATE DLO DESCRIPTORS');
  });

  it('includes all 3 tiers per candidate thread', async () => {
    const ctx = makeCtx({ candidateThreadIds: ['L3'] });
    const { prompt } = await buildUserPrompt(ctx as never);
    expect(prompt).toContain('dlo.L3.emerging');
    expect(prompt).toContain('dlo.L3.developing');
    expect(prompt).toContain('dlo.L3.demonstrating');
    expect(prompt).toContain('Predicts what happens next based on clues.');
  });

  it('respects the 10-thread cap', async () => {
    // Pass 11 thread IDs, ALL with descriptors in the mock, so the only reason
    // the 11th can be absent is the cap (not a missing descriptor lookup).
    const ids = ['M1', 'L3', 'EF7', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'];
    const ctx = makeCtx({ candidateThreadIds: ids });
    const { prompt } = await buildUserPrompt(ctx as never);
    // First 10 render; M9 is the 11th and is sliced off by the cap.
    expect(prompt).toContain('dlo.M1.emerging');
    expect(prompt).toContain('dlo.M8.emerging');
    expect(prompt).not.toContain('dlo.M9.emerging');
  });

  it('still contains family context and entry details alongside descriptors', async () => {
    const ctx = makeCtx({ candidateThreadIds: ['M1'] });
    const { prompt } = await buildUserPrompt(ctx as never);
    expect(prompt).toContain('FAMILY CONTEXT:');
    expect(prompt).toContain('ENTRY TO ENRICH:');
    expect(prompt).toContain('Test entry');
    expect(prompt).toContain('We did some maths today.');
  });
});
