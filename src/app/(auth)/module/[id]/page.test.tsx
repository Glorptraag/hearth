/**
 * Probe-event coverage: module_session_started / _resumed / _logged.
 *
 * These events answer "do families run modules multi-session / cross-device
 * at all?" (PR-C step 1). Tests verify track() is called at the three
 * lifecycle points: Start, Resume, and onSaved.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';

// vi.mock factories are hoisted — no top-level variable references allowed.

vi.mock('@/lib/analytics/posthog', () => ({
  track: vi.fn(),
  hashForAnalytics: vi.fn().mockResolvedValue('hashed_module_id_fixture_000'),
  initAnalytics: vi.fn(),
  identifyUser: vi.fn(),
  identifyFamily: vi.fn(),
  resetIdentity: vi.fn(),
}));

vi.mock('@/lib/sanity/client', () => ({
  sanityClient: { fetch: vi.fn() },
  sanityWriteClient: { fetch: vi.fn().mockResolvedValue(null) },
}));

vi.mock('./_components/FacilitateMode', () => ({
  default: ({ onFinish }: { onFinish: () => void }) => (
    <button onClick={onFinish}>Finish Session</button>
  ),
}));

vi.mock('./_components/LogMode', () => ({
  default: ({ onSaved }: { onSaved: () => void }) => (
    <button onClick={onSaved}>Save to Portfolio</button>
  ),
}));

vi.mock('./_components/ApproachPicker', () => ({ default: () => null }));
vi.mock('./_components/ProgressBar', () => ({ default: () => null }));
vi.mock('./_components/ModuleSidebar', () => ({ default: () => null }));
vi.mock('@/components/content/CommonsReader', () => ({ CommonsReader: () => null }));
vi.mock('@/components/content/PrintSheet', () => ({ PrintSheet: () => null }));

// Imports must come AFTER vi.mock declarations.
import ModuleDetailPage from './page';
import { track } from '@/lib/analytics/posthog';
import { sanityClient } from '@/lib/sanity/client';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_RAW_MODULE = {
  _id: 'module_1',
  title: 'Tide Pools',
  targetUnderstanding: 'Rock pools host distinct living communities.',
  subjects: ['science'],
  approaches: [
    {
      _id: 'approach_1',
      title: 'Hands-on',
      modality: 'kinesthetic',
      activities: [{ _id: 'activity_a', title: 'Observe' }],
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stubApiFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === '/api/library')
        return new Response(JSON.stringify([{ id: 'module_1', kind: 'module' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      if (url === '/api/settings')
        return new Response(JSON.stringify({ pedagogyPreference: 'eclectic' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }),
  );
}

// Waits for the page to reach prep mode (module loaded, single approach). The
// button label depends on savedChunkIdx so we wait for EITHER variant.
async function waitForPrepMode() {
  await waitFor(() => {
    const btn =
      screen.queryByRole('button', { name: /Start Session →/i }) ??
      screen.queryByRole('button', { name: /Restart from Beginning/i });
    expect(btn).not.toBeNull();
  });
}

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  vi.mocked(useParams).mockReturnValue({ id: 'module_1' });

  // Reset + re-configure with a fresh implementation so each test sees an
  // independent call sequence regardless of the `vi.clearAllMocks()` from
  // vitest.setup.ts (which only clears call history, not the once-queue).
  // Cast to `any` because the test fixtures don't satisfy Sanity's generic
  // RawQuerylessQueryResponse wrapper — the real runtime value is the inner
  // data, not the envelope.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockFetch = vi.mocked(sanityClient.fetch) as unknown as any;
  mockFetch.mockReset();
  mockFetch
    .mockResolvedValueOnce(MOCK_RAW_MODULE) // MODULE_DETAIL_QUERY
    .mockResolvedValueOnce(null)            // FRAMEWORK_BY_PEDAGOGY_KEY_QUERY → no framework
    .mockResolvedValue([]);                 // OVERLAYS_BATCH_QUERY + any fallback

  stubApiFetch();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('module_session_started', () => {
  it('fires when Start Session is clicked', async () => {
    render(<ModuleDetailPage />);
    await waitForPrepMode();

    screen.getByRole('button', { name: /Start Session →/i }).click();

    await waitFor(() => {
      expect(vi.mocked(track)).toHaveBeenCalledWith('module_session_started', {
        module_id_hash: 'hashed_module_id_fixture_000',
      });
    });
  });
});

describe('module_session_resumed', () => {
  it('fires when Resume is clicked and includes chunk_idx', async () => {
    window.localStorage.setItem('hearth_module_module_1_session', '2');

    render(<ModuleDetailPage />);
    await waitForPrepMode();

    const resumeBtn = await screen.findByRole('button', { name: /Resume →/i });
    resumeBtn.click();

    await waitFor(() => {
      expect(vi.mocked(track)).toHaveBeenCalledWith('module_session_resumed', {
        module_id_hash: 'hashed_module_id_fixture_000',
        chunk_idx: 2,
      });
    });
  });
});

describe('module_session_logged', () => {
  it('fires when the session save completes', async () => {
    render(<ModuleDetailPage />);
    await waitForPrepMode();

    // Navigate through Start → FacilitateMode (mocked) → LogMode (mocked) → save
    screen.getByRole('button', { name: /Start Session →/i }).click();
    const finishBtn = await screen.findByRole('button', { name: /Finish Session/i });
    finishBtn.click();

    const saveBtn = await screen.findByRole('button', { name: /Save to Portfolio/i });
    saveBtn.click();

    await waitFor(() => {
      expect(vi.mocked(track)).toHaveBeenCalledWith('module_session_logged', {
        module_id_hash: 'hashed_module_id_fixture_000',
      });
    });
  });
});
