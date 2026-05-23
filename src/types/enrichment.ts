// Shared shape for `learning_entries.ai_enrichment` JSONB.
//
// Status discriminant added 2026-05-18 so the Logger post-save surface can
// distinguish enriched / pending / failed without inferring from presence.
// Older rows written before this change have no `status` field — treat that
// case as `enriched` if `capability_threads` is populated, else `unknown`.

import type { PedagogySource } from '@/lib/ai/pedagogy-context';
import type { ProfileNudge } from '@/lib/logger/coaching/types';

export type AiEnrichmentStatus = 'pending' | 'enriched' | 'failed';

export type AiEnrichmentBody = {
  subjects_detected: string[];
  capability_threads: { thread_id: string; confidence: number }[];
  curriculum_descriptors: { code: string; confidence: number }[];
  per_child_signals: Record<string, {
    engagement_score: number;
    complexity_level: 'emerging' | 'developing' | 'demonstrating';
    notable: string | null;
  }>;
  insight_suggestions: string[];
  confidence: number;
  quality_indicators: {
    description_richness: 'thin' | 'adequate' | 'rich';
    evidence_present: boolean;
    multi_subject: boolean;
  };
  journey_observation: {
    text: string;
    trigger: 'cross_domain' | 'independence' | 'metacognition' | 'transfer';
  } | null;
  // HEU work-sample curation signal (spec §3.2). Written at enrichment time
  // so the Candidate Panel can rank candidates instead of falling back to
  // date+subject filtering. `work_sample.flag` mirrors learning_entries.work_sample_candidate;
  // `work_sample.quality` is 0.0-1.0. Both null on rows enriched before 2026-05.
  work_sample?: {
    flag: boolean;
    quality: number;
    rationale?: string | null;
  } | null;
  pedagogy_sources?: PedagogySource[];
  profile_nudge?: ProfileNudge | null;
};

export type AiEnrichment = Partial<AiEnrichmentBody> & {
  status?: AiEnrichmentStatus;
  startedAt?: string;
  failedAt?: string;
  error?: string;
};
