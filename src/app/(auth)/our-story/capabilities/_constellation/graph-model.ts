/* Constellation graph model — the linked-note view of a child's capability
   universe, after Obsidian's graph view. Every domain, thread and learning
   objective is a node; every relation the catalog already knows is a link
   (thread → its domain, prerequisite → the thread it opens, objective → its
   thread, objective → the next one). Telescoping onto an objective adds the
   moments that evidence it as leaf nodes. Pure: no React, no DOM. */

import {
  ALL_THREADS,
  DLO_STATUS_LABEL,
  ORDERED_DOMAINS,
  THREADS_BY_ID,
  TIER_LABEL,
  buildDLOs,
  domainColor,
  isNewlyLit,
  isRecentlyActive,
  nextDloToWatch,
  threadCurrentTier,
  type DloRenderStatus,
  type LearnerSnapshot,
  type SanityDLO,
  type Tier,
} from './topology';

export type GraphNodeKind = 'domain' | 'thread' | 'objective' | 'moment';

/** lit = observed; opening = prerequisites lined up / next to watch; unlit = not yet. */
export type NodeGlow = 'lit' | 'opening' | 'unlit';

export type MomentSource = 'logger' | 'module' | 'parent';

export type GraphMoment = {
  id: string;
  entryId: string | null;
  title: string;
  date: string;
  source: MomentSource;
  tier: Exclude<Tier, 'unobserved'> | null;
  rationale: string | null;
  provenance: string | null;
  /** True when the moment is a thread-level match, not DLO-level evidence. */
  threadLevel?: boolean;
};

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  /** Underlying id: domain key, thread id, Sanity DLO `_id`, or moment id. */
  ref: string;
  label: string;
  /** Domain key — the colour group, as Obsidian colours by group. */
  domain: string;
  color: string;
  glow: NodeGlow;
  /** Thread: current tier. Objective: its authored tier band. */
  tier: Tier | null;
  /** Objective only: the learner's status against it. */
  status: DloRenderStatus | null;
  /** Objective only: the parent has confirmed it. */
  confirmed: boolean;
  observations: number;
  badge: 'awarded' | 'approaching' | null;
  newlyLit: boolean;
  recent: boolean;
  /** Owning thread for thread / objective / moment nodes. */
  thread: string | null;
  /** Foundational thread (no prerequisites in the catalog). */
  foundational: boolean;
  moment: GraphMoment | null;
};

/** Direction reads source → target. */
export type GraphLinkKind = 'part-of' | 'leads-to' | 'next' | 'evidence';

export type GraphLink = {
  id: string;
  source: string;
  target: string;
  kind: GraphLinkKind;
  crossDomain: boolean;
};

export type ConstellationGraph = {
  nodes: GraphNode[];
  links: GraphLink[];
  byId: Record<string, GraphNode>;
  /** Undirected neighbour ids per node, for highlight + traversal. */
  neighbours: Record<string, string[]>;
  degree: Record<string, number>;
};

export const domainNodeId = (key: string) => `domain:${key}`;
export const threadNodeId = (id: string) => `thread:${id}`;
export const objectiveNodeId = (dloId: string) => `objective:${dloId}`;
export const momentNodeId = (id: string) => `moment:${id}`;

export type GraphOptions = {
  /** Show learning objectives as satellite nodes of their thread. */
  includeObjectives?: boolean;
  /** Show nodes with no evidence yet ("not yet"). Opening-up nodes always show. */
  includeUnlit?: boolean;
  /** Ids that survive filtering regardless (the telescope apex, the selection). */
  keep?: Iterable<string>;
  /** Parent-confirmed DLO ids, including optimistic confirmations. */
  confirmedDloIds?: ReadonlySet<string>;
};

function baseNode(partial: Partial<GraphNode> & Pick<GraphNode, 'id' | 'kind' | 'ref' | 'label' | 'domain'>): GraphNode {
  return {
    color: domainColor(partial.domain),
    glow: 'unlit',
    tier: null,
    status: null,
    confirmed: false,
    observations: 0,
    badge: null,
    newlyLit: false,
    recent: false,
    thread: null,
    foundational: false,
    moment: null,
    ...partial,
  };
}

