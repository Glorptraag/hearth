/**
 * Capabilities page — load-failure honesty.
 *
 * A fetch failure previously fell into "No learners found" or the first-use
 * "Capabilities emerge from logging" zero-state — telling an established
 * family their constellation is empty when a request merely failed. These
 * tests pin the distinction: failure renders a gentle retryable error, never
 * a first-use state.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import CapabilitiesPage from './page';

let latestOnDataChanged: (() => void) | undefined;

vi.mock('./_constellation/ConstellationRoute', () => ({
  ConstellationRoute: (props: { onDataChanged?: () => void; learnerId: string }) => {
    latestOnDataChanged = props.onDataChanged;
    return <div data-testid="constellation" data-learner={props.learnerId} />;
  },
  buildSnapshotFromApi: (learner: { id: string; name: string }) => ({
    learnerId: learner.id,
    name: learner.name,
    observationsByThread: { seed: 1 },
    dloStatusById: {},
  }),
}));
vi.mock('@/lib/sanity/client-read', () => ({
  clientSanityRead: vi.fn(async () => []),
}));

const learnersOk = [{ id: 'learner-1', name: 'Sage', dateOfBirth: null, shapeIcon: null, colourToken: null }];

function mockFetch(handlers: { learners?: () => Promise<Response>; capabilities?: () => Promise<Response> }) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/learners')) {
      return handlers.learners ? handlers.learners() : jsonResponse(learnersOk);
    }
    if (url.includes('/api/capabilities/')) {
      return handlers.capabilities ? handlers.capabilities() : jsonResponse({ activeThreads: [], dloStatus: {} });
    }
    return jsonResponse({});
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  );
}

beforeEach(() => {
  vi.useRealTimers();
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CapabilitiesPage — load failures', () => {
  it('a learners fetch failure renders the retryable error, not "No learners found"', async () => {
    mockFetch({ learners: () => Promise.reject(new Error('network down')) });
    render(<CapabilitiesPage />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't load the constellation/i)).toBeTruthy();
    });
    expect(screen.queryByText(/No learners found/i)).toBeNull();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('a capabilities fetch failure with nothing on screen renders the error, not the first-use zero-state', async () => {
    mockFetch({ capabilities: () => Promise.reject(new Error('500')) });
    render(<CapabilitiesPage />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't load the constellation/i)).toBeTruthy();
    });
    expect(screen.queryByText(/Capabilities emerge from logging/i)).toBeNull();
  });

  it('Try again refetches and recovers', async () => {
    let fail = true;
    const fetchMock = mockFetch({
      capabilities: () => (fail ? Promise.reject(new Error('500')) : jsonResponse({ activeThreads: [], dloStatus: {} })),
    });
    render(<CapabilitiesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    });

    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(screen.getByTestId('constellation')).toBeTruthy();
    });
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes('/api/capabilities/')).length).toBeGreaterThan(1);
  });

  it('the happy path still renders the constellation', async () => {
    mockFetch({});
    render(<CapabilitiesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('constellation')).toBeTruthy();
    });
  });

  it('a failed post-confirm background refetch shows a retryable notice, keeping the stale view', async () => {
    let shouldFail = false;
    const fetchMock = mockFetch({
      capabilities: () =>
        shouldFail
          ? Promise.reject(new Error('500'))
          : jsonResponse({ activeThreads: [], dloStatus: {} }),
    });
    render(<CapabilitiesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('constellation')).toBeTruthy();
    });

    // Simulate ConstellationRoute calling onDataChanged after a DLO confirm,
    // with the background refetch failing this time.
    shouldFail = true;
    latestOnDataChanged?.();

    await waitFor(() => {
      expect(screen.getByText(/couldn[’']t refresh/i)).toBeTruthy();
    });
    // Stale-but-real view stays on screen — not silent, not a zero-state.
    expect(screen.getByTestId('constellation')).toBeTruthy();
    expect(screen.queryByText(/couldn't load the constellation/i)).toBeNull();
    expect(screen.queryByText(/Capabilities emerge from logging/i)).toBeNull();

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    shouldFail = false; // the retry should succeed
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.queryByText(/couldn't refresh/i)).toBeNull();
    });
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes('/api/capabilities/')).length).toBeGreaterThan(2);
  });
});


describe('CapabilitiesPage — learner selection from the URL', () => {
  const two = [
    { id: 'learner-1', name: 'Sage', dateOfBirth: null, shapeIcon: null, colourToken: null },
    { id: 'learner-2', name: 'Ren', dateOfBirth: null, shapeIcon: null, colourToken: null },
  ];

  it('opens on the learner named by ?learner= (the hub carries the selected child across)', async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams({ learner: 'learner-2' }) as ReturnType<typeof useSearchParams>);
    const fetchMock = mockFetch({ learners: () => jsonResponse(two) });
    render(<CapabilitiesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('constellation')).toHaveAttribute('data-learner', 'learner-2');
    });
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('/api/capabilities/learner-2'))).toBe(true);
  });

  it('ignores a ?learner= that is not one of the family\'s children', async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams({ learner: 'someone-else' }) as ReturnType<typeof useSearchParams>);
    mockFetch({ learners: () => jsonResponse(two) });
    render(<CapabilitiesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('constellation')).toHaveAttribute('data-learner', 'learner-1');
    });
  });
});
