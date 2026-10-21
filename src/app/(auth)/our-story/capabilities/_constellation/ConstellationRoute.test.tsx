import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { THREAD_NAMES } from '@/lib/capability-threads';
import { ToastProvider } from '@/components/ui/Toast';
import { ConstellationRoute, parseFocus, parseView } from './ConstellationRoute';
import { THREADS_BY_ID, buildSnapshot, type SanityDLO } from './topology';

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

const learners = [
  { id: 'lrn1', name: 'Emma', dateOfBirth: null, shapeIcon: null, colourToken: null },
  { id: 'lrn2', name: 'Noah', dateOfBirth: null, shapeIcon: null, colourToken: null },
];

function snapshot(learnerId = 'lrn1') {
  const learner = learners.find((l) => l.id === learnerId)!;
  return buildSnapshot(learner, []);
}

function renderRoute(overrides: Partial<React.ComponentProps<typeof ConstellationRoute>> = {}) {
  return render(
    <ToastProvider>
      <ConstellationRoute
        learners={learners}
        learnerId="lrn1"
        snap={snapshot()}
        dlosByThread={dlosByThread}
        onSelectLearner={vi.fn()}
        {...overrides}
      />
    </ToastProvider>,
  );
}

describe('parseFocus (deep links)', () => {
  it('resolves a real Sanity DLO id to thread + dlo focus', () => {
    expect(parseFocus(`dlo.${THREAD_ID}.emerging`)).toEqual({ domain: DOMAIN_KEY, thread: THREAD_ID, dlo: `dlo.${THREAD_ID}.emerging` });
    expect(parseFocus(`dlo.${THREAD_ID}.developing.b`)).toEqual({ domain: DOMAIN_KEY, thread: THREAD_ID, dlo: `dlo.${THREAD_ID}.developing.b` });
  });

  it('still accepts the legacy one-letter tier shape, bare thread ids and domain keys', () => {
    expect(parseFocus(`${THREAD_ID}.e`)).toEqual({ domain: DOMAIN_KEY, thread: THREAD_ID, dlo: `${THREAD_ID}.e` });
    expect(parseFocus(THREAD_ID)).toEqual({ domain: DOMAIN_KEY, thread: THREAD_ID, dlo: null });
    expect(parseFocus(DOMAIN_KEY)).toEqual({ domain: DOMAIN_KEY, thread: null, dlo: null });
  });

  it('falls back to no focus for unknown values', () => {
    expect(parseFocus('dlo.ZZ9.emerging')).toEqual({ domain: null, thread: null, dlo: null });
    expect(parseFocus('nonsense')).toEqual({ domain: null, thread: null, dlo: null });
    expect(parseFocus(null)).toEqual({ domain: null, thread: null, dlo: null });
  });
});

describe('parseView', () => {
  it('defaults to the constellation and maps the retired gallery view onto it', () => {
    expect(parseView(null)).toBe('constellation');
    expect(parseView('gallery')).toBe('constellation');
    expect(parseView('constellation')).toBe('constellation');
    expect(parseView('table')).toBe('table');
    expect(parseView('explore')).toBe('explore');
    expect(parseView('nonsense')).toBe('constellation');
  });
});