function index(nodes: GraphNode[], links: GraphLink[]): ConstellationGraph {
  const byId: Record<string, GraphNode> = {};
  for (const n of nodes) byId[n.id] = n;
  const kept = links.filter((l) => byId[l.source] && byId[l.target]);
  const neighbours: Record<string, string[]> = {};
  for (const n of nodes) neighbours[n.id] = [];
  for (const l of kept) {
    neighbours[l.source].push(l.target);
    neighbours[l.target].push(l.source);
  }
  const degree: Record<string, number> = {};
  for (const n of nodes) degree[n.id] = neighbours[n.id].length;
  return { nodes, links: kept, byId, neighbours, degree };
}

/**
 * Build the whole constellation for one learner. Domains with no visible
 * threads (Classical Languages, Theology) stay in as unlit orphans — present
 * but unlit, per the v2 spec — the same way Obsidian keeps orphan notes.
 */
export function buildConstellationGraph(
  snap: LearnerSnapshot,
  dlosByThread: Record<string, SanityDLO[]> = {},
  options: GraphOptions = {},
): ConstellationGraph {
  const { includeObjectives = true, includeUnlit = true, confirmedDloIds } = options;
  const keep = new Set(options.keep ?? []);
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const badgeByThread: Record<string, 'awarded' | 'approaching'> = {};
  for (const b of snap.badges) {
    if (b.status === 'awarded') badgeByThread[b.thread] = 'awarded';
    else if (b.status === 'approaching' && !badgeByThread[b.thread]) badgeByThread[b.thread] = 'approaching';
  }

  for (const d of ORDERED_DOMAINS) {
    const threads = ALL_THREADS.filter((t) => t.domain === d.key);
    const lit = threads.filter((t) => snap.threadState[t.id] === 'active');
    const opening = threads.some((t) => snap.threadState[t.id] === 'ghost');
    nodes.push(baseNode({
      id: domainNodeId(d.key),
      kind: 'domain',
      ref: d.key,
      label: d.label,
      domain: d.key,
      glow: lit.length > 0 ? 'lit' : opening ? 'opening' : 'unlit',
      observations: lit.reduce((n, t) => n + (snap.observationsByThread[t.id] ?? 0), 0),
    }));
  }

  for (const t of ALL_THREADS) {
    const state = snap.threadState[t.id];
    const tier = threadCurrentTier(t.id, snap);
    nodes.push(baseNode({
      id: threadNodeId(t.id),
      kind: 'thread',
      ref: t.id,
      label: t.name,
      domain: t.domain,
      glow: state === 'active' ? 'lit' : state === 'ghost' ? 'opening' : 'unlit',
      tier,
      observations: snap.observationsByThread[t.id] ?? 0,
      badge: badgeByThread[t.id] ?? null,
      newlyLit: isNewlyLit(snap, t.id),
      recent: isRecentlyActive(snap, t.id),
      thread: t.id,
      foundational: t.foundational,
    }));
    links.push({
      id: `${t.id}~${t.domain}`,
      source: threadNodeId(t.id),
      target: domainNodeId(t.domain),
      kind: 'part-of',
      crossDomain: false,
    });
    for (const next of t.enables) {
      const target = THREADS_BY_ID[next];
      if (!target) continue;
      links.push({
        id: `${t.id}>${next}`,
        source: threadNodeId(t.id),
        target: threadNodeId(next),
        kind: 'leads-to',
        crossDomain: target.domain !== t.domain,
      });
    }

    if (!includeObjectives) continue;
    const dlos = buildDLOs(t.id, snap, dlosByThread);
    const threadLit = state === 'active';
    const watch = threadLit ? nextDloToWatch(dlos) : null;
    dlos.forEach((dlo, i) => {
      const confirmed = confirmedDloIds?.has(dlo.id) ?? !!snap.dloStatusById[dlo.id]?.asserted_by_parent;
      const reached = dlo.status !== 'not-started' || confirmed;
      nodes.push(baseNode({
        id: objectiveNodeId(dlo.id),
        kind: 'objective',
        ref: dlo.id,
        label: dlo.descriptor,
        domain: t.domain,
        glow: reached ? 'lit' : watch?.id === dlo.id ? 'opening' : 'unlit',
        tier: dlo.tier,
        status: dlo.status,
        confirmed,
        thread: t.id,
      }));
      links.push({
        id: `${dlo.id}~${t.id}`,
        source: objectiveNodeId(dlo.id),
        target: threadNodeId(t.id),
        kind: 'part-of',
        crossDomain: false,
      });
      const following = dlos[i + 1];
      if (following) {
        links.push({
          id: `${dlo.id}>${following.id}`,
          source: objectiveNodeId(dlo.id),
          target: objectiveNodeId(following.id),
          kind: 'next',
          crossDomain: false,
        });
      }
    });
  }

  const visible = includeUnlit
    ? nodes
    : nodes.filter((n) => n.glow !== 'unlit' || keep.has(n.id));
  return index(visible, links);
}

