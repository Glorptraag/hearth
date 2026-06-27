import { sanityServerClient } from '@/lib/sanity/client';
import { DLO_TIERS_QUERY } from '@/lib/sanity/queries';

// ─── Types ───

export interface SanityDLO {
  _key: string;
  title: string;
  tier: 'emerging' | 'developing' | 'demonstrating';
}

export interface SanityThread {
  _id: string;
  title: string;
  slug: string;
  domain: string;
  description: string;
  dlos: SanityDLO[];
  prerequisiteIds: string[];
  enablesIds: string[];
}

export interface ThreadMeta {
  thread_id: string;
  title: string;
  domain: string;
  dlos: SanityDLO[];
  dlos_total: number;
}

// ─── Short-code → title mapping (matches enrichment prompt taxonomy) ───

const THREAD_TAXONOMY: Record<string, { title: string; domain: string }> = {
  L1: { title: 'Oral Communication', domain: 'english' },
  L2: { title: 'Phonological Awareness', domain: 'english' },
  L3: { title: 'Reading Comprehension', domain: 'english' },
  L4: { title: 'Vocabulary & Word Knowledge', domain: 'english' },
  L5: { title: 'Written Expression', domain: 'english' },
  L6: { title: 'Spelling & Grammar', domain: 'english' },
  L7: { title: 'Narrative & Retelling', domain: 'english' },
  L8: { title: 'Persuasion & Argument', domain: 'english' },
  L9: { title: 'Literary Appreciation', domain: 'english' },
  M1: { title: 'Number Sense', domain: 'mathematics' },
  M2: { title: 'Operations', domain: 'mathematics' },
  M3: { title: 'Fractional Thinking', domain: 'mathematics' },
  M4: { title: 'Algebraic Thinking', domain: 'mathematics' },
  M5: { title: 'Measurement', domain: 'mathematics' },
  M6: { title: 'Spatial Reasoning', domain: 'mathematics' },
  M7: { title: 'Data & Statistics', domain: 'mathematics' },
  M8: { title: 'Probability', domain: 'mathematics' },
  M9: { title: 'Mathematical Modelling', domain: 'mathematics' },
  S1: { title: 'Scientific Inquiry', domain: 'science' },
  S2: { title: 'Biological Sciences', domain: 'science' },
  S3: { title: 'Chemical Sciences', domain: 'science' },
  S4: { title: 'Physical Sciences', domain: 'science' },
  S5: { title: 'Scientific Observation', domain: 'science' },
  S6: { title: 'Earth & Space', domain: 'science' },
  S7: { title: 'Environmental Science', domain: 'science' },
  H1: { title: 'Historical Understanding', domain: 'hass' },
  H2: { title: 'Source Analysis', domain: 'hass' },
  H3: { title: 'Geographical Understanding', domain: 'hass' },
  H4: { title: 'Civics & Citizenship', domain: 'hass' },
  H5: { title: 'Economics & Business', domain: 'hass' },
  H6: { title: 'Cultural Understanding', domain: 'hass' },
  P1: { title: 'Gross Motor', domain: 'hpe' },
  P2: { title: 'Fine Motor', domain: 'hpe' },
  P3: { title: 'Body Awareness', domain: 'hpe' },
  P4: { title: 'Team & Sport', domain: 'hpe' },
  P5: { title: 'Aquatics', domain: 'hpe' },
  PS1: { title: 'Empathy', domain: 'personal_social' },
  PS2: { title: 'Social Skills', domain: 'personal_social' },
  PS3: { title: 'Self-Regulation', domain: 'personal_social' },
  PS4: { title: 'Identity', domain: 'personal_social' },
  PS5: { title: 'Responsibility', domain: 'personal_social' },
  PS6: { title: 'Resilience', domain: 'personal_social' },
  PS7: { title: 'Safety', domain: 'personal_social' },
  C1: { title: 'Visual Art', domain: 'arts' },
  C2: { title: 'Music', domain: 'arts' },
  C3: { title: 'Drama', domain: 'arts' },
  C4: { title: 'Dance', domain: 'arts' },
  C5: { title: 'Media Arts', domain: 'arts' },
  C6: { title: 'Design & Construction', domain: 'arts' },
  C7: { title: 'Arts Appreciation', domain: 'arts' },
  EF1: { title: 'Sustained Attention', domain: 'executive_function' },
  EF2: { title: 'Working Memory', domain: 'executive_function' },
  EF3: { title: 'Cognitive Flexibility', domain: 'executive_function' },
  EF4: { title: 'Planning & Organisation', domain: 'executive_function' },
  EF5: { title: 'Critical Thinking', domain: 'executive_function' },
  EF6: { title: 'Collaboration', domain: 'executive_function' },
  EF7: { title: 'Metacognition', domain: 'executive_function' },
  EF8: { title: 'Transfer', domain: 'executive_function' },
};

