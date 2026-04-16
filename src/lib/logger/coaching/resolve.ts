// Env-flag provider resolver. Controls which CoachHintProvider is active
// without touching the UI. Default is 'retrieval' (no LLM, no cost delta).

import type { CoachHintProvider } from './types';

type ProviderKey = 'retrieval' | 'haiku' | 'hybrid';

function getProviderKey(): ProviderKey {
  const raw = process.env.LOGGER_COACH_PROVIDER ?? 'retrieval';
  if (raw === 'haiku' || raw === 'hybrid') return raw;
  return 'retrieval';
}

let _cached: CoachHintProvider | null = null;

export async function resolveCoachHintProvider(): Promise<CoachHintProvider> {
  if (_cached) return _cached;

  const key = getProviderKey();

  if (key === 'haiku') {
    const { HaikuCoachProvider } = await import('./haiku-provider');
    _cached = new HaikuCoachProvider();
  } else if (key === 'hybrid') {
    const { HybridCoachProvider } = await import('./hybrid-provider');
    _cached = new HybridCoachProvider();
  } else {
    const { RetrievalCoachProvider } = await import('./retrieval-provider');
    _cached = new RetrievalCoachProvider();
  }

  return _cached;
}
