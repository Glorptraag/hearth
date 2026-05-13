import {
  THREAD_DOMAINS,
  THREAD_NAMES,
  THREAD_CONNECTIONS,
  getThreadDomain,
  type ThreadDomain,
} from '@/lib/capability-threads';
import { DLO_DESCRIPTORS, fallbackDescriptor } from './dlo-descriptors';

export type Tier = 'emerging' | 'developing' | 'demonstrating' | 'unobserved';
export type ThreadState = 'active' | 'ghost' | 'dormant';

export type ThreadNode = {
  id: string;
  name: string;
  domain: string;
  prereqs: string[];
  enables: string[];
  foundational: boolean;
};

export type DomainSpec = {
  key: string;
  short: string;
  label: string;
  color: string;
  threadCount: number;
};

/* The v5 spec orders domains left→right as foundational → synthesising.
   Map Hearth's 8 v2 domains to spec ordering, with short labels + colour token.
   These mirror the prototype's domains[] but keyed to the real domain keys. */
const DOMAIN_META: Record<string, { short: string; cssVar: string; order: number }> = {
  literacy:           { short: 'Lit',  cssVar: '--color-domain-english',      order: 0 },
  mathematics:        { short: 'Math', cssVar: '--color-domain-mathematics',  order: 1 },
  personal:           { short: 'Phys', cssVar: '--color-domain-hpe',          order: 2 },
  psychosocial:       { short: 'P&S',  cssVar: '--color-domain-languages',    order: 3 },
  science:            { short: 'Sci',  cssVar: '--color-domain-science',      order: 4 },
  humanities:         { short: 'Hum',  cssVar: '--color-domain-hass',         order: 5 },
  creative:           { short: 'Crv',  cssVar: '--color-domain-arts',         order: 6 },
  executiveFunction:  { short: 'Exec', cssVar: '--color-domain-technologies', order: 7 },
};

export const ORDERED_DOMAINS: DomainSpec[] = [...THREAD_DOMAINS]
  .map((d): DomainSpec => {
    const meta = DOMAIN_META[d.key] ?? { short: d.label.slice(0, 4), cssVar: '--color-domain-english', order: 99 };
    return {
      key: d.key,
      short: meta.short,
      label: d.label,
      color: `var(${meta.cssVar})`,
      threadCount: d.threadCount,
    };
  })
  .sort((a, b) => (DOMAIN_META[a.key]?.order ?? 99) - (DOMAIN_META[b.key]?.order ?? 99));

export function domainColor(domainKey: string): string {
  return `var(${DOMAIN_META[domainKey]?.cssVar ?? '--color-domain-english'})`;
}

/* Build a thread DAG from THREAD_NAMES + THREAD_CONNECTIONS.
   prereqs = sources pointing AT this thread. */
function buildThreads(): ThreadNode[] {
  const prereqMap: Record<string, string[]> = {};
  const enablesMap: Record<string, string[]> = {};
  THREAD_CONNECTIONS.forEach(([from, to]) => {
    (prereqMap[to] ||= []).push(from);
    (enablesMap[from] ||= []).push(to);
  });
  return Object.keys(THREAD_NAMES).map((id) => {
    const domain = getThreadDomain(id);
    const prereqs = prereqMap[id] ?? [];
    return {
      id,
      name: THREAD_NAMES[id],
      domain: domain?.key ?? 'literacy',
      prereqs,
      enables: enablesMap[id] ?? [],
      foundational: prereqs.length === 0,
    };
  });
}

export const ALL_THREADS: ThreadNode[] = buildThreads();
export const THREADS_BY_ID: Record<string, ThreadNode> = Object.fromEntries(
  ALL_THREADS.map((t) => [t.id, t]),
);

/* Topological column = longest path from a foundational source.
   Normalised so min = 0 within the given set. */
export function topoColumn(threads: ThreadNode[]): Record<string, number> {
  const ids = new Set(threads.map((t) => t.id));
  const cache: Record<string, number> = {};
  const visiting = new Set<string>();
  function depth(id: string): number {
    if (cache[id] != null) return cache[id];
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const t = THREADS_BY_ID[id];
    if (!t || t.foundational || t.prereqs.length === 0) {
      cache[id] = 0;
      visiting.delete(id);
      return 0;
    }
    const inSet = t.prereqs.filter((p) => ids.has(p));
    if (inSet.length === 0) { cache[id] = 0; visiting.delete(id); return 0; }
    const d = 1 + Math.max(0, ...inSet.map((p) => depth(p)));
    cache[id] = d;
    visiting.delete(id);
    return d;
  }
  threads.forEach((t) => depth(t.id));
  const min = Math.min(...threads.map((t) => cache[t.id]));
  const out: Record<string, number> = {};
  threads.forEach((t) => { out[t.id] = cache[t.id] - min; });
  return out;
}

/* Seeded LCG so starfields / jitter stay stable across re-renders. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s & 0x7fffffff) / 0x80000000; };
}

/* Derive ThreadState for every known thread given observation profile. */
export function deriveThreadStates(
  observedTier: Record<string, Tier>,
): Record<string, ThreadState> {
  const out: Record<string, ThreadState> = {};
  for (const t of ALL_THREADS) {
    const tier = observedTier[t.id] ?? 'unobserved';
    if (tier !== 'unobserved') {
      out[t.id] = 'active';
    } else {
      const prereqsActive = t.prereqs.length > 0 &&
        t.prereqs.every((p) => (observedTier[p] ?? 'unobserved') !== 'unobserved');
      out[t.id] = prereqsActive ? 'ghost' : 'dormant';
    }
  }
  return out;
}

