import { describe, it, expect } from 'vitest';
import {
  buildConstellationGraph,
  describeNode,
  domainNodeId,
  focusForNode,
  momentNodeId,
  neighbourhood,
  nodeIdForFocus,
  nodeRadius,
  objectiveNodeId,
  relationsOf,
  subgraph,
  telescopeHops,
  threadNodeId,
  withMoments,
  type GraphMoment,
} from './graph-model';
import {
  ALL_THREADS,
  ORDERED_DOMAINS,
  THREADS_BY_ID,
  buildSnapshot,
  type ActiveThreadRow,
  type SanityDLO,
} from './topology';

const row = (thread_id: string, suggested_tier: string, observation_count = 3): ActiveThreadRow => ({
  thread_id,
  thread_name: THREADS_BY_ID[thread_id]?.name ?? thread_id,
  observation_count,
  suggested_tier,
  last_evidence_date: '2026-06-01',
  current_badge_level: null,
  next_badge: null,
  next_badge_progress: 0,
});

const learner = { id: 'lrn1', name: 'Emma', colourToken: null };

function dlosFor(threadId: string): SanityDLO[] {
  return (['emerging', 'developing', 'demonstrating'] as const).map((tier) => ({
    _id: `dlo.${threadId}.${tier}`,
    threadRef: `capabilityThread.${threadId}`,
    tier,
    descriptor: `${threadId} ${tier} descriptor`,
  }));
}

describe('buildConstellationGraph', () => {
  it('has a node for every domain and visible thread, and none for the suppressed H6', () => {
    const g = buildConstellationGraph(buildSnapshot(learner, []), {});
    expect(g.nodes.filter((n) => n.kind === 'domain')).toHaveLength(ORDERED_DOMAINS.length);
    expect(g.nodes.filter((n) => n.kind === 'thread')).toHaveLength(ALL_THREADS.length);
    expect(g.byId[threadNodeId('H6')]).toBeUndefined();
  });

  it('links every thread to its domain and every catalog prerequisite to the thread it opens', () => {
    const g = buildConstellationGraph(buildSnapshot(learner, []), {});
    for (const t of ALL_THREADS) {
      expect(g.links.some((l) => l.kind === 'part-of' && l.source === threadNodeId(t.id) && l.target === domainNodeId(t.domain))).toBe(true);
    }
    // L1 → L3 (Oral Communication → Reading Comprehension) is in the catalog.
    expect(g.links.find((l) => l.id === 'L1>L3')?.kind).toBe('leads-to');
    // Reading Comprehension → Historical Understanding crosses domains.
    expect(g.links.find((l) => l.id === 'L3>H1')?.crossDomain).toBe(true);
  });

  it('keeps empty domains as unlit orphans (present but unlit)', () => {
    const g = buildConstellationGraph(buildSnapshot(learner, []), {});
    const theology = g.byId[domainNodeId('theologyScripture')];
    expect(theology.glow).toBe('unlit');
    expect(g.degree[theology.id]).toBe(0);
  });

  it('lights observed threads, opens threads whose prerequisites are lit, leaves the rest unlit', () => {
    const snap = buildSnapshot(learner, [row('L1', 'developing'), row('L4', 'emerging')]);
    const g = buildConstellationGraph(snap, {});
    expect(g.byId[threadNodeId('L1')].glow).toBe('lit');
    expect(g.byId[threadNodeId('L1')].tier).toBe('developing');
    // L3's prerequisites are L1 + L4 — both lit, so it is opening up.
    expect(g.byId[threadNodeId('L3')].glow).toBe('opening');
    expect(g.byId[threadNodeId('M1')].glow).toBe('unlit');
    expect(g.byId[domainNodeId('languageLiteracy')].glow).toBe('lit');
  });

  it('adds objectives as satellites chained in tier order, with the four learner states', () => {
    const snap = buildSnapshot(learner, [row('L1', 'developing')], {
      'dlo.L1.emerging': { status: 'demonstrating' },
      'dlo.L1.developing': { status: 'developing' },
    });
    const g = buildConstellationGraph(snap, { L1: dlosFor('L1') });
    const e = g.byId[objectiveNodeId('dlo.L1.emerging')];
    const d = g.byId[objectiveNodeId('dlo.L1.developing')];
    const m = g.byId[objectiveNodeId('dlo.L1.demonstrating')];
    expect(e.status).toBe('confirmed');
    expect(d.status).toBe('developing');
    // The first objective not yet reached at its own tier is next to watch for.
    expect(m.glow).toBe('opening');
    expect(g.links.find((l) => l.id === 'dlo.L1.emerging>dlo.L1.developing')?.kind).toBe('next');
    expect(g.links.some((l) => l.kind === 'part-of' && l.source === m.id && l.target === threadNodeId('L1'))).toBe(true);
  });

  it('honours optimistic parent confirmations over the snapshot flag', () => {
    const snap = buildSnapshot(learner, [], { 'dlo.L1.emerging': { status: 'not-started', asserted_by_parent: true } });
    const fromSnapshot = buildConstellationGraph(snap, { L1: dlosFor('L1') });
    expect(fromSnapshot.byId[objectiveNodeId('dlo.L1.emerging')].confirmed).toBe(true);
    expect(fromSnapshot.byId[objectiveNodeId('dlo.L1.emerging')].glow).toBe('lit');
    const cleared = buildConstellationGraph(snap, { L1: dlosFor('L1') }, { confirmedDloIds: new Set() });
    expect(cleared.byId[objectiveNodeId('dlo.L1.emerging')].confirmed).toBe(false);
  });

  it('can drop objectives and unlit nodes, keeping the ids it is told to keep', () => {
    const snap = buildSnapshot(learner, [row('L1', 'emerging')]);
    const g = buildConstellationGraph(snap, { L1: dlosFor('L1') }, {
      includeObjectives: false,
      includeUnlit: false,
      keep: [threadNodeId('M9')],
    });
    expect(g.nodes.some((n) => n.kind === 'objective')).toBe(false);
    expect(g.byId[threadNodeId('L1')]).toBeDefined();
    expect(g.byId[threadNodeId('M1')]).toBeUndefined();
    expect(g.byId[threadNodeId('M9')]).toBeDefined();
    // No link dangles off a filtered-out node.
    for (const l of g.links) {
      expect(g.byId[l.source]).toBeDefined();
      expect(g.byId[l.target]).toBeDefined();
    }
  });
});

