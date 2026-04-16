// Hybrid CoachHintProvider — scaffolded, not active in v1.
// Retrieval first; escalates to Haiku when retrieval returns <1 hint
// or when the entry is Guided + thin description + long on-screen time.
// Flip LOGGER_COACH_PROVIDER=hybrid to route traffic here.

import type { CoachHintProvider, CoachHintInput, CoachHint } from './types';

export class HybridCoachProvider implements CoachHintProvider {
  async getHints(_input: CoachHintInput): Promise<CoachHint[]> {
    throw new Error(
      'HybridCoachProvider is not yet implemented. ' +
      'Set LOGGER_COACH_PROVIDER=retrieval (default) to use the v1 provider.'
    );
  }
}