/** Add moment leaves evidencing one objective (telescope at depth 4). */
export function withMoments(
  graph: ConstellationGraph,
  objectiveId: string,
  moments: GraphMoment[],
): ConstellationGraph {
  const objective = graph.byId[objectiveId];
  if (!objective || moments.length === 0) return graph;
  const nodes = [...graph.nodes];
  const links = [...graph.links];
  for (const m of moments) {
    const id = momentNodeId(m.id);
    if (graph.byId[id]) continue;
    nodes.push(baseNode({
      id,
      kind: 'moment',
      ref: m.id,
      label: m.title,
      domain: objective.domain,
      glow: 'lit',
      tier: m.tier,
      thread: objective.thread,
      moment: m,
    }));
    links.push({ id: `${m.id}>${objective.ref}`, source: id, target: objectiveId, kind: 'evidence', crossDomain: false });
  }
  return index(nodes, links);
}

/**
 * Hop distance from `rootId` to every node within `maxHops`, walking links in
 * either direction (Obsidian's local graph depth). The root is hop 0.
 */
export function neighbourhood(
  graph: ConstellationGraph,
  rootId: string,
  maxHops: number,
): Map<string, number> {
  const hops = new Map<string, number>();
  if (!graph.byId[rootId]) return hops;
  hops.set(rootId, 0);
  let frontier = [rootId];
  for (let h = 1; h <= maxHops && frontier.length > 0; h++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const n of graph.neighbours[id] ?? []) {
        if (hops.has(n)) continue;
        hops.set(n, h);
        next.push(n);
      }
    }
    frontier = next;
  }
  return hops;
}

/**
 * What a telescope shows from `apexId`: everything within `reach` links,
 * except other threads' learning objectives. Those satellites would double
 * the cone with text that belongs to a different thread; telescoping onto
 * that thread shows them. Moments only ever hang off the apex objective.
 */
export function telescopeHops(
  graph: ConstellationGraph,
  apexId: string,
  reach: number,
): Map<string, number> {
  const apex = graph.byId[apexId];
  const hops = neighbourhood(graph, apexId, reach);
  if (!apex) return hops;
  for (const id of [...hops.keys()]) {
    const n = graph.byId[id];
    if (n.kind === 'objective' && n.thread !== apex.thread) hops.delete(id);
  }
  return hops;
}

/** The sub-graph a telescope shows: only nodes within reach, links between them. */
export function subgraph(graph: ConstellationGraph, ids: Iterable<string>): ConstellationGraph {
  const keep = new Set(ids);
  return index(
    graph.nodes.filter((n) => keep.has(n.id)),
    graph.links.filter((l) => keep.has(l.source) && keep.has(l.target)),
  );
}

export type Focus = { domain: string | null; thread: string | null; dlo: string | null };

/** The deepest node a drill focus names, falling back to shallower ones. */
export function nodeIdForFocus(focus: Focus, graph: ConstellationGraph): string | null {
  if (focus.dlo && graph.byId[objectiveNodeId(focus.dlo)]) return objectiveNodeId(focus.dlo);
  if (focus.thread && graph.byId[threadNodeId(focus.thread)]) return threadNodeId(focus.thread);
  if (focus.domain && graph.byId[domainNodeId(focus.domain)]) return domainNodeId(focus.domain);
  return null;
}

/** The drill focus + depth a node telescopes to (domain → 2, thread → 3, objective → 4). */
export function focusForNode(node: GraphNode): { focus: Focus; depth: 2 | 3 | 4 } | null {
  if (node.kind === 'domain') return { focus: { domain: node.ref, thread: null, dlo: null }, depth: 2 };
  if (node.kind === 'thread') return { focus: { domain: node.domain, thread: node.ref, dlo: null }, depth: 3 };
  if (node.kind === 'objective') return { focus: { domain: node.domain, thread: node.thread, dlo: node.ref }, depth: 4 };
  return null;
}

