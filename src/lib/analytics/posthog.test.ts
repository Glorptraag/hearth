import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock posthog-js so we can assert init/capture without a real PostHog.
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    set_config: vi.fn(),
    identify: vi.fn(),
    group: vi.fn(),
    reset: vi.fn(),
  },
}));

// `enabled` is computed at module load from env, so each test loads a fresh
// module instance (reset registry) with env stubbed beforehand.
async function loadFresh(env: { key?: string; host?: string } = { key: 'phc_test', host: 'https://ph.test' }) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', env.key ?? '');
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', env.host ?? '');
  const mod = await import('./posthog');
  const posthog = (await import('posthog-js')).default as unknown as {
    init: ReturnType<typeof vi.fn>;
    capture: ReturnType<typeof vi.fn>;
  };
  return { mod, posthog };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('track() pre-init buffering', () => {
  it('buffers an event fired before init, then flushes it on initAnalytics()', async () => {
    const { mod, posthog } = await loadFresh();

    // Fired before the provider initialises (the public-page mount ordering).
    mod.track('onboarding_started', { step: 1 });
    expect(posthog.capture).not.toHaveBeenCalled(); // buffered, NOT dropped

    mod.initAnalytics();
    expect(posthog.init).toHaveBeenCalledTimes(1);
    // The buffered event is replayed on init.
    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith('onboarding_started', expect.objectContaining({ step: 1 }));
  });

  it('captures immediately once initialised', async () => {
    const { mod, posthog } = await loadFresh();
    mod.initAnalytics();
    posthog.capture.mockClear();

    mod.track('entry_created', { learner_count: 2 });
    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith('entry_created', expect.objectContaining({ learner_count: 2 }));
  });

  it('no-ops (no buffer, no init) when PostHog env is unset', async () => {
    const { mod, posthog } = await loadFresh({ key: '', host: '' });
    mod.track('onboarding_started', { step: 1 });
    mod.initAnalytics();
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});
