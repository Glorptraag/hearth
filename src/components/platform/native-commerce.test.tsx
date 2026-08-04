/**
 * App Store / Play compliance: no digital-purchase affordance in native builds.
 *
 * On the Australian storefront Apple mandates IAP for digital content and
 * offers no external-purchase-link entitlement, and Play treats in-app digital
 * goods the same way. So the Capacitor builds ship with no purchase path at
 * all until IAP lands (see docs/hearth-native-app-plan-v1.md).
 *
 * These tests exist because the failure mode is silent: nothing breaks, CI
 * stays green, and the first signal is a rejection. App Review probes beyond
 * the visible UI, so both halves are pinned here — the button and the route.
 */
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PackDetailCta } from '@/components/pack/PackDetailCta';
import { MarketplaceCard, type SanityPack } from '@/components/screens/MarketplaceCard';
import { NativeProvider } from './NativeProvider';
import { isNativeRequest, NATIVE_UA_MARKER } from '@/lib/platform/native';

const state = {
  libraryIds: new Set<string>(),
  ownedIds: new Set<string>(),
  loading: false,
};

vi.mock('@/hooks/use-library-state', () => ({
  useLibraryState: () => ({ ...state, addToLibrary: vi.fn(async () => ({ ok: true })) }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/analytics/posthog', () => ({ track: vi.fn() }));

beforeEach(() => {
  state.libraryIds = new Set();
  state.ownedIds = new Set();
});
afterEach(cleanup);

function renderIn(isNative: boolean, ui: React.ReactNode) {
  return render(<NativeProvider isNative={isNative}>{ui}</NativeProvider>);
}

const premiumPack: SanityPack = {
  _id: 'pack-1',
  title: 'Ocean Pack',
  availability: 'premium',
  stripePriceId: 'price_1',
};

/** Any wording that reads as commerce. Apple treats a hint like a CTA. */
const PURCHASE_LANGUAGE = /get pack|buy|purchase|checkout|\$|price|coming soon/i;

describe('isNativeRequest', () => {
  it('detects the Capacitor user-agent marker', () => {
    const h = new Headers({ 'user-agent': `Mozilla/5.0 (iPhone) ${NATIVE_UA_MARKER}/1` });
    expect(isNativeRequest(h)).toBe(true);
  });

  it('treats an ordinary browser as web', () => {
    const h = new Headers({ 'user-agent': 'Mozilla/5.0 (Macintosh) Safari/605.1.15' });
    expect(isNativeRequest(h)).toBe(false);
  });

  it('defaults to web when there is no user-agent at all', () => {
    // Safe default: web only ever *adds* purchase affordances.
    expect(isNativeRequest(new Headers())).toBe(false);
  });
});

describe('PackDetailCta — premium pack the family does not own', () => {
  it('offers purchase on web', () => {
    renderIn(false, <PackDetailCta packId="pack-1" packTitle="Ocean Pack" availability="premium" stripePriceId="price_1" />);
    expect(screen.getByRole('button', { name: /get pack/i })).toBeTruthy();
  });

  it('renders no affordance and no purchase language on native', () => {
    const { container } = renderIn(
      true,
      <PackDetailCta packId="pack-1" packTitle="Ocean Pack" availability="premium" stripePriceId="price_1" />,
    );
    // Not a disabled button, not a "buy on the web" note — nothing.
    expect(container.querySelector('button')).toBeNull();
    expect(container.textContent ?? '').not.toMatch(PURCHASE_LANGUAGE);
  });

  it('still hides purchase language when the pack has no Stripe price', () => {
    // The web fallback here is a "Coming soon" button, which is still
    // commerce-adjacent framing for a thing you cannot obtain in the app.
    const { container } = renderIn(
      true,
      <PackDetailCta packId="pack-1" packTitle="Ocean Pack" availability="premium" />,
    );
    expect(container.textContent ?? '').not.toMatch(PURCHASE_LANGUAGE);
  });
});

describe('PackDetailCta — entitlements the family already holds', () => {
  it('keeps "Owned — Add to Library" working on native', () => {
    // Not a purchase: the family already owns this. Removing it would strand
    // a paying customer inside the app.
    state.ownedIds = new Set(['pack-1']);
    renderIn(true, <PackDetailCta packId="pack-1" packTitle="Ocean Pack" availability="premium" stripePriceId="price_1" />);
    expect(screen.getByRole('button', { name: /add to library/i })).toBeTruthy();
  });

  it('keeps membership-included packs addable on native', () => {
    renderIn(true, <PackDetailCta packId="pack-2" packTitle="Included Pack" availability="included" />);
    expect(screen.getByRole('button', { name: /add to library/i })).toBeTruthy();
  });
});

describe('MarketplaceCard — premium pack', () => {
  it('offers purchase on web', () => {
    renderIn(false, <MarketplaceCard pack={premiumPack} inLibrary={false} onAddToLibrary={vi.fn()} onPurchase={vi.fn()} />);
    expect(screen.getByRole('button', { name: /purchase/i })).toBeTruthy();
  });

  it('renders no purchase button on native', () => {
    renderIn(true, <MarketplaceCard pack={premiumPack} inLibrary={false} onAddToLibrary={vi.fn()} onPurchase={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /purchase/i })).toBeNull();
    expect(screen.queryByText(/get pack/i)).toBeNull();
    expect(screen.queryByText(/coming soon/i)).toBeNull();
  });

  it('keeps membership-included packs addable on native', () => {
    const included: SanityPack = { _id: 'pack-2', title: 'Included Pack', availability: 'included' };
    renderIn(true, <MarketplaceCard pack={included} inLibrary={false} onAddToLibrary={vi.fn()} onPurchase={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add .* to your library/i })).toBeTruthy();
  });
});
