import {
  THREAD_NAMES,
  THREAD_CONNECTIONS,
  type ThreadDomain,
} from '@/lib/capability-threads';
import {
  V2_DOMAINS,
  V2_DOMAINS_BY_KEY,
  getV2DomainKey,
} from '@/lib/capability-universe-v2';
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

/* v2 substrate: 15 canonical domains ordered by numericId (foundational →
   human-formation). ORDERED_DOMAINS keeps the DomainSpec shape consumers
   expect (key/short/label/color/threadCount) but is now derived from the v2
   taxonomy. Domains with no v1 successor threads (7 Classical Languages, 9
   Theology) still render — present but unlit — per spec §9.1 / D9. Colour
   assignment is deferred design (each domain reuses an existing token). */
const V2_THREAD_COUNTS: Record<string, number> = Object.keys(THREAD_NAMES).reduce(
  (acc, id) => {
    const key = getV2DomainKey(id);
    if (key) acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  },
  {} as Record<string, number>,
);

export const ORDERED_DOMAINS: DomainSpec[] = [...V2_DOMAINS]
  .sort((a, b) => a.numericId - b.numericId)
  .map((d): DomainSpec => ({
    key: d.key,
    short: d.shortName,
    label: d.name,
    color: `var(${d.colourVar})`,
    threadCount: V2_THREAD_COUNTS[d.key] ?? 0,
  }));

