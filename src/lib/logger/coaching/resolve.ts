// Env-flag provider resolver. Controls which CoachHintProvider is active
// without touching the UI. Default is 'retrieval' (no LLM, no cost delta).
// 'haiku' is scaffolded but throws on call — flip the flag only when the
// HaikuCoachProvider implementation lands.

import type { CoachHintProvider } from './types';

const PROVIDER_KEYS = ['retrieval', 'haiku'] as const;
type ProviderKey = (typeof PROVIDER_KEYS)[number];

function getProviderKey(): ProviderKey {
  const raw = process.env.LOGGER_COACH_PROVIDER ?? 'retrieval';
  if ((PROVIDER_KEYS as readonly string[]).includes(raw)) {
    return raw as ProviderKey;
  }
  console.warn(`[coach-hints] Unknown LOGGER_COACH_PROVIDER="${raw}", using retrieval`);
  return 'retrieval';
}

let _cached: CoachHintProvider | null = null;

export async function resolveCoachHintProvider(): Promise<CoachHintProvider> {
  if (_cached) return _cached;

  const key = getProviderKey();

  if (key === 'haiku') {
    const { HaikuCoachProvider } = await import('./haiku-provider');
    _cached = new HaikuCoachProvider();
  } else {
    const { RetrievalCoachProvider } = await import('./retrieval-provider');
    _cached = new RetrievalCoachProvider();
  }

  return _cached;
}