export type Relation = { label: string; nodes: GraphNode[] };

/**
 * A node's links grouped in plain language — the panel's equivalent of
 * Obsidian's outgoing links + backlinks. Empty groups are dropped.
 */
export function relationsOf(graph: ConstellationGraph, id: string): Relation[] {
  const node = graph.byId[id];
  if (!node) return [];
  const groups: Record<string, GraphNode[]> = {};
  const add = (label: string, other: string) => {
    const n = graph.byId[other];
    if (n) (groups[label] ||= []).push(n);
  };
  for (const l of graph.links) {
    if (l.source !== id && l.target !== id) continue;
    const outgoing = l.source === id;
    const other = outgoing ? l.target : l.source;
    switch (l.kind) {
      case 'part-of':
        add(outgoing ? 'Part of' : node.kind === 'domain' ? 'Threads' : 'Objectives', other);
        break;
      case 'leads-to':
        add(outgoing ? 'Leads to' : 'Builds on', other);
        break;
      case 'next':
        add(outgoing ? 'Next objective' : 'Previous objective', other);
        break;
      case 'evidence':
        add(outgoing ? 'Evidence for' : 'Moments', other);
        break;
    }
  }
  const order = ['Part of', 'Builds on', 'Leads to', 'Threads', 'Objectives', 'Previous objective', 'Next objective', 'Moments', 'Evidence for'];
  return order
    .filter((label) => groups[label]?.length)
    .map((label) => ({ label, nodes: groups[label] }));
}

const KIND_LABEL: Record<GraphNodeKind, string> = {
  domain: 'Domain',
  thread: 'Thread',
  objective: 'Learning objective',
  moment: 'Moment',
};

export function kindLabel(kind: GraphNodeKind): string {
  return KIND_LABEL[kind];
}

/** One plain-language line of a node's state, for labels and the panel. */
export function stateLine(node: GraphNode): string {
  switch (node.kind) {
    case 'domain':
      return node.glow === 'lit' ? 'Lit' : node.glow === 'opening' ? 'Opening up' : 'Not yet';
    case 'thread':
      if (node.glow === 'opening') return 'Opening up';
      return node.tier ? TIER_LABEL[node.tier] : TIER_LABEL.unobserved;
    case 'objective': {
      const status = node.status ? DLO_STATUS_LABEL[node.status] : DLO_STATUS_LABEL['not-started'];
      // A fresh confirmation can land before the rebuild lifts the status.
      if (node.confirmed) return node.status === 'not-started' || !node.status ? 'You confirmed' : `${status} · you confirmed`;
      if (node.glow === 'opening') return 'Next to watch for';
      return status;
    }
    case 'moment':
      return node.moment?.date ?? '';
  }
}

/** Accessible name for a node: label, kind, state and how linked it is. */
export function describeNode(node: GraphNode, degree: number): string {
  const links = `${degree} ${degree === 1 ? 'link' : 'links'}`;
  return `${node.label}. ${KIND_LABEL[node.kind]}, ${stateLine(node)}, ${links}.`;
}

/**
 * World-space radius. Obsidian sizes a note by how linked it is; here
 * evidence leads (a demonstrating thread outshines an unlit one) and links
 * add a little, so a hub thread still reads as a hub.
 */
export function nodeRadius(node: GraphNode, degree: number): number {
  const linkBoost = Math.min(2.4, Math.sqrt(degree) * 0.55);
  switch (node.kind) {
    case 'domain':
      return 8 + linkBoost * 1.6;
    case 'thread': {
      const tierBoost =
        node.glow !== 'lit' ? 0
          : node.tier === 'demonstrating' ? 3.2
            : node.tier === 'developing' ? 2
              : 1;
      return 3.6 + tierBoost + Math.min(2, Math.sqrt(node.observations) * 0.4) + linkBoost * 0.5;
    }
    case 'objective':
      return node.status === 'confirmed' ? 3.6 : node.status === 'developing' ? 3.2 : node.glow === 'lit' ? 2.9 : 2.4;
    case 'moment':
      return 3.2;
  }
}
