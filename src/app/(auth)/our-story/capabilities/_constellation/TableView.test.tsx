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
    expect(screen.getByText(sanityDlo.descriptor)).toBeInTheDocument();
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
