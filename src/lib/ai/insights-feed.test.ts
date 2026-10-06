import { describe, it, expect } from 'vitest';
import { buildChildInsights, INSIGHT_FEED_CAP, type InsightFeedInput } from './insights-feed';
import type { MilestoneReason } from './milestone-detect';

const NAMES: Record<string, string> = { L1: 'Oral Communication', M6: 'Spatial Reasoning', H6: 'Cultural Understanding', S5: 'Scientific Observation' };

function base(overrides: Partial<InsightFeedInput> = {}): InsightFeedInput {
  return {
    childId: 'kid',
    childName: 'Emma Jones',
    entries: [],
    milestones: new Map(),
    badgeTitles: new Map(),
    firstEvidenceByThread: {},
    priorTierByThread: {},
    newTierByThread: {},
    priorInsights: [],
    threadName: (id) => NAMES[id] ?? id,
    isSuppressedThread: (id) => id === 'H6',
    today: '2026-10-06',
    ...overrides,
  };
}

describe('buildChildInsights', () => {
  it('surfaces journey observations and the child\'s own notable line, newest first', () => {
    const out = buildChildInsights(base({
      entries: [
        {
          id: 'e1', dateOccurred: '2026-10-01',
          aiEnrichment: {
            journey_observation: { text: 'She carried the pattern from the blocks into her drawing.', trigger: 'transfer' },
            per_child_signals: { emma: { engagement_score: 0.9, complexity_level: 'developing', notable: 'Explained her reasoning without being asked.' }, Otto: { engagement_score: 0.2, complexity_level: 'emerging', notable: 'Wandered off.' } },
          },
        },
        {
          id: 'e2', dateOccurred: '2026-10-04',
          aiEnrichment: { journey_observation: { text: 'Kept going after the tower fell twice.', trigger: 'independence' } },
        },
      ],
    }));
    expect(out.map((i) => i.id)).toEqual(['journey:e2', 'journey:e1', 'notable:e1']);
    expect(out[0]).toMatchObject({ kind: 'journey', trigger: 'independence', entry_id: 'e2', date: '2026-10-04' });
    // Name match is case-insensitive and never picks up a sibling's line.
    expect(out[2]).toMatchObject({ kind: 'notable', text: 'Explained her reasoning without being asked.' });
  });

  it('turns milestone reasons into warm, honest volume language and names badges', () => {
    const milestones = new Map<string, MilestoneReason[]>([
      ['e1', [{ kind: 'tier_advance', thread_id: 'M6', tier: 'developing' }, { kind: 'badge_ready', badge_id: 'b1' }]],
      ['e2', [{ kind: 'tier_advance', thread_id: 'H6', tier: 'demonstrating' }]],
    ]);
    const out = buildChildInsights(base({
      entries: [
        { id: 'e1', dateOccurred: '2026-10-02', aiEnrichment: null },
        { id: 'e2', dateOccurred: '2026-10-03', aiEnrichment: null },
      ],
      milestones,
      badgeTitles: new Map([['b1', 'Builder']]),
    }));
    const texts = out.map((i) => i.text);
    expect(texts).toContain('Emma now has four moments lighting Spatial Reasoning — a thread that is becoming a habit.');
    expect(texts).toContain('This moment tipped Emma over the line for the Builder badge.');
    // Alpha-suppressed thread never reaches the feed.
    expect(out.some((i) => i.thread_id === 'H6')).toBe(false);
  });

  it('announces newly lit threads only inside the recency window', () => {
    const out = buildChildInsights(base({
      firstEvidenceByThread: { L1: '2026-09-20', S5: '2026-06-01', H6: '2026-10-01' },
    }));
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'thread_lit:L1', date: '2026-09-20', thread_id: 'L1' });
    expect(out[0].text).toBe('A new thread lit up for Emma: Oral Communication.');
  });

  it('records tier rises (never falls) and carries prior rises forward for a window', () => {
    const out = buildChildInsights(base({
      priorTierByThread: { L1: 'emerging', M6: 'developing', S5: 'developing' },
      newTierByThread: { L1: 'developing', M6: 'emerging', S5: 'developing' },
      priorInsights: [
        { id: 'tier_shift:S5:developing', kind: 'tier_shift', text: 'old', date: '2026-09-20', thread_id: 'S5', tier: 'developing' },
        { id: 'tier_shift:M6:developing', kind: 'tier_shift', text: 'stale', date: '2026-07-01', thread_id: 'M6', tier: 'developing' },
        { id: 'journey:old', kind: 'journey', text: 'not carried', date: '2026-09-20' },
      ],
    }));
    expect(out.map((i) => i.id)).toEqual(['tier_shift:L1:developing', 'tier_shift:S5:developing']);
    expect(out[0]).toMatchObject({ date: '2026-10-06', tier: 'developing' });
    expect(out[0].text).toBe('Oral Communication has moved to developing for Emma.');
  });

  it('caps the feed and keeps the newest items', () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      id: `e${i}`,
      dateOccurred: `2026-09-${String(i + 1).padStart(2, '0')}`,
      aiEnrichment: { journey_observation: { text: `Observation number ${i} about Emma.`, trigger: 'cross_domain' } },
    }));
    const out = buildChildInsights(base({ entries }));
    expect(out).toHaveLength(INSIGHT_FEED_CAP);
    expect(out[0].entry_id).toBe('e19');
    expect(out[INSIGHT_FEED_CAP - 1].entry_id).toBe(`e${20 - INSIGHT_FEED_CAP}`);
  });
});
