import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { THREAD_NAMES } from '@/lib/capability-threads';
import { GalleryDomains, GalleryThreads, GalleryDLOs, GalleryMoments } from './GalleryView';
import { THREADS_BY_ID, buildDLOs, buildSnapshot, type SanityDLO } from './topology';

// The cold import of the capability-universe graph module can take well over
// vitest's default 5000ms per-test timeout (90-150s on a cold cache) — bump
// it for this file so `npm test` (no --testTimeout flag) stays green.
vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

const THREAD_ID = Object.keys(THREAD_NAMES)[0];
const DOMAIN_KEY = THREADS_BY_ID[THREAD_ID].domain;
const DLO_ID = `dlo.${THREAD_ID}.emerging`;

const sanityDlo: SanityDLO = {
  _id: DLO_ID,
  threadRef: `capabilityThread.${THREAD_ID}`,
  tier: 'emerging',
  descriptor: 'Recognises a pattern and extends it',
};
const dlosByThread = { [THREAD_ID]: [sanityDlo] };

const snap = buildSnapshot({ id: 'lrn1', name: 'Emma', colourToken: null }, [
  {
    thread_id: THREAD_ID,
    thread_name: THREADS_BY_ID[THREAD_ID].name,
    observation_count: 4,
    suggested_tier: 'developing',
    last_evidence_date: '2026-06-01',
    current_badge_level: null,
    next_badge: null,
    next_badge_progress: 0,
  },
]);

describe('GalleryView smoke renders', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('GalleryDomains renders the full-constellation SVG without throwing', () => {
    render(<GalleryDomains snap={snap} onDrill={vi.fn()} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('GalleryThreads renders a single domain band without throwing', () => {
    render(<GalleryThreads snap={snap} domainKey={DOMAIN_KEY} onDrill={vi.fn()} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('GalleryDLOs renders the tiered DLO layout for a thread without throwing', () => {
    render(
      <GalleryDLOs snap={snap} threadId={THREAD_ID} dlosByThread={dlosByThread} onDrill={vi.fn()} />,
    );
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('GalleryMoments renders without throwing once evidence fetches settle', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          json: async () => (String(url).includes('dlo-evidence') ? { evidence: [] } : []),
        }),
      ),
    );
    const dlo = buildDLOs(THREAD_ID, snap, dlosByThread)[0];
    render(<GalleryMoments snap={snap} dlo={dlo} />);
    // Settles on an empty-state timeline once both fetches resolve.
    expect(await screen.findByText(/moments|logged|nothing/i)).toBeInTheDocument();
  });
});