describe('ConstellationRoute', () => {
  let replace: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    // Most flows below drive the Table; the constellation default has its own tests.
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams({ view: 'table' }) as ReturnType<typeof useSearchParams>);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('deep links and viewport', () => {
    it('opens straight at depth 4 for a ?focus=dlo.<thread>.<tier> link', () => {
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams({ view: 'table', d: '4', focus: DLO_ID }) as ReturnType<typeof useSearchParams>,
      );
      vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ evidence: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
      renderRoute();
      const nav = screen.getByRole('navigation', { name: 'Depth navigation' });
      expect(nav).toHaveTextContent('Moments');
      expect(nav).toHaveTextContent('Recognises a pattern');
    });

    it('opens on the constellation graph when no view is given', () => {
      vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);
      renderRoute();
      expect(screen.getByRole('radio', { name: /Constellation/ })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('group', { name: /Emma's constellation/ })).toBeInTheDocument();
      // Every thread is a node in the graph.
      expect(screen.getByRole('button', { name: /^Oral Communication\. Thread/ })).toBeInTheDocument();
    });

    it('telescoping from the constellation panel drills to the node and syncs the URL', async () => {
      vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams({ view: 'constellation' }) as ReturnType<typeof useSearchParams>);
      renderRoute();
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${THREADS_BY_ID[THREAD_ID].name}\\. Thread`) }));
      fireEvent.click(screen.getByRole('button', { name: 'Telescope from here' }));
      await waitFor(() => {
        const lastCall = replace.mock.calls.at(-1);
        expect(lastCall?.[0]).toContain('view=constellation');
        expect(lastCall?.[0]).toContain('d=3');
        expect(lastCall?.[0]).toContain(`focus=${THREAD_ID}`);
      });
      expect(screen.getByRole('navigation', { name: 'Depth navigation' })).toHaveTextContent('Learning objectives');
      // Back out to the whole sky from inside the graph.
      fireEvent.click(screen.getByRole('button', { name: /Whole constellation/ }));
      await waitFor(() => expect(screen.queryByText('Learning objectives')).toBeNull());
    });

    it('"Open in table" switches view at the same depth', async () => {
      vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams({ view: 'constellation' }) as ReturnType<typeof useSearchParams>);
      renderRoute();
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${THREADS_BY_ID[THREAD_ID].name}\\. Thread`) }));
      fireEvent.click(screen.getByRole('button', { name: 'Open in table' }));
      await waitFor(() => expect(screen.getByRole('radio', { name: /Table/ })).toHaveAttribute('aria-checked', 'true'));
      expect(await screen.findByRole('button', { name: /confirm you've seen/i })).toBeInTheDocument();
    });
  });

  describe('depth navigation', () => {
    it('starts at depth 1 (domains) by default', () => {
      renderRoute();
      const domainLabel = screen.getAllByRole('button', { name: /Drill into/i })[0];
      expect(domainLabel).toBeInTheDocument();
      // Only the "Domains" step is present at depth 1.
      expect(screen.getByRole('navigation', { name: 'Depth navigation' })).toHaveTextContent('Domains');
      expect(screen.queryByText('Threads')).toBeNull();
    });

    it('drills from domain (1) -> thread (2) -> DLO (3) -> moments (4) via table view', async () => {
      renderRoute();
      // Depth 1 -> 2: tap a domain row.
      const domainRow = screen.getAllByRole('button', { name: /Drill into/i })[0];
      fireEvent.click(domainRow);
      await waitFor(() => expect(screen.getByText('Threads')).toBeInTheDocument());

      // Depth 2 -> 3: click a thread row (rows have role="button").
      const threadRows = screen.getAllByRole('button').filter((b) => b.tagName === 'TR');
      expect(threadRows.length).toBeGreaterThan(0);
      fireEvent.click(threadRows[0]);
      await waitFor(() => expect(screen.getByText('Learning objectives')).toBeInTheDocument());
    });

    it('jump back to an earlier depth via the stepper resets deeper focus', async () => {
      renderRoute();
      const domainRow = screen.getAllByRole('button', { name: /Drill into/i })[0];
      fireEvent.click(domainRow);
      await waitFor(() => expect(screen.getByText('Threads')).toBeInTheDocument());

      const domainsStep = screen.getByRole('button', { name: 'Domains' });
      fireEvent.click(domainsStep);
      await waitFor(() => expect(screen.queryByText('Threads')).toBeNull());
    });

    it('does not allow jumping forward past the current depth', () => {
      renderRoute();
      // At depth 1, only "Domains" is rendered (deeper steps aren't reachable yet).
      expect(screen.queryByRole('button', { name: 'Learning objectives' })).toBeNull();
    });
  });

  describe('view toggle', () => {
    it('switches between table / constellation / explore', () => {
      renderRoute();
      const radiogroup = screen.getByRole('radiogroup', { name: 'View mode' });
      expect(radiogroup).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Table/i })).toHaveAttribute('aria-checked', 'true');

      const constellationRadio = screen.getByRole('radio', { name: /Constellation/i });
      fireEvent.click(constellationRadio);
      expect(constellationRadio).toHaveAttribute('aria-checked', 'true');

      const exploreRadio = screen.getByRole('radio', { name: /Explore/i });
      fireEvent.click(exploreRadio);
      expect(exploreRadio).toHaveAttribute('aria-checked', 'true');
      // Stepper is hidden entirely in explore view.
      expect(screen.queryByRole('navigation', { name: 'Depth navigation' })).toBeNull();
    });
  });

  describe('URL state sync', () => {
    it('reflects view/depth/focus into the query string on navigation', async () => {
      renderRoute();
      replace.mockClear();

      fireEvent.click(screen.getByRole('radio', { name: /Constellation/i }));

      await waitFor(() => {
        const lastCall = replace.mock.calls.at(-1);
        expect(lastCall?.[0]).toContain('view=constellation');
      });
    });

    it('encodes depth + focus once drilled into a domain', async () => {
      renderRoute();
      const domainRow = screen.getAllByRole('button', { name: /Drill into/i })[0];
      fireEvent.click(domainRow);

      await waitFor(() => {
        const lastCall = replace.mock.calls.at(-1);
        expect(lastCall?.[0]).toContain('d=2');
        expect(lastCall?.[0]).toContain(`focus=${DOMAIN_KEY}`);
      });
    });

    it('reads initial view/depth/focus from the URL on mount (legacy ?view=gallery lands on the constellation)', () => {
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams({ view: 'gallery', d: '2', focus: DOMAIN_KEY }) as ReturnType<typeof useSearchParams>,
      );
      renderRoute();
      expect(screen.getByRole('radio', { name: /Constellation/i })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('navigation', { name: 'Depth navigation' })).toHaveTextContent('Threads');
      // Telescoped onto the domain: the graph names its apex.
      expect(screen.getByRole('group', { name: /^Telescope from / })).toBeInTheDocument();
    });
  });

  describe('DLO confirm optimistic override', () => {
    function drillToDlosView() {
      const domainRow = screen.getAllByRole('button', { name: /Drill into/i })[0];
      fireEvent.click(domainRow);
      const threadRows = screen.getAllByRole('button').filter((b) => b.tagName === 'TR');
      fireEvent.click(threadRows[0]);
    }

    it('flips the confirm control optimistically and keeps it on when the POST succeeds', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) })));
      const onDataChanged = vi.fn();
      renderRoute({ onDataChanged });
      drillToDlosView();

      const btn = await screen.findByRole('button', { name: /confirm you've seen/i });
      expect(btn).toHaveAttribute('aria-pressed', 'false');
      fireEvent.click(btn);

      // Optimistic flip happens synchronously.
      expect(btn).toHaveAttribute('aria-pressed', 'true');

      await waitFor(() => expect(onDataChanged).toHaveBeenCalled());
      // Still confirmed after the request resolves successfully.
      expect(screen.getByRole('button', { name: /you confirmed/i })).toHaveAttribute('aria-pressed', 'true');
    });

    it('reverts the optimistic flip and toasts an error when the POST fails', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 500, json: async () => ({}) })));
      renderRoute();
      drillToDlosView();

      const btn = await screen.findByRole('button', { name: /confirm you've seen/i });
      fireEvent.click(btn);

      // Optimistic flip immediately after click.
      expect(screen.getByRole('button', { name: /you confirmed/i })).toBeInTheDocument();

      // Reverts back to unconfirmed once the failed request settles.
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /confirm you've seen/i })).toHaveAttribute('aria-pressed', 'false'),
      );
      await waitFor(() =>
        expect(screen.getByText(/Could not save your confirmation/i)).toBeInTheDocument(),
      );
    });
  });

  describe('learner switch', () => {
    it('resets depth/focus back to 1 when the learner changes', async () => {
      const { rerender } = renderRoute();
      const domainRow = screen.getAllByRole('button', { name: /Drill into/i })[0];
      fireEvent.click(domainRow);
      await waitFor(() => expect(screen.getByText('Threads')).toBeInTheDocument());

      rerender(
        <ToastProvider>
          <ConstellationRoute
            learners={learners}
            learnerId="lrn2"
            snap={snapshot('lrn2')}
            dlosByThread={dlosByThread}
            onSelectLearner={vi.fn()}
          />
        </ToastProvider>,
      );

      await waitFor(() => expect(screen.queryByText('Threads')).toBeNull());
    });
  });
});