export function domainColor(domainKey: string): string {
  const d = V2_DOMAINS_BY_KEY[domainKey];
  return `var(${d?.colourVar ?? '--color-domain-english'})`;
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
    const prereqs = prereqMap[id] ?? [];
    return {
      id,
      name: THREAD_NAMES[id],
      domain: getV2DomainKey(id) ?? 'languageLiteracy',
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

/* Sanity-loaded DLO shape from ALL_DLOS_QUERY. threadRef is the raw _ref string
   (`capabilityThread.{threadId}`); threadId is derived client-side. */
export type SanityDLO = {
  _id: string;
  threadRef: string;
  tier: Exclude<Tier, 'unobserved'>;
  descriptor: string;
  badgeLevel?: 'starter' | 'intermediate' | 'advanced' | null;
};

/* Derive `Lx` from `capabilityThread.Lx`. Returns null for unrecognised refs. */
export function threadIdFromRef(ref: string): string | null {
  const m = ref.match(/^capabilityThread\.(.+)$/);
  return m ? m[1] : null;
}

/* Group Sanity DLOs by threadId for fast O(1) lookup in topology consumers. */
export function indexDLOsByThread(dlos: SanityDLO[]): Record<string, SanityDLO[]> {
  const out: Record<string, SanityDLO[]> = {};
  for (const d of dlos) {
    const id = threadIdFromRef(d.threadRef);
    if (!id) continue;
    (out[id] ||= []).push(d);
  }
  return out;
}

/* DLO instance returned by buildDLOs — what GalleryDLOs / TableDLOs render.
   Renamed from SynthDLO because the descriptors are now real Sanity content
   when available; the synth-fallback path is only used when Sanity has no
   DLOs for the thread (e.g. before the seed has run). */
export type DLO = {
  id: string;
  thread: string;
  domain: string;
  tier: Exclude<Tier, 'unobserved'>;
  glyph: string;
  tierLabel: string;
  descriptor: string;
  badgeLevel: 'foundation' | 'practising' | 'mastery';
  status: 'confirmed' | 'emerging' | 'not-started';
  source: 'sanity' | 'placeholder';
};

/* Back-compat alias — keeps SynthDLO importable while call sites migrate.
   TODO: remove once no caller imports SynthDLO. */
export type SynthDLO = DLO;

const TIER_RANK: Record<Exclude<Tier, 'unobserved'>, number> = {
  emerging: 1,
  developing: 2,
  demonstrating: 3,
};

const TIER_ORDER: Exclude<Tier, 'unobserved'>[] = ['emerging', 'developing', 'demonstrating'];

// TRANSITIONAL (Item 5): badgeLevel is synthesised from tier, not authored.
// seed-dlos.ts deliberately does NOT write a badgeLevel on DLO documents and
// ALL_DLOS_QUERY's badgeLevel is therefore null in practice. This tier-derived
// mapping is the accepted lo-fi stand-in until v2 stage-tier badges (D8) are
// authored against atomic capabilities. Do not seed badgeLevel to "fix" this.
const BADGE_LEVEL_BY_TIER: Record<Exclude<Tier, 'unobserved'>, DLO['badgeLevel']> = {
  emerging: 'foundation',
  developing: 'practising',
  demonstrating: 'mastery',
};

/* Track which threads have already warned about missing Sanity content so the
   fallback doesn't spam the console once per render. */
const PLACEHOLDER_WARNED = new Set<string>();

/* Build the Depth-3 DLO list for a thread.

   Resolution order:
   1. Sanity-authored DLOs for this thread, in tier order (preferred).
   2. Placeholder descriptors from dlo-descriptors.ts (legacy; TODO remove once
      Sanity content is seeded across all 57 threads in production).

   Per-DLO status is GENUINE (Item 6): it is read from the persisted
   learner_dlo_status surface, keyed by the Sanity DLO _id, NOT synthesised
   from a thread-level tier-rank count. Absence of a persisted row = honest
   'not-started'. State is set only by explicit parent confirmation for now;
   write-time observation→DLO enrichment + a confidence model are the
   deliberately deferred keystone. `snap` is retained in the signature for
   call-site stability but no longer drives DLO status. */
export function buildDLOs(
  threadId: string,
  snap: LearnerSnapshot,
  sanityByThread?: Record<string, SanityDLO[]>,
  dloStateById?: Record<string, DLO['status']>,
): DLO[] {
  void snap;
  const thread = THREADS_BY_ID[threadId];
  if (!thread) return [];
  const stateFor = (id: string): DLO['status'] => dloStateById?.[id] ?? 'not-started';

  const sanityList = sanityByThread?.[threadId];
  if (sanityList && sanityList.length > 0) {
    // Sort by tier order so render is stable regardless of GROQ ordering.
    const sorted = [...sanityList].sort(
      (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier],
    );
    return sorted.map((d): DLO => ({
      id: d._id,
      thread: threadId,
      domain: thread.domain,
      tier: d.tier,
      glyph: TIER_GLYPH[d.tier],
      tierLabel: TIER_LABEL[d.tier],
      descriptor: d.descriptor,
      badgeLevel: BADGE_LEVEL_BY_TIER[d.tier],
      status: stateFor(d._id),
      source: 'sanity',
    }));
  }

  // Fallback: synthesise three tier DLOs from the placeholder descriptors.
  // TODO: delete this branch + dlo-descriptors.ts once seed-dlos.ts has run
  // against production and the GROQ returns content for every thread.
  if (!PLACEHOLDER_WARNED.has(threadId)) {
    PLACEHOLDER_WARNED.add(threadId);
    if (typeof console !== 'undefined') {
      console.warn(
        `[constellation] DLO placeholder used for thread ${threadId} — Sanity has no published discreteLearningObjective for this thread. Run scripts/seed-dlos.ts.`,
      );
    }
  }
  const seeded = DLO_DESCRIPTORS[threadId];
  return TIER_ORDER.map((t, idx): DLO => {
    const id = `${threadId}.${t[0]}`;
    return {
      id,
      thread: threadId,
      domain: thread.domain,
      tier: t,
      glyph: TIER_GLYPH[t],
      tierLabel: TIER_LABEL[t],
      descriptor: seeded?.[idx] ?? fallbackDescriptor(thread.name, TIER_LABEL[t]),
      badgeLevel: BADGE_LEVEL_BY_TIER[t],
      status: stateFor(id),
      source: 'placeholder',
    };
  });
}

