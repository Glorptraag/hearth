import type { CoachHintProvider } from './types';
import { RetrievalCoachProvider } from './retrieval-provider';

let _cached: CoachHintProvider | null = null;

export async function resolveCoachHintProvider(): Promise<CoachHintProvider> {
  if (!_cached) _cached = new RetrievalCoachProvider();
  return _cached;
}
