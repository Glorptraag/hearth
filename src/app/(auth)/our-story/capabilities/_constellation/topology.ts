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

/* Per-DLO status slice the constellation reads, keyed by Sanity DLO `_id`.
   `asserted_by_parent` mirrors the snapshot field — true when the parent has
   explicitly confirmed this DLO ("Yes, I've seen this"). */
export type DloStatusLite = { status: string; asserted_by_parent?: boolean };

/* Explore (gap) view data, sliced from the per-child snapshot. */
export type GapAnalysis = {
  underserved_subjects: string[];
  suggested_focus_threads: string[];
};
export type CurriculumCoverage = Record<
  string,
  { total_entries: number; unique_descriptors: number; coverage_percentage: number }
>;

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
  // Per-DLO status keyed by Sanity DLO `_id`. Populated by the snapshot rebuild
  // from `learner_dlo_status`. Missing entries default to 'not-started'. This is
  // the real per-DLO surface buildDLOs reads — the old fabricated dlos_confirmed/
  // dlos_total counts were removed in WS-4.
  dloStatusById: Record<string, DloStatusLite>;
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
};

export function buildSnapshot(
  learner: { id: string; name: string; colourToken: string | null },
  rows: ActiveThreadRow[],
  dloStatusById?: Record<string, DloStatusLite>,
): LearnerSnapshot {
  const tier: Record<string, Tier> = {};
  const obs: Record<string, number> = {};
  const last: Record<string, string> = {};
  const badges: LearnerSnapshot['badges'] = [];

  for (const r of rows) {
    const t = (r.suggested_tier as Tier) ?? 'unobserved';
    tier[r.thread_id] = t === 'emerging' || t === 'developing' || t === 'demonstrating' ? t : 'unobserved';
    obs[r.thread_id] = r.observation_count ?? 0;
    if (r.last_evidence_date) last[r.thread_id] = r.last_evidence_date;
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
    dloStatusById: dloStatusById ?? {},
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
   Descriptors come from Sanity (seed-dlos.ts authored 57 × 3 = 171). */
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
  source: 'sanity';
};

/* Back-compat alias — keeps SynthDLO importable while call sites migrate. */
export type SynthDLO = DLO;

const TIER_RANK: Record<Exclude<Tier, 'unobserved'>, number> = {
  emerging: 1,
  developing: 2,
  demonstrating: 3,
};

// badgeLevel is synthesised from tier, not authored. seed-dlos.ts deliberately
// does NOT write a badgeLevel on DLO documents; this tier-derived mapping is
// the accepted lo-fi stand-in until v2 stage-tier badges (D8) are authored
// against atomic capabilities. Do not seed badgeLevel to "fix" this.
const BADGE_LEVEL_BY_TIER: Record<Exclude<Tier, 'unobserved'>, DLO['badgeLevel']> = {
  emerging: 'foundation',
  developing: 'practising',
  demonstrating: 'mastery',
};

/* Build the Depth-3 DLO list for a thread. Sanity is the single source of
   DLO content (seed-dlos.ts authors 57 × 3). Per-DLO status comes from
   `snap.dloStatusById`, populated by the snapshot rebuild from the
   `learner_dlo_status` table. The persisted status uses four values
   (emerging | developing | demonstrating | not-started); the constellation's
   DLO type collapses these into three render states ('confirmed' for
   demonstrating, 'emerging' for emerging/developing, 'not-started' for absent
   entries) to keep Gallery/Table rendering stable. Returns [] for unknown
   threads or threads with no Sanity content (caller renders an empty state). */
export function buildDLOs(
  threadId: string,
  snap: LearnerSnapshot,
  sanityByThread?: Record<string, SanityDLO[]>,
): DLO[] {
  const thread = THREADS_BY_ID[threadId];
  if (!thread) return [];
  const stateFor = (id: string): DLO['status'] => {
    const persisted = snap.dloStatusById?.[id]?.status;
    if (persisted === 'demonstrating') return 'confirmed';
    if (persisted === 'developing' || persisted === 'emerging') return 'emerging';
    return 'not-started';
  };

  const sanityList = sanityByThread?.[threadId] ?? [];
  if (sanityList.length === 0) return [];

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

