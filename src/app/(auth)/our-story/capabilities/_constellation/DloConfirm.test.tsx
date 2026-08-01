import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { THREAD_NAMES } from '@/lib/capability-threads';
import { TableDLOs } from './TableView';
import { GalleryMoments } from './GalleryView';
import { buildSnapshot, type SanityDLO, type DloStatusLite } from './topology';

// The cold import of the capability-universe graph module can take well over
// vitest's default 5000ms per-test timeout (90-150s on a cold cache) — bump
// it for this file so `npm test` (no --testTimeout flag) stays green.
vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

// A real thread id so buildDLOs (which checks THREADS_BY_ID) returns rows.
const THREAD_ID = Object.keys(THREAD_NAMES)[0];
const DLO_ID = `dlo.${THREAD_ID}.emerging`;

const sanityDlo: SanityDLO = {
  _id: DLO_ID,
  threadRef: `capabilityThread.${THREAD_ID}`,
  tier: 'emerging',
  descriptor: 'Recognises a pattern and extends it',
};

function snapshot(dloStatus: Record<string, DloStatusLite> = {}) {
  return buildSnapshot({ id: 'lrn1', name: 'Emma', colourToken: null }, [], dloStatus);
}

const dlosByThread = { [THREAD_ID]: [sanityDlo] };

describe('DLO confirm control — TableView L3 (TableDLOs)', () => {
  it('renders an unconfirmed "Confirm" control and toggles it on with action=confirm', () => {
    const onConfirmDlo = vi.fn();
    render(
      <TableDLOs
        snap={snapshot()}
        threadId={THREAD_ID}
        dlosByThread={dlosByThread}
        onDrillDown={vi.fn()}
        confirmedDloIds={new Set()}
        pendingDloIds={new Set()}
        onConfirmDlo={onConfirmDlo}
      />,
    );
    const btn = screen.getByRole('button', { name: /confirm you've seen/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn);
    expect(onConfirmDlo).toHaveBeenCalledWith(DLO_ID, true);
  });

  it('renders a confirmed control and toggles it off with action=dispute', () => {
    const onConfirmDlo = vi.fn();
    render(
      <TableDLOs
        snap={snapshot({ [DLO_ID]: { status: 'emerging', asserted_by_parent: true } })}
        threadId={THREAD_ID}
        dlosByThread={dlosByThread}
        onDrillDown={vi.fn()}
        confirmedDloIds={new Set([DLO_ID])}
        pendingDloIds={new Set()}
        onConfirmDlo={onConfirmDlo}
      />,
    );
    const btn = screen.getByRole('button', { name: /you confirmed/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(btn);
    expect(onConfirmDlo).toHaveBeenCalledWith(DLO_ID, false);
  });

  it('does not collide with the tier chip wording (no second "Confirmed" chip)', () => {
    render(
      <TableDLOs
        snap={snapshot({ [DLO_ID]: { status: 'demonstrating' } })}
        threadId={THREAD_ID}
        dlosByThread={dlosByThread}
        onDrillDown={vi.fn()}
        confirmedDloIds={new Set()}
        pendingDloIds={new Set()}
        onConfirmDlo={vi.fn()}
      />,
    );
    // The demonstrating tier chip now reads "Demonstrating", leaving "Confirm…"
    // exclusively to the parent-assertion control.
    expect(screen.getByText('Demonstrating')).toBeInTheDocument();
  });

  it('omits the control entirely when no onConfirmDlo handler is provided', () => {
    render(
      <TableDLOs
        snap={snapshot()}
        threadId={THREAD_ID}
        dlosByThread={dlosByThread}
        onDrillDown={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /confirm you've seen/i })).toBeNull();
  });
});

describe('DLO confirm control — GalleryView L4 (GalleryMoments)', () => {
  beforeEach(() => {
    // GalleryMoments fetches evidence (then entries) on mount; return empty so
    // it settles on the "no moments" state with the confirm toolbar still shown.
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          json: async () => (String(url).includes('dlo-evidence') ? { evidence: [] } : []),
        }),
      ),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const dlo = {
    id: DLO_ID,
    thread: THREAD_ID,
    domain: 'languageLiteracy',
    tier: 'emerging' as const,
    glyph: '○',
    tierLabel: 'Emerging',
    descriptor: sanityDlo.descriptor,
    badgeLevel: 'foundation' as const,
    status: 'not-started' as const,
    source: 'sanity' as const,
  };

  it('shows the confirm toolbar even with zero moments, and toggles on', async () => {
    const onConfirm = vi.fn();
    render(<GalleryMoments snap={snapshot()} dlo={dlo} confirmed={false} pending={false} onConfirm={onConfirm} />);
    const btn = await screen.findByRole('button', { name: /confirm you've seen/i });
    fireEvent.click(btn);
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(true));
  });

  it('shows a confirmed control and toggles off', async () => {
    const onConfirm = vi.fn();
    render(<GalleryMoments snap={snapshot()} dlo={dlo} confirmed pending={false} onConfirm={onConfirm} />);
    const btn = await screen.findByRole('button', { name: /you confirmed/i });
    fireEvent.click(btn);
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(false));
  });

  it('renders a bare timeline (no toolbar) when onConfirm is unset', async () => {
    render(<GalleryMoments snap={snapshot()} dlo={dlo} />);
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /confirm you've seen/i })).toBeNull(),
    );
  });
});