export const TIER_GLYPH: Record<Tier, string> = {
  emerging: '○',
  developing: '◐',
  demonstrating: '●',
  unobserved: '·',
};

export const TIER_LABEL: Record<Tier, string> = {
  emerging: 'Emerging',
  developing: 'Developing',
  demonstrating: 'Demonstrating',
  unobserved: 'Not yet',
};

export type { ThreadDomain };

/* Snapshot consumed by TableView / GalleryView. Built from /api/capabilities/[learnerId]. */
export type LearnerSnapshot = {
  id: string;
  name: string;
  colourToken: string | null;
  tierByThread: Record<string, Tier>;
  observationsByThread: Record<string, number>;
  lastDateByThread: Record<string, string>;
  threadState: Record<string, ThreadState>;
  badges: Array<{ thread: string; level?: string | null; status?: 'approaching' | 'awarded' }>;
  dlosByThread: Record<string, { confirmed: number; total: number }>;
};

export type ActiveThreadRow = {
  thread_id: string;
  thread_name: string;
  observation_count: number;
  suggested_tier: string;
  last_evidence_date: string;
  current_badge_level: string | null;
  next_badge: string | null;
  next_badge_progress: number;
  dlos_confirmed: number;
  dlos_total: number;
};

export function buildSnapshot(
  learner: { id: string; name: string; colourToken: string | null },
  rows: ActiveThreadRow[],
): LearnerSnapshot {
  const tier: Record<string, Tier> = {};
  const obs: Record<string, number> = {};
  const last: Record<string, string> = {};
  const dlos: Record<string, { confirmed: number; total: number }> = {};
  const badges: LearnerSnapshot['badges'] = [];

  for (const r of rows) {
    const t = (r.suggested_tier as Tier) ?? 'unobserved';
    tier[r.thread_id] = t === 'emerging' || t === 'developing' || t === 'demonstrating' ? t : 'unobserved';
    obs[r.thread_id] = r.observation_count ?? 0;
    if (r.last_evidence_date) last[r.thread_id] = r.last_evidence_date;
    dlos[r.thread_id] = { confirmed: r.dlos_confirmed ?? 0, total: r.dlos_total ?? 3 };
    if (r.current_badge_level) {
      badges.push({ thread: r.thread_id, level: r.current_badge_level, status: 'awarded' });
    } else if (r.next_badge && (r.next_badge_progress ?? 0) >= 0.6) {
      badges.push({ thread: r.thread_id, status: 'approaching' });
    }
  }

  return {
    id: learner.id,
    name: learner.name,
    colourToken: learner.colourToken,
    tierByThread: tier,
    observationsByThread: obs,
    lastDateByThread: last,
    threadState: deriveThreadStates(tier),
    badges,
    dlosByThread: dlos,
  };
}

export function threadCurrentTier(threadId: string, snap: LearnerSnapshot): Tier {
  return snap.tierByThread[threadId] ?? 'unobserved';
}

/* Synthesised DLOs for Depth 3 — three tier DLOs per thread,
   with mechanical status from dlos_confirmed. */
export type SynthDLO = {
  id: string;
  thread: string;
  domain: string;
  tier: Exclude<Tier, 'unobserved'>;
  glyph: string;
  tierLabel: string;
  descriptor: string;
  badgeLevel: 'foundation' | 'practising' | 'mastery';
  status: 'confirmed' | 'emerging' | 'not-started';
};

const TIER_RANK: Record<Exclude<Tier, 'unobserved'>, number> = {
  emerging: 1,
  developing: 2,
  demonstrating: 3,
};

export function buildDLOs(threadId: string, snap: LearnerSnapshot): SynthDLO[] {
  const thread = THREADS_BY_ID[threadId];
  if (!thread) return [];
  const dloProgress = snap.dlosByThread[threadId] ?? { confirmed: 0, total: 3 };
  const confirmed = dloProgress.confirmed;
  const currentTier = snap.tierByThread[threadId] ?? 'unobserved';
  const tierOrder: Exclude<Tier, 'unobserved'>[] = ['emerging', 'developing', 'demonstrating'];
  const seeded = DLO_DESCRIPTORS[threadId];
  return tierOrder.map((t, idx): SynthDLO => {
    const rank = TIER_RANK[t];
    let status: SynthDLO['status'];
    if (rank <= confirmed) status = 'confirmed';
    else if (currentTier !== 'unobserved' && rank === confirmed + 1) status = 'emerging';
    else status = 'not-started';
    const descriptor = seeded?.[idx] ?? fallbackDescriptor(thread.name, TIER_LABEL[t]);
    return {
      id: `${threadId}.${t[0]}`,
      thread: threadId,
      domain: thread.domain,
      tier: t,
      glyph: TIER_GLYPH[t],
      tierLabel: TIER_LABEL[t],
      descriptor,
      badgeLevel: rank === 1 ? 'foundation' : rank === 2 ? 'practising' : 'mastery',
      status,
    };
  });
}

