import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { JurisdictionBanner } from './JurisdictionBanner';

function mockSettings(state: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ state }) })),
  );
}

describe('JurisdictionBanner', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('prompts to set state when settings.state is null', async () => {
    mockSettings(null);
    render(<JurisdictionBanner />);
    expect(await screen.findByRole('link', { name: /set your state/i })).toHaveAttribute('href', '/settings');
  });

  it('prompts when state is an empty/whitespace string', async () => {
    mockSettings('   ');
    render(<JurisdictionBanner />);
    expect(await screen.findByRole('link', { name: /set your state/i })).toBeInTheDocument();
  });

  it('renders nothing when state is set', async () => {
    mockSettings('NSW');
    const { container } = render(<JurisdictionBanner />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    // Give the resolved promise a tick; the banner must stay absent.
    await Promise.resolve();
    expect(screen.queryByRole('link', { name: /set your state/i })).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });
});
