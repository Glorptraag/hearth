import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { THREAD_NAMES } from '@/lib/capability-threads';
import { TableThreads, TableDLOs, TableMoments } from './TableView';
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

describe('TableView smoke renders', () => {
  it('TableThreads renders depth 1 (all domains) without throwing', () => {
    render(<TableThreads snap={snap} depth={1} onDrillDown={vi.fn()} onDomainTap={vi.fn()} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('TableThreads renders depth 2 (single domain) without throwing', () => {
    render(<TableThreads snap={snap} depth={2} focusDomain={DOMAIN_KEY} onDrillDown={vi.fn()} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('TableDLOs renders the DLO list for a thread without throwing', () => {
    render(
      <TableDLOs
        snap={snap}
        threadId={THREAD_ID}
        dlosByThread={dlosByThread}
        onDrillDown={vi.fn()}
      />,
    );
    const dlos = buildDLOs(THREAD_ID, snap, dlosByThread);
    expect(dlos.length).toBeGreaterThan(0);
    // The descriptor also appears in the "Next to watch for" line when the
    // objective is unreached, so it can legitimately render more than once.
    expect(screen.getAllByText(sanityDlo.descriptor).length).toBeGreaterThan(0);
  });

  it('TableMoments renders the loading state then settles without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => ([]) })),
    );
    const dlo = buildDLOs(THREAD_ID, snap, dlosByThread)[0];
    render(<TableMoments snap={snap} dlo={dlo} />);
    expect(screen.getByText(/Loading moments/i)).toBeInTheDocument();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});


describe('TableView — status, next-to-watch, recency and trajectory', () => {
  const threeTier: SanityDLO[] = [
    { _id: `dlo.${THREAD_ID}.emerging`, threadRef: `capabilityThread.${THREAD_ID}`, tier: 'emerging', descriptor: 'First noticing' },
    { _id: `dlo.${THREAD_ID}.developing`, threadRef: `capabilityThread.${THREAD_ID}`, tier: 'developing', descriptor: 'Practising with support' },
    { _id: `dlo.${THREAD_ID}.demonstrating`, threadRef: `capabilityThread.${THREAD_ID}`, tier: 'demonstrating', descriptor: 'Independent fluency' },
  ];

  it('TableDLOs shows the developing state distinctly and marks the next objective to watch for', () => {
    const snapWithStatus = buildSnapshot({ id: 'lrn1', name: 'Emma', colourToken: null }, [], {
      [`dlo.${THREAD_ID}.emerging`]: { status: 'emerging' },
      [`dlo.${THREAD_ID}.developing`]: { status: 'developing' },
    });
    render(<TableDLOs snap={snapWithStatus} threadId={THREAD_ID} dlosByThread={{ [THREAD_ID]: threeTier }} onDrillDown={vi.fn()} />);
    // Both the wide chip and the compact phone chip render the label.
    expect(screen.getAllByText('Developing').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Emerging').length).toBeGreaterThanOrEqual(1);
    // Emerging + developing are reached at their tiers; demonstrating is not → it is "next".
    expect(screen.getByText(/Next to watch for:/)).toHaveTextContent('Independent fluency');
    expect(screen.getByText('Watch for this next')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Independent fluency — Not yet observed, next to watch for/ })).toBeInTheDocument();
  });

  it('TableThreads marks a newly lit thread and names its trajectory', () => {
    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const snapNew = buildSnapshot({ id: 'lrn1', name: 'Emma', colourToken: null }, [
      {
        thread_id: THREAD_ID, thread_name: THREADS_BY_ID[THREAD_ID].name,
        observation_count: 4, suggested_tier: 'emerging',
        last_evidence_date: iso(today), first_evidence_date: iso(new Date(today.getTime() - 3 * 86_400_000)),
        trajectory: 'accelerating',
        current_badge_level: null, next_badge: null, next_badge_progress: 0,
      },
    ]);
    render(<TableThreads snap={snapNew} depth={2} focusDomain={DOMAIN_KEY} onDrillDown={vi.fn()} />);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByLabelText('Trajectory: Picking up')).toBeInTheDocument();
  });

  it('TableMoments renders a parent confirmation as a moment without a portfolio link', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes('/dlo-evidence')
        ? { evidence: [
            { entryId: null, title: 'You confirmed this', dateOccurred: '2026-10-01', source: 'parent', tier: 'developing', confidence: 1, rationale: null, provenance: 'asserted', createdAt: '2026-10-01T00:00:00.000Z' },
            { entryId: 'e1', title: 'Counting shells', dateOccurred: '2026-09-20', source: 'logger', tier: 'emerging', confidence: 0.7, rationale: 'Sorted by fives.', provenance: 'inferred', createdAt: '2026-09-20T00:00:00.000Z' },
          ] }
        : [];
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
    const dlo = buildDLOs(THREAD_ID, snap, dlosByThread)[0];
    render(<TableMoments snap={snap} dlo={dlo} />);
    expect(await screen.findByText('You confirmed this')).toBeInTheDocument();
    expect(screen.getByText('You confirmed')).toBeInTheDocument(); // provenance label
    expect(screen.getByRole('link', { name: 'Counting shells' })).toHaveAttribute('href', '/our-story/portfolio#entry-e1');
    expect(screen.queryByRole('link', { name: 'You confirmed this' })).toBeNull();
    vi.unstubAllGlobals();
  });
});