describe('neighbourhood + subgraph (telescope)', () => {
  const g = buildConstellationGraph(buildSnapshot(learner, []), { L3: dlosFor('L3') });

  it('walks links in both directions and records hop distance', () => {
    const hops = neighbourhood(g, threadNodeId('L3'), 1);
    expect(hops.get(threadNodeId('L3'))).toBe(0);
    expect(hops.get(threadNodeId('L1'))).toBe(1); // builds on
    expect(hops.get(threadNodeId('L5'))).toBe(1); // leads to
    expect(hops.get(domainNodeId('languageLiteracy'))).toBe(1); // part of
    expect(hops.get(objectiveNodeId('dlo.L3.emerging'))).toBe(1);
    expect(hops.has(threadNodeId('L8'))).toBe(false); // two hops away (via L5)
    expect(neighbourhood(g, threadNodeId('L3'), 2).get(threadNodeId('L8'))).toBe(2);
  });

  it('returns nothing for an unknown root', () => {
    expect(neighbourhood(g, 'thread:ZZ9', 2).size).toBe(0);
  });

  it('a telescope keeps the apex thread’s own objectives and drops other threads’', () => {
    const withL1 = buildConstellationGraph(buildSnapshot(learner, []), { L1: dlosFor('L1'), L3: dlosFor('L3') });
    const hops = telescopeHops(withL1, threadNodeId('L3'), 2);
    expect(hops.has(objectiveNodeId('dlo.L3.emerging'))).toBe(true);
    // L1's objectives are two links out (via L1) but belong to another thread.
    expect(neighbourhood(withL1, threadNodeId('L3'), 2).has(objectiveNodeId('dlo.L1.emerging'))).toBe(true);
    expect(hops.has(objectiveNodeId('dlo.L1.emerging'))).toBe(false);
    expect(hops.get(threadNodeId('L1'))).toBe(1);
  });

  it('subgraph keeps only links between kept nodes', () => {
    const hops = neighbourhood(g, threadNodeId('L3'), 1);
    const sub = subgraph(g, hops.keys());
    expect(sub.nodes).toHaveLength(hops.size);
    for (const l of sub.links) {
      expect(hops.has(l.source) && hops.has(l.target)).toBe(true);
    }
  });
});

