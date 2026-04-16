// Haiku-backed CoachHintProvider — scaffolded, not active in v1.
// Flip LOGGER_COACH_PROVIDER=haiku to route traffic here.
// Requires a real Haiku call + per-family rate limit before production use.

import type { CoachHintProvider, CoachHintInput, CoachHint } from './types';

export class HaikuCoachProvider implements CoachHintProvider {
  async getHints(_input: CoachHintInput): Promise<CoachHint[]> {
    throw new Error(
      'HaikuCoachProvider is not yet implemented. ' +
      'Set LOGGER_COACH_PROVIDER=retrieval (default) to use the v1 provider.'
    );
  }
}
