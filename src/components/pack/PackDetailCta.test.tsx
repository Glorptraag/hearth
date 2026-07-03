/**
 * PackDetailCta — the owned-pack add path.
 *
 * Pins the fix for the disabled "Owned — Add to Library" button: a family that
 * PURCHASED a premium pack could not add it to their library from the pack
 * detail page (the button rendered disabled). Owned + not-in-library must act.
 */
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PackDetailCta } from './PackDetailCta';

const addToLibrary = vi.fn(async () => ({ ok: true }));
const state = {
  libraryIds: new Set<string>(),
  ownedIds: new Set<string>(),
  loading: false,
};

vi.mock('@/hooks/use-library-state', () => ({
  useLibraryState: () => ({ ...state, addToLibrary }),
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/analytics/posthog', () => ({
  track: vi.fn(),
}));

beforeEach(() => {
  addToLibrary.mockClear();
  state.libraryIds = new Set();
  state.ownedIds = new Set();
});
afterEach(cleanup);

const renderCta = () =>
  render(
    <PackDetailCta packId="pack-1" packTitle="Ocean Pack" availability="premium" stripePriceId="price_1" />,
  );

describe('PackDetailCta — owned premium pack', () => {
  it('owned + not in library renders an ACTIVE add button that adds the pack', () => {
    state.ownedIds = new Set(['pack-1']);
    renderCta();

    const btn = screen.getByRole('button', { name: 'Owned — Add to Library' });
    expect(btn).not.toHaveProperty('disabled', true);
    fireEvent.click(btn);
    expect(addToLibrary).toHaveBeenCalledWith('pack-1');
  });

  it('already in library stays a terminal disabled state', () => {
    state.ownedIds = new Set(['pack-1']);
    state.libraryIds = new Set(['pack-1']);
    renderCta();

    const btn = screen.getByRole('button', { name: 'In Library' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('not owned still offers Get Pack', () => {
    renderCta();
    expect(screen.getByRole('button', { name: 'Get Pack' })).toBeTruthy();
  });
});