describe('focus mapping', () => {
  const g = buildConstellationGraph(buildSnapshot(learner, []), { L3: dlosFor('L3') });

  it('resolves the deepest node a focus names, falling back when the DLO is unknown', () => {
    expect(nodeIdForFocus({ domain: 'languageLiteracy', thread: 'L3', dlo: 'dlo.L3.emerging' }, g)).toBe(objectiveNodeId('dlo.L3.emerging'));
    // Legacy `L3.e` deep links name no real objective — land on the thread.
    expect(nodeIdForFocus({ domain: 'languageLiteracy', thread: 'L3', dlo: 'L3.e' }, g)).toBe(threadNodeId('L3'));
    expect(nodeIdForFocus({ domain: 'languageLiteracy', thread: null, dlo: null }, g)).toBe(domainNodeId('languageLiteracy'));
    expect(nodeIdForFocus({ domain: null, thread: null, dlo: null }, g)).toBeNull();
  });

  it('maps node kinds to drill depth 2 / 3 / 4', () => {
    expect(focusForNode(g.byId[domainNodeId('languageLiteracy')])?.depth).toBe(2);
    expect(focusForNode(g.byId[threadNodeId('L3')])).toEqual({ focus: { domain: 'languageLiteracy', thread: 'L3', dlo: null }, depth: 3 });
    expect(focusForNode(g.byId[objectiveNodeId('dlo.L3.developing')])).toEqual({
      focus: { domain: 'languageLiteracy', thread: 'L3', dlo: 'dlo.L3.developing' },
      depth: 4,
    });
  });
});

describe('relations (links + backlinks)', () => {
  const g = buildConstellationGraph(buildSnapshot(learner, []), { L3: dlosFor('L3') });

  it('groups a thread’s links in plain language', () => {
    const groups = Object.fromEntries(relationsOf(g, threadNodeId('L3')).map((r) => [r.label, r.nodes.map((n) => n.ref)]));
    expect(groups['Part of']).toEqual(['languageLiteracy']);
    expect(groups['Builds on']).toEqual(expect.arrayContaining(['L1', 'L4']));
    expect(groups['Leads to']).toEqual(expect.arrayContaining(['L5', 'L9', 'H1']));
    expect(groups['Objectives']).toHaveLength(3);
  });

  it('lists a domain’s threads', () => {
    const groups = relationsOf(g, domainNodeId('languageLiteracy'));
    expect(groups.find((r) => r.label === 'Threads')?.nodes).toHaveLength(7);
  });
});

describe('withMoments', () => {
  const g = buildConstellationGraph(buildSnapshot(learner, []), { L3: dlosFor('L3') });
  const moment: GraphMoment = {
    id: 'e1', entryId: 'e1', title: 'Read the bird book aloud', date: '2026-06-02',
    source: 'logger', tier: 'emerging', rationale: 'Retold the plot', provenance: 'inferred',
  };

  it('adds moments as evidence leaves of the objective', () => {
    const next = withMoments(g, objectiveNodeId('dlo.L3.emerging'), [moment]);
    const node = next.byId[momentNodeId('e1')];
    expect(node.kind).toBe('moment');
    expect(next.neighbours[node.id]).toEqual([objectiveNodeId('dlo.L3.emerging')]);
    expect(relationsOf(next, objectiveNodeId('dlo.L3.emerging')).find((r) => r.label === 'Moments')?.nodes).toHaveLength(1);
  });

  it('is a no-op for an unknown objective or no moments', () => {
    expect(withMoments(g, 'objective:nope', [moment])).toBe(g);
    expect(withMoments(g, objectiveNodeId('dlo.L3.emerging'), [])).toBe(g);
  });
});

describe('node presentation', () => {
  it('sizes a demonstrating thread above an unlit one and describes it accessibly', () => {
    const snap = buildSnapshot(learner, [row('L1', 'demonstrating', 9)]);
    const g = buildConstellationGraph(snap, {});
    const lit = g.byId[threadNodeId('L1')];
    const unlit = g.byId[threadNodeId('M1')];
    expect(nodeRadius(lit, g.degree[lit.id])).toBeGreaterThan(nodeRadius(unlit, g.degree[unlit.id]));
    expect(describeNode(lit, 3)).toBe('Oral Communication. Thread, Demonstrating, 3 links.');
  });
});
