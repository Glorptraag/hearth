/**
 * INTEGRATION: pedagogy attribution — the full enrich → persist → poll loop.
 *
 * The pedagogy retrieval/attribution path (buildPedagogyContextWithSources →
 * retrievePedagogyChunks → validated.pedagogy_sources → learningEntries.aiEnrichment)
 * was already built end-to-end but had no test pinning that the display
 * metadata a chunk carries (quote text, source attribution, trigger titles,
 * scenario previews) actually survives the round trip: real DB insert of a
 * pedagogy_knowledge_chunks row → enrichEntry() → the persisted aiEnrichment
 * column → the GET /api/entries/[id] poll response a client reads after save.
 *
 * This test seeds three chunks (one per display-relevant layer), runs
 * enrichEntry against a real Postgres, and asserts the metadata a UI
 * attribution card would render is present at both ends of the pipe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { learningEntries, familySettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { insertPedagogyChunk, unitVector } from '@/test/pkb-factories';
import { asUser } from '@/test/clerk-helpers';
import { enrichEntry } from '../enrich';
import { GET } from '@/app/api/entries/[id]/route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../vitest.setup';

// ─── Fixtures (vi.hoisted so vi.mock factories below can reference them —
// vi.mock calls are hoisted above regular top-level statements). ───
const { FULL_ENRICHMENT } = vi.hoisted(() => {
  const FULL_ENRICHMENT = {
    subjects_detected: ['science'],
    capability_threads: [{ thread_id: 'S1', confidence: 0.8 }],
    curriculum_descriptors: [],
    per_child_signals: {
      TestChild: { engagement_score: 0.8, complexity_level: 'developing', notable: null },
    },
    insight_suggestions: ['Great curiosity about the world under that log.'],
    confidence: 0.85,
    quality_indicators: {
      description_richness: 'adequate',
      evidence_present: false,
      multi_subject: false,
    },
    journey_observation: null,
    discrete_learning_objectives: [],
    work_sample: { flag: false, quality: 0.4, rationale: 'Clear but thin observation.' },
  };
  return { FULL_ENRICHMENT };
});

// An in-file mock supersedes the setup-level canned Anthropic response
// (vitest.setup.ts), which is not a complete EnrichmentResult shape and
// would fail validateEnrichment's implicit expectations for this pipeline.
//
// enrich.ts does `new Anthropic()` — the mock constructor must be a real
// `class`/`function`, not `vi.fn(() => ({...}))` (an arrow-function
// implementation), which Vitest 4 cannot invoke with `new`.
vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = {
      create: vi.fn(async () => ({
        id: 'msg_test_pedagogy',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: JSON.stringify(FULL_ENRICHMENT) }],
        model: 'claude-haiku-4-5-20251001',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 50 },
      })),
    };
  }
  return { default: MockAnthropic, Anthropic: MockAnthropic };
});

// Deterministic embedding — every query and every seeded chunk resolves to
// the same fixed unit vector, so retrieval always matches on real cosine
// similarity (1.0) rather than depending on Voyage AI. EMBEDDING_DIMENSIONS
// is preserved from the real module via importOriginal.
vi.mock('@/lib/pedagogy/embedding', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/pedagogy/embedding')>();
  const fixed = new Array(actual.EMBEDDING_DIMENSIONS).fill(0);
  fixed[0] = 1;
  return {
    ...actual,
    embedText: vi.fn(async () => fixed),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('PEDAGOGY_KB_ENABLED', 'true');
});

describe('INTEGRATION: pedagogy attribution pipeline', () => {
  it('carries chunk display metadata through enrich → persist → the GET poll route', async () => {
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await db.insert(familySettings).values({
      familyId: TEST_FAMILY_ID,
      pedagogyPreference: 'charlotte_mason',
    });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'TestChild' });
    const entry = await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      title: 'Morning nature walk',
      description: 'Turned over a fallen log and found woodlice, then sketched what we found.',
    });

    const embedding = unitVector({ 0: 1 });
    await insertPedagogyChunk(db, {
      id: 'cm-se-001',
      pedagogyKey: 'charlotte_mason',
      layer: 'source_excerpt',
      embedding,
      metadata: {
        text: 'Education is an atmosphere, a discipline, a life.',
        sourceAttribution: 'Mason, Home Education',
      },
    });
    await insertPedagogyChunk(db, {
      id: 'cm-pp-001',
      pedagogyKey: 'charlotte_mason',
      layer: 'practice_pattern',
      embedding,
      metadata: { triggerTitle: 'Child narrates unprompted after time outdoors' },
    });
    await insertPedagogyChunk(db, {
      id: 'cm-we-001',
      pedagogyKey: 'charlotte_mason',
      layer: 'worked_example',
      embedding,
      metadata: { scenarioPreview: 'A child brings home a woodlouse and wants to know everything about it.' },
    });

    // ─── Act: run the real enrichment pipeline against the real DB ───
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });

    // ─── Assert PERSIST: pedagogy_sources landed on the row with display metadata ───
    const row = await db.query.learningEntries.findFirst({
      where: eq(learningEntries.id, entry.id),
    });
    const enrichment = row?.aiEnrichment as
      | {
          pedagogy_sources?: Array<{
            id: string;
            layer: string;
            pedagogyKey: string;
            metadata: Record<string, unknown>;
          }>;
        }
      | null
      | undefined;

    expect(enrichment?.pedagogy_sources).toBeDefined();
    expect(enrichment!.pedagogy_sources!.length).toBeGreaterThan(0);
    for (const source of enrichment!.pedagogy_sources!) {
      expect(source.id).toBeTruthy();
      expect(source.layer).toBeTruthy();
      expect(source.pedagogyKey).toBe('charlotte_mason');
    }

    const byLayer = Object.fromEntries(
      enrichment!.pedagogy_sources!.map((s) => [s.layer, s])
    );
    expect(byLayer.source_excerpt?.metadata.text).toBe(
      'Education is an atmosphere, a discipline, a life.'
    );
    expect(byLayer.source_excerpt?.metadata.sourceAttribution).toBe('Mason, Home Education');
    expect(byLayer.practice_pattern?.metadata.triggerTitle).toBe(
      'Child narrates unprompted after time outdoors'
    );
    expect(byLayer.worked_example?.metadata.scenarioPreview).toContain('woodlouse');

    // ─── Assert POLL: the client-facing GET route surfaces the same sources ───
    asUser({ userId: TEST_USER_ID, familyId: TEST_FAMILY_ID });
    const res = await GET(new NextRequest(`http://x/api/entries/${entry.id}`), {
      params: Promise.resolve({ id: entry.id }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      aiEnrichment?: { pedagogy_sources?: Array<{ id: string; layer: string; metadata: Record<string, unknown> }> };
    };
    expect(body.aiEnrichment?.pedagogy_sources).toEqual(enrichment!.pedagogy_sources);
  });
});
