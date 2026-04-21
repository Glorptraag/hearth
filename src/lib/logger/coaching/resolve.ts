// Env-flag provider resolver. Controls which CoachHintProvider is active
// without touching the UI. Default is 'retrieval' (no LLM, no cost delta).
// Haiku/hybrid providers are scaffolded only; unsupported flags fall back to
// retrieval so coach-hints never 500s because of config drift.

import type { CoachHintProvider } from './types';

type ProviderKey = 'retrieval';

function getProviderKey(): ProviderKey {
  const raw = process.env.LOGGER_COACH_PROVIDER ?? 'retrieval';
  if (raw !== 'retrieval') {
    console.warn(`[coach-hints] Unsupported LOGGER_COACH_PROVIDER="${raw}", using retrieval`);
  }
  return 'retrieval';
}

let _cached: CoachHintProvider | null = null;

export async function resolveCoachHintProvider(): Promise<CoachHintProvider> {
  if (_cached) return _cached;

  getProviderKey();

  const { RetrievalCoachProvider } = await import('./retrieval-provider');
  _cached = new RetrievalCoachProvider();

  return _cached;
}