// ─── Cache ───

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

let cachedThreads: Map<string, ThreadMeta> | null = null;
let cacheTimestamp = 0;

/**
 * Returns a Map<thread_id, ThreadMeta> keyed by short code (L1, M1, etc.).
 * Merges the hardcoded taxonomy with DLO data from Sanity (when available).
 * In-memory cached with 10-minute TTL.
 */
export async function getCachedThreads(): Promise<Map<string, ThreadMeta>> {
  if (cachedThreads && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedThreads;
  }

  // Build base map from taxonomy (always complete, even if Sanity is down)
  const threads = new Map<string, ThreadMeta>();
  for (const [id, meta] of Object.entries(THREAD_TAXONOMY)) {
    threads.set(id, {
      thread_id: id,
      title: meta.title,
      domain: meta.domain,
      dlos: [],
      dlos_total: 3, // Each thread has 3 DLOs by design
    });
  }

  // Augment with standalone discreteLearningObjective documents — the single
  // source of truth (Item 3). The constellation visualiser reads the SAME
  // documents (ALL_DLOS_QUERY). (WS-4 removed the snapshot's fabricated
  // dlos_confirmed math; real per-DLO status now comes from learner_dlo_status,
  // so these `dlos`/`dlos_total` fields are no longer read by the rebuild.)
  // Keyed directly by the deterministic `capabilityThread.{shortCode}` ref — no
  // fuzzy title matching.
  // Read through the authed `sanityServerClient`: `discreteLearningObjective`
  // docs use dotted ids that fall outside the prod public-read ACL, so the
  // tokenless `sanityClient` returns 0 rows in production — silently leaving
  // every thread on taxonomy-only (3 placeholder DLOs). Server-side write-time
  // code, so the authed read is safe. Mirrors dlo-cache.ts / thread-links.ts.
  try {
    const dloRows: Array<{ _id: string; threadRef: string; tier: SanityDLO['tier'] }> =
      await sanityServerClient.fetch(DLO_TIERS_QUERY);

    const byShortCode = new Map<string, SanityDLO[]>();
    for (const row of dloRows) {
      const m = row.threadRef?.match(/^capabilityThread\.(.+)$/);
      if (!m) continue;
      const code = m[1];
      const list = byShortCode.get(code) ?? [];
      list.push({ _key: row._id, title: '', tier: row.tier });
      byShortCode.set(code, list);
    }

    for (const [code, meta] of threads) {
      const dlos = byShortCode.get(code);
      if (dlos && dlos.length) {
        meta.dlos = dlos;
        meta.dlos_total = dlos.length;
      }
    }
  } catch (err) {
    // Sanity fetch failed — proceed with taxonomy-only data (no DLOs)
    console.warn('[sanity-thread-cache] Failed to fetch DLOs from Sanity, using taxonomy only:', err);
  }

  cachedThreads = threads;
  cacheTimestamp = Date.now();
  return threads;
}

/** Bust the cache (e.g. after Sanity content changes) */
export function bustThreadCache(): void {
  cachedThreads = null;
  cacheTimestamp = 0;
}

/** Get thread metadata by short code without async (returns null on cache miss) */
export function getThreadSync(threadId: string): ThreadMeta | null {
  return cachedThreads?.get(threadId) ?? null;
}

