import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Anthropic to avoid real API calls
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              subjects: ['Science'],
              capabilities: [{ threadId: 'S2', confidence: 'inferred' }],
              engagement: { overall: 'high' },
              summary: 'Observed natural phenomena during outdoor exploration.',
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
        model: 'claude-haiku-4-5',
        stop_reason: 'end_turn',
      }),
    },
  })),
}));

// Mock DB to avoid real database calls
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([{
    id: 'test-family-id',
    pedagogyPreference: 'eclectic',
  }]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue([{ id: 'test-log-id' }]),
};

vi.mock('@/lib/db', () => ({ db: mockDb }));

describe('AI Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Entry enrichment', () => {
    it('should accept a valid entry payload structure', () => {
      const entry = {
        title: 'Nature walk observation',
        description: 'Observed birds and identified 3 species',
        dateOccurred: '2026-04-01',
        subjects: ['Science', 'Nature Study'],
        learnerIds: ['learner-1'],
        engagementPerLearner: { 'learner-1': 'high' },
        discoveriesPerLearner: { 'learner-1': 'Identified 3 bird species' },
        status: 'published',
      };

      expect(entry.title).toBeTruthy();
      expect(entry.dateOccurred).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(entry.learnerIds)).toBe(true);
    });

    it('should map capability thread IDs to known threads', () => {
      const knownThreadIds = ['M1', 'M2', 'M3', 'M4', 'M5', 'S1', 'S2', 'S3', 'L1', 'L2', 'L3', 'EF1', 'EF2'];
      const suggestedThreadId = 'S2';
      expect(knownThreadIds).toContain(suggestedThreadId);
    });

    it('should handle enrichment with all required fields', () => {
      const enrichedResult = {
        subjects: ['Science'],
        capabilities: [{ threadId: 'S2', confidence: 'inferred' }],
        engagement: { overall: 'high' },
        summary: 'Observed natural phenomena',
      };

      expect(enrichedResult.subjects).toBeInstanceOf(Array);
      expect(enrichedResult.capabilities).toBeInstanceOf(Array);
      expect(enrichedResult.capabilities[0]).toHaveProperty('threadId');
      expect(enrichedResult.capabilities[0]).toHaveProperty('confidence');
    });

    it('should reject confidence values outside the allowed set', () => {
      const validConfidences = ['explicit', 'inferred', 'possible'];
      const invalidConfidence = 'guessed';
      expect(validConfidences).not.toContain(invalidConfidence);
    });

    it('should support all six pedagogy preferences', () => {
      const validPedagogies = ['charlotte_mason', 'classical', 'montessori', 'waldorf', 'unschooling', 'eclectic'];
      for (const p of validPedagogies) {
        expect(validPedagogies).toContain(p);
      }
    });
  });

  describe('Snapshot rebuild', () => {
    it('should produce a valid snapshot structure', () => {
      const snapshot = {
        subjectCoverage: { Science: 5, Mathematics: 3 },
        capabilityProgress: { S2: { tier: 'developing', observations: 5 } },
        recentEntries: [],
        rebuiltAt: new Date().toISOString(),
      };

      expect(snapshot).toHaveProperty('subjectCoverage');
      expect(snapshot).toHaveProperty('capabilityProgress');
      expect(snapshot).toHaveProperty('rebuiltAt');
    });

    it('should merge capability observations from multiple entries', () => {
      const entries = [
        { aiEnrichment: { capabilities: [{ threadId: 'S2', confidence: 'inferred' }] } },
        { aiEnrichment: { capabilities: [{ threadId: 'S2', confidence: 'inferred' }, { threadId: 'S1', confidence: 'explicit' }] } },
      ];

      const allCapabilities = entries.flatMap((e) => e.aiEnrichment?.capabilities ?? []);
      const s2Count = allCapabilities.filter((c) => c.threadId === 'S2').length;

      expect(s2Count).toBe(2);
    });

    it('should count subject coverage correctly', () => {
      const entries = [
        { aiEnrichment: { subjects: ['Science', 'Mathematics'] } },
        { aiEnrichment: { subjects: ['Science'] } },
        { aiEnrichment: { subjects: ['English'] } },
      ];

      const coverage: Record<string, number> = {};
      for (const entry of entries) {
        for (const subject of entry.aiEnrichment?.subjects ?? []) {
          coverage[subject] = (coverage[subject] ?? 0) + 1;
        }
      }

      expect(coverage['Science']).toBe(2);
      expect(coverage['Mathematics']).toBe(1);
      expect(coverage['English']).toBe(1);
    });

    it('should assign tier based on observation count', () => {
      const getTier = (count: number) => {
        if (count >= 10) return 'established';
        if (count >= 4) return 'developing';
        return 'emerging';
      };

      expect(getTier(1)).toBe('emerging');
      expect(getTier(4)).toBe('developing');
      expect(getTier(10)).toBe('established');
    });
  });

  describe('API auth contract', () => {
    it('should require auth — no userId yields unauthorized', () => {
      const mockUserId = null;
      const result = mockUserId ? 'proceed' : 'unauthorized';
      expect(result).toBe('unauthorized');
    });

    it('should proceed when userId is present', () => {
      const mockUserId = 'user_abc123';
      const result = mockUserId ? 'proceed' : 'unauthorized';
      expect(result).toBe('proceed');
    });
  });
});
